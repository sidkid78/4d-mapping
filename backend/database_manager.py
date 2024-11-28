import sys
import json
from typing import Dict, List, Optional, Tuple
import psycopg2
from neo4j import GraphDatabase
from redis import Redis
import uuid
from datetime import datetime
from openai import AzureOpenAI
import os
from document_processor_and_rag import DocumentProcessor, DocumentMetadata

class DatabaseManager:
    """
    A class to manage database operations across PostgreSQL, Neo4j, and Redis.

    This class provides an interface for performing CRUD operations on regulations
    while maintaining consistency across multiple databases.

    Attributes:
        pg_conn: PostgreSQL connection object
        neo4j_driver: Neo4j driver instance
        redis_conn: Redis connection object

    Args:
        postgres_conn (dict): PostgreSQL connection parameters
        neo4j_conn (dict): Neo4j connection parameters 
        redis_conn (dict): Redis connection parameters
    """

    def __init__(self, postgres_conn, neo4j_conn, redis_conn):
        self.pg_conn = psycopg2.connect(**postgres_conn)
        self.neo4j_driver = GraphDatabase.driver(**neo4j_conn)
        self.redis_conn = Redis(**redis_conn)

        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        if not self.api_key or not self.azure_endpoint:
            raise ValueError("Azure OpenAI credentials not found in environment variables")
        
        try: 
            self.ai_client = AzureOpenAI(
                api_key=self.api_key,
                api_version="2024-08-01-preview",
                azure_endpoint=self.azure_endpoint
            )
        except Exception as e:
            raise ValueError(f"Failed to initialize Azure OpenAI client: {str(e)}")
        
        # Initialize DocumentProcessor
        self.doc_processor = DocumentProcessor({
            "form_recognizer_endpoint": os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT"),
            "form_recognizer_key": os.getenv("AZURE_FORM_RECOGNIZER_KEY"),
            "blob_connection_string": os.getenv("AZURE_BLOB_CONNECTION_STRING"),
            "search_endpoint": os.getenv("AZURE_SEARCH_ENDPOINT"),
            "search_key": os.getenv("AZURE_SEARCH_KEY"),
            "keyvault_url": os.getenv("AZURE_KEYVAULT_URL"),
            "keyvault_key": os.getenv("AZURE_KEYVAULT_KEY"),
            "neo4j_uri": neo4j_conn["uri"],
            "neo4j_user": neo4j_conn["auth"][0],
            "neo4j_password": neo4j_conn["auth"][1]
        })

    def create_regulation(self, regulation_data: Dict) -> str:
        """
        Creates a new regulation entry across PostgreSQL, Neo4j and Redis.

        This method creates a new regulation record in PostgreSQL for structured data storage,
        a corresponding node in Neo4j for relationship management, and caches the data in Redis.

        Args:
            regulation_data (Dict): Dictionary containing regulation details with keys:
                - nuremberg_number (str): The Nuremberg code number
                - name (str): Regulation name
                - original_reference (str): Original document reference
                - sam_tag (str): SAM classification tag
                - content (str): Full regulation content
                - level (str): Regulation level
                - domain (str): Regulatory domain
                - effective_date (datetime): When regulation takes effect

        Returns:
            str: The UUID of the newly created regulation

        Raises:
            Exception: If creation fails in any database, with rollback in PostgreSQL
        """
        regulation_id = str(uuid.uuid4())
    
        try:
            # First, store structured data in PostgreSQL
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                INSERT INTO Regulations (
                    RegulationID, NurembergNumber, Name, 
                    OriginalReference, SAMTag, Content,
                    Level, Domain, EffectiveDate
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    regulation_id,
                    regulation_data['nuremberg_number'],
                    regulation_data['name'],
                    regulation_data['original_reference'],
                    regulation_data['sam_tag'],
                    regulation_data['content'],
                    regulation_data['level'],
                    regulation_data['domain'],
                    regulation_data['effective_date']
                ))
            self.pg_conn.commit()

            # Then, create node in Neo4j for relationship management
            with self.neo4j_driver.session() as session:
                session.run("""
                    CREATE (r:Regulation {
                    RegulationID: $reg_id,
                    NurembergNumber: $nuremberg,
                    Name: $name,
                    Level: $level
                })
                """, {
                    'reg_id': regulation_id,
                    'nuremberg': regulation_data['nuremberg_number'],
                    'name': regulation_data['name'],
                    'level': regulation_data['level']
                })

            # Cache the regulation data
            cache_key = f"regulation:{regulation_id}"
            self.redis_conn.setex(
                cache_key,
                3600,  # Cache for 1 hour
                str(regulation_data)
            )

            return regulation_id

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to create regulation: {str(e)}")

    def get_regulation(self, regulation_id: str) -> Optional[Dict]:
        """
        Retrieves a regulation by ID from the database.

        Args:
            regulation_id (str): The UUID of the regulation to retrieve

        Returns:
            Optional[Dict]: Regulation data if found, None otherwise
        """
        # Try cache first
        cache_key = f"regulation:{regulation_id}"
        cached_data = self.redis_conn.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        try:
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT RegulationID, NurembergNumber, Name, 
                           OriginalReference, SAMTag, Content,
                           Level, Domain, EffectiveDate
                    FROM Regulations
                    WHERE RegulationID = %s
                """, (regulation_id,))
                
                result = cursor.fetchone()
                if not result:
                    return None

                regulation = {
                    'regulation_id': result[0],
                    'nuremberg_number': result[1],
                    'name': result[2],
                    'original_reference': result[3],
                    'sam_tag': result[4],
                    'content': result[5],
                    'level': result[6],
                    'domain': result[7],
                    'effective_date': result[8].isoformat() if result[8] else None
                }

                # Cache the result
                self.redis_conn.setex(cache_key, 3600, json.dumps(regulation))
                return regulation

        except Exception as e:
            raise Exception(f"Failed to fetch regulation: {str(e)}")

    def get_all_regulations(self) -> List[Dict]:
        """
        Retrieves all regulations from the database.

        Returns:
            List[Dict]: List of all regulations
        """
        try:
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT RegulationID, NurembergNumber, Name, 
                           OriginalReference, SAMTag, Content,
                           Level, Domain, EffectiveDate
                    FROM Regulations
                """)
                
                regulations = []
                for result in cursor.fetchall():
                    regulation = {
                        'regulation_id': result[0],
                        'nuremberg_number': result[1],
                        'name': result[2],
                        'original_reference': result[3],
                        'sam_tag': result[4],
                        'content': result[5],
                        'level': result[6],
                        'domain': result[7],
                        'effective_date': result[8].isoformat() if result[8] else None
                    }
                    regulations.append(regulation)

                return regulations

        except Exception as e:
            raise Exception(f"Failed to fetch regulations: {str(e)}")

    def update_regulation(self, regulation_id: str, regulation_data: Dict) -> bool:
        """
        Updates an existing regulation.

        Args:
            regulation_id (str): The UUID of the regulation to update
            regulation_data (Dict): Updated regulation data

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE Regulations
                    SET NurembergNumber = %s,
                        Name = %s,
                        OriginalReference = %s,
                        SAMTag = %s,
                        Content = %s,
                        Level = %s,
                        Domain = %s,
                        EffectiveDate = %s
                    WHERE RegulationID = %s
                """, (
                    regulation_data['nuremberg_number'],
                    regulation_data['name'],
                    regulation_data['original_reference'],
                    regulation_data['sam_tag'],
                    regulation_data['content'],
                    regulation_data['level'],
                    regulation_data['domain'],
                    regulation_data['effective_date'],
                    regulation_id
                ))

            # Update Neo4j
            with self.neo4j_driver.session() as session:
                session.run("""
                    MATCH (r:Regulation {RegulationID: $reg_id})
                    SET r.NurembergNumber = $nuremberg,
                        r.Name = $name,
                        r.Level = $level
                """, {
                    'reg_id': regulation_id,
                    'nuremberg': regulation_data['nuremberg_number'],
                    'name': regulation_data['name'],
                    'level': regulation_data['level']
                })

            # Invalidate cache
            self.redis_conn.delete(f"regulation:{regulation_id}")
            
            self.pg_conn.commit()
            return True

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to update regulation: {str(e)}")

    def delete_regulation(self, regulation_id: str) -> bool:
        """
        Deletes a regulation and its relationships.

        Args:
            regulation_id (str): The UUID of the regulation to delete

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Delete from PostgreSQL
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM Regulations
                    WHERE RegulationID = %s
                """, (regulation_id,))

            # Delete from Neo4j
            with self.neo4j_driver.session() as session:
                session.run("""
                    MATCH (r:Regulation {RegulationID: $reg_id})
                    DETACH DELETE r
                """, {'reg_id': regulation_id})

            # Remove from cache
            self.redis_conn.delete(f"regulation:{regulation_id}")
            
            self.pg_conn.commit()
            return True

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to delete regulation: {str(e)}")

    def create_crosswalk(self, source_id: str, target_id: str, crosswalk_type: str) -> bool:
        """
        Creates a crosswalk relationship between two regulations.

        Args:
            source_id (str): Source regulation UUID
            target_id (str): Target regulation UUID
            crosswalk_type (str): Type of relationship

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create relationship in Neo4j
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (source:Regulation {RegulationID: $source_id})
                    MATCH (target:Regulation {RegulationID: $target_id})
                    CREATE (source)-[r:CROSSWALK {type: $type}]->(target)
                    RETURN r
                """, {
                    'source_id': source_id,
                    'target_id': target_id,
                    'type': crosswalk_type
                })

                if not result.single():
                    raise Exception("Failed to create crosswalk relationship")

            # Store in PostgreSQL for querying
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO Crosswalks (
                        SourceRegulationID,
                        TargetRegulationID,
                        CrosswalkType,
                        CreatedAt
                    ) VALUES (%s, %s, %s, %s)
                """, (source_id, target_id, crosswalk_type, datetime.now()))

            self.pg_conn.commit()
            return True

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to create crosswalk: {str(e)}")

    def get_regulation_with_crosswalks(self, regulation_id: str) -> Optional[Dict]:
        """
        Retrieves a regulation with its crosswalks.

        Args:
            regulation_id (str): The UUID of the regulation

        Returns:
            Optional[Dict]: Regulation data with crosswalks if found, None otherwise
        """
        try:
            # Get regulation data
            regulation = self.get_regulation(regulation_id)
            if not regulation:
                return None

            # Get crosswalks from Neo4j
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (r:Regulation {RegulationID: $reg_id})
                    OPTIONAL MATCH (r)-[c:CROSSWALK]->(target:Regulation)
                    RETURN target.RegulationID as related_id,
                           target.Name as related_name,
                           c.type as relationship_type
                """, {'reg_id': regulation_id})

                crosswalks = []
                for record in result:
                    if record['related_id']:
                        crosswalks.append({
                            'related_id': record['related_id'],
                            'related_name': record['related_name'],
                            'relationship_type': record['relationship_type']
                        })

            regulation['crosswalks'] = crosswalks
            return regulation

        except Exception as e:
            raise Exception(f"Failed to fetch regulation with crosswalks: {str(e)}")

    async def process_and_store_regulation(self, content: bytes, filename: str) -> str:
        """
        Process a new regulatory document and store it in the system.
        
        Args:
            content: Raw document content
            filename: Name of the document file
            
        Returns:
            str: The UUID of the stored regulation
        """
        try:
            # Process document through DocumentProcessor
            doc_result = await self.doc_processor.process_document(content, filename)
            
            # Convert to regulation data format
            regulation_data = {
                'nuremberg_number': doc_result['metadata']['nuremberg_number'],
                'name': filename,
                'original_reference': doc_result['doc_id'],
                'sam_tag': doc_result['metadata'].get('source', ''),
                'content': content.decode('utf-8'),
                'level': str(doc_result['metadata']['expertise_level']),
                'domain': doc_result['metadata'].get('doc_type', ''),
                'effective_date': datetime.now()
            }
            
            # Store regulation using existing method
            regulation_id = self.create_regulation(regulation_data)
            
            # Store 4D coordinates in Neo4j
            if doc_result['metadata'].get('coordinates_4d'):
                with self.neo4j_driver.session() as session:
                    session.run("""
                    MATCH (r:Regulation {RegulationID: $reg_id})
                    SET r.coordinates_4d = $coordinates
                    """, {
                        'reg_id': regulation_id,
                        'coordinates': doc_result['metadata']['coordinates_4d']
                    })
            
            return regulation_id
            
        except Exception as e:
            raise Exception(f"Failed to process and store regulation: {str(e)}")