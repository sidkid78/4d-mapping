from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import uuid
import yaml
import logging
from neo4j import GraphDatabase
import psycopg2
from azure.search.documents import SearchClient
from azure.keyvault.keys import KeyClient
from azure.core.credentials import AzureKeyCredential
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
import asyncio
from sentence_transformers import SentenceTransformer

@dataclass
class Clause:
    clause_id: str
    nuremberg_number: str
    sam_tag: str
    original_reference: str
    original_name: str
    content: str
    effective_date: datetime
    domain: str
    level: int
    coordinates: tuple
    related_regulations: List[Dict]
    ai_personas: List[str]

class AcquisitionClauseManager:
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize database connections
        self.pg_conn = psycopg2.connect(**config["postgresql"])
        self.graph_db = GraphDatabase.driver(**config["neo4j"])
        
        # Initialize Azure services
        self.search_client = SearchClient(
            endpoint=config["search_endpoint"],
            index_name="clauses",
            credential=AzureKeyCredential(config["search_key"])
        )
        self.key_client = KeyClient(
            vault_url=config["keyvault_url"],
            credential=AzureKeyCredential(config["keyvault_key"])
        )
        
        # Initialize embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    async def _store_entry(self, entry: Dict) -> None:
        """Store entry data in PostgreSQL."""
        try:
            with self.pg_conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO entries (
                        entry_id, title, content, metadata, 
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        entry["id"],
                        entry["title"],
                        entry["content"],
                        yaml.dump(entry["metadata"]),
                        datetime.utcnow(),
                        datetime.utcnow()
                    )
                )
                self.pg_conn.commit()
        except Exception as e:
            self.pg_conn.rollback()
            raise

    async def _index_entry(self, entry: Dict) -> None:
        """Index entry in Azure Cognitive Search."""
        try:
            # Generate embedding vector
            embedding = self.model.encode(entry["content"])
            
            search_entry = {
                "id": entry["id"],
                "title": entry["title"],
                "content": entry["content"],
                "metadata": entry["metadata"],
                "vector": embedding.tolist(),
                "@search.action": "upload"
            }
            
            await self.search_client.upload_documents([search_entry])
            
        except Exception as e:
            self.logger.error(f"Failed to index entry: {str(e)}")
            raise

    def _generate_nuremberg_number(self, content: str) -> str:
        """Generate Nuremberg number based on content analysis."""
        try:
            # Generate embedding
            embedding = self.model.encode(content)
            
            # Use embedding components to generate hash
            hash_value = hash(str(embedding[:5].tolist())) % 10000
            
            # Format Nuremberg number
            return f"NB-{hash_value:04d}"
            
        except Exception as e:
            self.logger.error(f"Failed to generate Nuremberg number: {str(e)}")
            raise

    def _generate_sam_tag(self, clause_data: Dict) -> str:
        """Generate SAM tag based on clause data."""
        try:
            # Extract domain prefix
            domain_prefix = clause_data["domain"][:3].upper()
            
            # Generate level component
            level_component = f"L{clause_data['level']}"
            
            # Generate hash from embedding
            embedding = self.model.encode(clause_data["content"])
            content_hash = hash(str(embedding[:3].tolist())) % 1000
            
            # Combine components
            return f"{domain_prefix}-{level_component}-{content_hash:03d}"
            
        except Exception as e:
            self.logger.error(f"Failed to generate SAM tag: {str(e)}")
            raise

    def _generate_coordinates(self, content: str) -> tuple:
        """Generate semantic coordinates using embeddings."""
        try:
            # Get content embedding
            embedding = self.model.encode(content)
            
            # Use first two dimensions as coordinates
            x = int(embedding[0] * 100)
            y = int(embedding[1] * 100)
            
            return (x, y)
            
        except Exception as e:
            self.logger.error(f"Failed to generate coordinates: {str(e)}")
            raise

    def _get_ai_persona(self, role: str) -> object:
        """Get appropriate AI persona for analysis."""
        personas = {
            "legal": {
                "model": "gpt-3.5-turbo",
                "temperature": 0.3,
                "system_prompt": "You are a legal expert analyzing acquisition clauses."
            },
            "technical": {
                "model": "gpt-3.5-turbo",
                "temperature": 0.2,
                "system_prompt": "You are a technical expert analyzing implementation details."
            },
            "compliance": {
                "model": "gpt-3.5-turbo",
                "temperature": 0.1,
                "system_prompt": "You are a compliance expert verifying regulatory adherence."
            }
        }
        return personas.get(role, {
            "model": "gpt-4",
            "temperature": 0.5,
            "system_prompt": "You are an AI assistant analyzing acquisition clauses."
        })

    async def _reconcile_analysis_results(self, results: List[Dict]) -> Dict:
        """Reconcile analysis results from multiple AI personas."""
        try:
            # Extract key findings and generate embeddings
            findings = []
            for result in results:
                for finding in result.get("findings", []):
                    finding["embedding"] = self.model.encode(finding["text"])
                    findings.append(finding)
            
            # Cluster similar findings
            unique_findings = []
            seen_embeddings = set()
            for finding in findings:
                embedding_key = tuple(finding["embedding"].round(2))
                if embedding_key not in seen_embeddings:
                    unique_findings.append(finding)
                    seen_embeddings.add(embedding_key)
            
            # Average confidence scores
            confidence_scores = [result.get("confidence", 0) for result in results]
            avg_confidence = sum(confidence_scores) / len(confidence_scores)
            
            # Combine recommendations with deduplication
            all_recommendations = []
            seen_recommendations = set()
            for result in results:
                for rec in result.get("recommendations", []):
                    rec_text = str(rec)
                    if rec_text not in seen_recommendations:
                        all_recommendations.append(rec)
                        seen_recommendations.add(rec_text)
            
            return {
                "findings": unique_findings,
                "confidence": avg_confidence,
                "recommendations": all_recommendations,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to reconcile analysis: {str(e)}")
            raise