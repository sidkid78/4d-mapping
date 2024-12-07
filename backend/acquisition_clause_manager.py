from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass
from datetime import datetime, UTC
import uuid
import yaml
import logging
from neo4j import GraphDatabase
import psycopg2
from azure.search.documents import SearchClient
from azure.keyvault.keys import KeyClient
from azure.core.credentials import AzureKeyCredential
import numpy as np
from sentence_transformers import SentenceTransformer

@dataclass
class Clause:
    """Represents an acquisition clause with its metadata and analysis.
    
    Attributes:
        clause_id: Unique identifier for the clause
        nuremberg_number: Standardized Nuremberg reference number
        sam_tag: System for Award Management (SAM) tag
        original_reference: Original document reference
        original_name: Original name/title of the clause
        content: Full text content of the clause
        effective_date: Date when clause becomes effective
        domain: Domain/category the clause belongs to
        level: Complexity/importance level (1-5)
        coordinates: Semantic coordinates for clause positioning
        related_regulations: List of related regulatory documents
        ai_personas: List of AI personas for analysis
    """
    clause_id: str
    nuremberg_number: str 
    sam_tag: str
    original_reference: str
    original_name: str
    content: str
    effective_date: datetime
    domain: str
    level: int
    coordinates: Tuple[int, int]
    related_regulations: List[Dict]
    ai_personas: List[str]

