from typing import Dict, List, Optional
import yaml
import re
import logging
from datetime import datetime
import hashlib
from azure.storage.blob import BlobServiceClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from space_mapper import SpaceMapper, Coordinates4D
import asyncio

class DataPipeline:
    def __init__(self, config: Dict):
        self.config = config
        self.space_mapper = SpaceMapper(config)
        
        # Initialize Azure clients if credentials provided in config
        if 'azure' in config:
            azure_config = config['azure']
            if 'blob' in azure_config:
                self.blob_service = BlobServiceClient.from_connection_string(
                    azure_config['blob']['connection_string']
                )
            if 'form_recognizer' in azure_config:
                self.form_recognizer = DocumentAnalysisClient(
                    endpoint=azure_config['form_recognizer']['endpoint'],
                    credential=AzureKeyCredential(azure_config['form_recognizer']['key'])
                )
            if 'search' in azure_config:
                self.search_client = SearchClient(
                    endpoint=azure_config['search']['endpoint'],
                    index_name="regulations",
                    credential=AzureKeyCredential(azure_config['search']['key'])
                )
        
        self.logger = logging.getLogger(__name__)

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
        # Fetch data from different sources
        federal_register_data = await self.fetch_federal_register_data()
        clause_data = await self.fetch_clause_data()
        regulation_data = await self.fetch_regulation_data()

        # Combine all data
        all_data = federal_register_data + clause_data + regulation_data

        # Process the combined data
        processed_data = await self.process_regulatory_data(all_data)

        return processed_data

    async def fetch_federal_register_data(self) -> List[Dict]:
        """
        Fetch data from Federal Register API.
        """
        try:
            # TODO: Implement Federal Register API client
            return []
        except Exception as e:
            self.logger.error(f"Error fetching Federal Register data: {str(e)}")
            return []

    async def fetch_clause_data(self) -> List[Dict]:
        """
        Fetch clause data from database.
        """
        try:
            # TODO: Implement clause database client
            return []
        except Exception as e:
            self.logger.error(f"Error fetching clause data: {str(e)}")
            return []

    async def fetch_regulation_data(self) -> List[Dict]:
        """
        Fetch regulation data from search index.
        """
        try:
            if hasattr(self, 'search_client'):
                results = self.search_client.search(search_text="*")
                return [dict(result) for result in results]
            return []
        except Exception as e:
            self.logger.error(f"Error fetching regulation data: {str(e)}")
            return []

    def process_document(self, document_content: str, source_type: str) -> Dict:
        """
        Process incoming documents and generate metadata.
        """
        try:
            # Clean and standardize content
            cleaned_content = self._preprocess_document(document_content)
            
            # Extract metadata using Form Recognizer if available
            metadata = self._extract_metadata(cleaned_content, source_type)
            
            # Generate identifiers
            nuremberg_number = self._generate_nuremberg_number(metadata)
            sam_tag = self._generate_sam_tag(metadata)
            
            # Create YAML structure
            yaml_content = self._generate_yaml(
                content=cleaned_content,
                metadata=metadata,
                nuremberg_number=nuremberg_number,
                sam_tag=sam_tag
            )
            
            # Validate and store
            self._validate_data(yaml_content)
            self._store_and_index(yaml_content)
            
            return yaml_content

        except Exception as e:
            self.logger.error(f"Error processing document: {str(e)}")
            raise

    def _preprocess_document(self, content: str) -> str:
        """Clean and standardize document content."""
        cleaned = re.sub(r'\s+', ' ', content)
        cleaned = cleaned.strip()
        cleaned = cleaned.replace('–', '-').replace('"', '"').replace('"', '"')
        return cleaned

    def _extract_metadata(self, content: str, source_type: str) -> Dict:
        """Extract metadata using Form Recognizer if available."""
        try:
            if hasattr(self, 'form_recognizer'):
                result = self.form_recognizer.begin_analyze_document(
                    "prebuilt-document", content
                ).result()
                
                return {
                    "source_type": source_type,
                    "extraction_date": datetime.utcnow().isoformat(),
                    "document_type": result.doc_type,
                    "confidence_score": result.confidence,
                    "entities": self._extract_entities(result),
                    "keywords": self._extract_keywords(content)
                }
            
            return {"source_type": source_type}

        except Exception as e:
            self.logger.error(f"Metadata extraction failed: {str(e)}")
            return {"source_type": source_type}

    def _generate_yaml(self, content: str, metadata: Dict,
                      nuremberg_number: str, sam_tag: str) -> Dict:
        """Generate YAML structure for document."""
        return {
            "document_id": hashlib.sha256(content.encode()).hexdigest()[:12],
            "nuremberg_number": nuremberg_number,
            "sam_tag": sam_tag,
            "metadata": metadata,
            "content": content,
            "processing_info": {
                "processed_at": datetime.utcnow().isoformat(),
                "pipeline_version": "1.0"
            }
        }

    def _validate_data(self, yaml_content: Dict) -> None:
        """Validate YAML content structure."""
        required_fields = [
            "document_id", "nuremberg_number", "sam_tag",
            "metadata", "content"
        ]
        
        for field in required_fields:
            if field not in yaml_content:
                raise ValueError(f"Missing required field: {field}")

    def _store_and_index(self, yaml_content: Dict) -> None:
        """Store in blob storage and index in search if available."""
        try:
            if hasattr(self, 'blob_service'):
                container_client = self.blob_service.get_container_client("documents")
                blob_name = f"{yaml_content['nuremberg_number']}.yaml"
                yaml_str = yaml.dump(yaml_content, default_flow_style=False)
                container_client.upload_blob(name=blob_name, data=yaml_str, overwrite=True)

            if hasattr(self, 'search_client'):
                self.search_client.upload_documents([{
                    "id": yaml_content['document_id'],
                    "nuremberg_number": yaml_content['nuremberg_number'],
                    "sam_tag": yaml_content['sam_tag'],
                    "content": yaml_content['content'],
                    "metadata": str(yaml_content['metadata'])
                }])

        except Exception as e:
            self.logger.error(f"Storage and indexing failed: {str(e)}")
            raise