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
                api_version="2024-10-01-preview",
                azure_endpoint=self.azure_endpoint
            )
        except Exception as e:
            raise ValueError(f"Failed to initialize Azure OpenAI client: {str(e)}")
        
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