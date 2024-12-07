"""
Data Pipeline Module

This module provides functionality for fetching, processing and mapping regulatory data
from multiple sources into a unified 4D spatial representation.

Components:
- DataPipeline: Main class for data ingestion and processing
- Integration with Federal Register API
- Integration with Regulations.gov API 
- Integration with internal clause and regulation databases

Key Features:
- Fetches regulatory documents from Federal Register and Regulations.gov
- Retrieves regulatory clauses and regulations from internal databases
- Maps regulatory data to 4D spatial coordinates using Nuremberg numbers
- Processes and unifies data from multiple sources
- Handles API authentication and error cases

Example:
    # Initialize pipeline
    pipeline = DataPipeline(config)
    
    # Fetch and process data
    processed_data = await pipeline.fetch_and_process_data()

Dependencies:
    - aiohttp for async HTTP requests
    - SpaceMapper for 4D spatial mapping
    - Configuration for API credentials
"""

from typing import Dict, List
import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from space_mapper import SpaceMapper, Coordinates4D

class DataPipeline:
    def __init__(self, config: Dict):
        self.config = config
        self.space_mapper = SpaceMapper(config)
        self.logger = logging.getLogger(__name__)
        self.federal_register_base_url = "https://www.federalregister.gov/api/v1"
        self.regulations_gov_base_url = "https://api.regulations.gov/v4"
        self.regulations_gov_api_key = config.get('regulations_gov_api_key')

    async def process_regulatory_data(self, raw_data: List[Dict]) -> List[Dict]:
        """
        Process raw regulatory data and map it to 4D space.
        """
        processed_data = []
        for item in raw_data:
            nuremberg_number = item.get('nuremberg_number')
            if nuremberg_number:
                coordinates = self.space_mapper.nuremberg_to_4d(nuremberg_number)
                if coordinates:
                    processed_item = {
                        **item,
                        '4d_coordinates': {
                            'x': coordinates.x,
                            'y': coordinates.y,
                            'z': coordinates.z,
                            'e': coordinates.e
                        }
                    }
                    processed_data.append(processed_item)

        return processed_data

    async def fetch_and_process_data(self) -> List[Dict]:
        """
        Fetch data from various sources and process it.
        """
        federal_register_data = await self.fetch_federal_register_data()
        regulations_gov_data = await self.fetch_regulations_gov_data()
        clause_data = await self.fetch_clause_data()
        regulation_data = await self.fetch_regulation_data()

        all_data = federal_register_data + regulations_gov_data + clause_data + regulation_data

        processed_data = await self.process_regulatory_data(all_data)

        return processed_data

    async def fetch_federal_register_data(self) -> List[Dict]:
        """
        Fetch regulatory documents from the Federal Register API.
        Returns a list of documents with metadata.
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            async with aiohttp.ClientSession() as session:
                query_params = {
                    'conditions[publication_date][gte]': start_date.strftime('%Y-%m-%d'),
                    'conditions[publication_date][lte]': end_date.strftime('%Y-%m-%d'),
                    'conditions[type][]': ['RULE', 'PROPOSED_RULE', 'NOTICE'],
                    'per_page': 100,
                    'order': 'newest'
                }
                
                url = f"{self.federal_register_base_url}/documents"
                
                async with session.get(url, params=query_params) as response:
                    if response.status == 200:
                        data = await response.json()
                        documents = []
                        
                        for doc in data.get('results', []):
                            processed_doc = {
                                'title': doc.get('title'),
                                'document_number': doc.get('document_number'),
                                'publication_date': doc.get('publication_date'),
                                'document_type': doc.get('type'),
                                'abstract': doc.get('abstract'),
                                'agencies': [agency.get('name') for agency in doc.get('agencies', [])],
                                'nuremberg_number': self._generate_nuremberg_number(doc),
                                'url': doc.get('html_url')
                            }
                            documents.append(processed_doc)
                            
                        return documents
                    else:
                        self.logger.error(f"Federal Register API returned status {response.status}")
                        return []
                        
        except Exception as e:
            self.logger.error(f"Error fetching Federal Register data: {str(e)}")
            return []

    async def fetch_clause_data(self) -> List[Dict]:
        """
        Fetch regulatory clauses from the database.
        Returns a list of clauses with metadata.
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.config['clause_api_url']}/clauses"
                
                params = {
                    'status': 'active',
                    'limit': 1000,
                    'include_metadata': True
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        clauses = []
                        
                        for clause in data.get('clauses', []):
                            processed_clause = {
                                'id': clause.get('id'),
                                'title': clause.get('title'),
                                'text': clause.get('text'),
                                'category': clause.get('category'),
                                'jurisdiction': clause.get('jurisdiction'),
                                'effective_date': clause.get('effective_date'),
                                'last_updated': clause.get('last_updated'),
                                'dependencies': clause.get('dependencies', []),
                                'metadata': clause.get('metadata', {}),
                                'nuremberg_number': self._generate_nuremberg_number(clause)
                            }
                            clauses.append(processed_clause)
                            
                        return clauses
                    else:
                        self.logger.error(f"Clause API returned status {response.status}")
                        return []
                        
        except Exception as e:
            self.logger.error(f"Error fetching clause data: {str(e)}")
            return []

    async def fetch_regulation_data(self) -> List[Dict]:
        # TODO: Implement fetching regulation data
        pass

    async def fetch_regulations_gov_data(self) -> List[Dict]:
        """
        Fetch regulatory documents from the Regulations.gov API.
        Returns a list of documents with metadata.
        """
        try:
            if not self.regulations_gov_api_key:
                self.logger.error("Regulations.gov API key not configured")
                return []

            async with aiohttp.ClientSession() as session:
                headers = {
                    "X-Api-Key": self.regulations_gov_api_key,
                    "Accept": "application/json"
                }

                params = {
                    "filter[postedDate][ge]": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                    "filter[documentType]": "Notice,Rule,Proposed Rule",
                    "page[size]": 50,
                    "sort": "-postedDate"
                }

                url = f"{self.regulations_gov_base_url}/documents"

                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        documents = []

                        for doc in data.get('data', []):
                            attributes = doc.get('attributes', {})
                            processed_doc = {
                                'title': attributes.get('title'),
                                'document_number': doc.get('id'),
                                'publication_date': attributes.get('postedDate'),
                                'document_type': attributes.get('documentType'),
                                'abstract': attributes.get('summary'),
                                'agencies': [attributes.get('agencyName')] if attributes.get('agencyName') else [],
                                'nuremberg_number': self._generate_nuremberg_number(attributes),
                                'url': attributes.get('fileFormats', {}).get('pdf'),
                                'docket_id': attributes.get('docketId'),
                                'comment_count': attributes.get('commentCount'),
                                'comment_end_date': attributes.get('commentEndDate')
                            }
                            documents.append(processed_doc)

                        return documents
                    else:
                        self.logger.error(f"Regulations.gov API returned status {response.status}")
                        return []

        except Exception as e:
            self.logger.error(f"Error fetching Regulations.gov data: {str(e)}")
            return []