class AcquisitionClauseManager:
    """Manages acquisition clauses including storage, indexing, and analysis.
    
    This class provides functionality for:
    - Storing and retrieving clauses from PostgreSQL database
    - Indexing clauses in Azure Cognitive Search
    - Generating unique identifiers (Nuremberg numbers and SAM tags)
    - Calculating semantic coordinates for clauses
    - Managing AI personas for clause analysis
    - Reconciling analysis results from multiple AI personas

    Attributes:
        config: Configuration dictionary for services and connections
        logger: Logging instance for error tracking
        model: SentenceTransformer model for text embeddings
        pg_conn: PostgreSQL database connection
        graph_db: Neo4j graph database connection
        search_client: Azure Cognitive Search client
        key_client: Azure Key Vault client
    """

    def __init__(self, config: Dict) -> None:
        """Initialize the AcquisitionClauseManager.
        
        Args:
            config: Dictionary containing configuration parameters for all services
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self._init_connections(config)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def _init_connections(self, config: Dict) -> None:
        """Initialize database and service connections.
        
        Args:
            config: Dictionary containing connection parameters for all services
        """
        self.pg_conn = psycopg2.connect(**config["postgresql"])
        self.graph_db = GraphDatabase.driver(**config["neo4j"])
        
        self.search_client = SearchClient(
            endpoint=config["search_endpoint"],
            index_name="clauses",
            credential=AzureKeyCredential(config["search_key"])
        )
        
        self.key_client = KeyClient(
            vault_url=config["keyvault_url"],
            credential=AzureKeyCredential(config["keyvault_key"])
        )

    async def _store_entry(self, entry: Dict) -> None:
        """Store entry data in PostgreSQL database.
        
        Args:
            entry: Dictionary containing entry data to store
            
        Raises:
            Exception: If database operation fails
        """
        try:
            with self.pg_conn.cursor() as cur:
                cur.execute(
                    """
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
                        datetime.now(UTC),
                        datetime.now(UTC)
                    )
                )
                self.pg_conn.commit()
        except Exception as e:
            self.pg_conn.rollback()
            raise

    async def _index_entry(self, entry: Dict) -> None:
        """Index entry in Azure Cognitive Search.
        
        Args:
            entry: Dictionary containing entry data to index
            
        Raises:
            Exception: If indexing operation fails
        """
        try:
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

    def _generate_identifier(self, content: str, prefix: str, hash_length: int = 4) -> str:
        """Generate identifier (Nuremberg number or SAM tag) from content.
        
        Args:
            content: Text content to generate identifier from
            prefix: Prefix for the identifier
            hash_length: Length of hash component in identifier
            
        Returns:
            Generated identifier string
            
        Raises:
            Exception: If identifier generation fails
        """
        try:
            embedding = self.model.encode(content)
            hash_value = hash(str(embedding[:5].tolist())) % (10 ** hash_length)
            return f"{prefix}-{hash_value:0{hash_length}d}"
        except Exception as e:
            self.logger.error(f"Failed to generate {prefix} identifier: {str(e)}")
            raise

    def _generate_nuremberg_number(self, content: str) -> str:
        """Generate Nuremberg number based on content analysis.
        
        Args:
            content: Text content to generate Nuremberg number from
            
        Returns:
            Generated Nuremberg number
        """
        return self._generate_identifier(content, "NB")

    def _generate_sam_tag(self, clause_data: Dict) -> str:
        """Generate SAM tag based on clause data.
        
        Args:
            clause_data: Dictionary containing clause information
            
        Returns:
            Generated SAM tag
            
        Raises:
            Exception: If SAM tag generation fails
        """
        try:
            domain_prefix = clause_data["domain"][:3].upper()
            level_component = f"L{clause_data['level']}"
            content_hash = hash(str(self.model.encode(clause_data["content"])[:3].tolist())) % 1000
            return f"{domain_prefix}-{level_component}-{content_hash:03d}"
        except Exception as e:
            self.logger.error(f"Failed to generate SAM tag: {str(e)}")
            raise

    def _generate_coordinates(self, content: str) -> Tuple[int, int]:
        """Generate semantic coordinates using embeddings.
        
        Args:
            content: Text content to generate coordinates from
            
        Returns:
            Tuple of (x, y) coordinates
            
        Raises:
            Exception: If coordinate generation fails
        """
        try:
            embedding = self.model.encode(content)
            return (int(embedding[0] * 100), int(embedding[1] * 100))
        except Exception as e:
            self.logger.error(f"Failed to generate coordinates: {str(e)}")
            raise

    def _get_ai_persona(self, role: str) -> Dict:
        """Get appropriate AI persona configuration for analysis.
        
        Args:
            role: Role identifier for the AI persona
            
        Returns:
            Dictionary containing persona configuration
        """
        personas = {
            "legal": {
                "model": "gpt-4o",
                "temperature": 0.3,
                "system_prompt": "You are a legal expert analyzing acquisition clauses."
            },
            "technical": {
                "model": "gpt-4o",
                "temperature": 0.2,
                "system_prompt": "You are a technical expert analyzing implementation details."
            },
            "compliance": {
                "model": "gpt-4o",
                "temperature": 0.1,
                "system_prompt": "You are a compliance expert verifying regulatory adherence."
            }
        }
        return personas.get(role, {
            "model": "gpt-4o",
            "temperature": 0.5,
            "system_prompt": "You are an AI assistant analyzing acquisition clauses."
        })

    async def _reconcile_analysis_results(self, results: List[Dict]) -> Dict:
        """Reconcile analysis results from multiple AI personas.
        
        Args:
            results: List of analysis results from different personas
            
        Returns:
            Dictionary containing reconciled analysis
            
        Raises:
            Exception: If reconciliation fails
        """
        try:
            findings = self._process_findings(results)
            avg_confidence = self._calculate_confidence(results)
            recommendations = self._deduplicate_recommendations(results)
            
            return {
                "findings": findings,
                "confidence": avg_confidence,
                "recommendations": recommendations,
                "timestamp": datetime.now(UTC).isoformat()
            }
        except Exception as e:
            self.logger.error(f"Failed to reconcile analysis: {str(e)}")
            raise

    def _process_findings(self, results: List[Dict]) -> List[Dict]:
        """Process and deduplicate findings from analysis results.
        
        Args:
            results: List of analysis results containing findings
            
        Returns:
            List of deduplicated findings
        """
        findings = []
        seen_embeddings = set()
        
        for result in results:
            for finding in result.get("findings", []):
                finding["embedding"] = self.model.encode(finding["text"])
                embedding_key = tuple(finding["embedding"].round(2))
                if embedding_key not in seen_embeddings:
                    findings.append(finding)
                    seen_embeddings.add(embedding_key)
        
        return findings

    def _calculate_confidence(self, results: List[Dict]) -> float:
        """Calculate average confidence score from results.
        
        Args:
            results: List of analysis results containing confidence scores
            
        Returns:
            Average confidence score
        """
        confidence_scores = [result.get("confidence", 0) for result in results]
        return sum(confidence_scores) / len(confidence_scores)

    def _deduplicate_recommendations(self, results: List[Dict]) -> List[str]:
        """Deduplicate recommendations from results.
        
        Args:
            results: List of analysis results containing recommendations
            
        Returns:
            List of deduplicated recommendations
        """
        seen_recommendations = set()
        recommendations = []
        
        for result in results:
            for rec in result.get("recommendations", []):
                rec_text = str(rec)
                if rec_text not in seen_recommendations:
                    recommendations.append(rec)
                    seen_recommendations.add(rec_text)
        
        return recommendations