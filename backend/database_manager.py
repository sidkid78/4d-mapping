"""
Database Manager Module

This module provides a unified interface for managing regulatory data across multiple databases:
PostgreSQL for structured data, Neo4j for graph relationships, and Redis for caching.

Components:
- DatabaseManager: Main class handling database operations across PostgreSQL, Neo4j and Redis

Key Features:
- CRUD operations for regulations in PostgreSQL
- Graph relationship management in Neo4j
- Redis caching layer for performance
- Cross-database transaction management
- Automatic UUID generation for regulations

Example:
    # Initialize manager with connection configs
    manager = DatabaseManager(postgres_config, neo4j_config, redis_config)
    
    # Create new regulation
    reg_id = manager.create_regulation({
        'name': 'Safety Protocol 1.2',
        'nuremberg_number': 'NB-123',
        'level': 'Federal'
    })
    
    # Create crosswalk between regulations
    manager.create_crosswalk(source_id, target_id, 'IMPLEMENTS')

Dependencies:
    - PostgreSQL for structured data storage
    - Neo4j for graph relationships
    - Redis for caching layer
"""

from typing import Dict, List, Optional, Tuple
import psycopg2
from neo4j import GraphDatabase
from redis import Redis
import uuid
from datetime import datetime

class DatabaseManager:
    def __init__(self, postgres_conn, neo4j_conn, redis_conn):
        # PostgreSQL for structured data
        self.pg_conn = psycopg2.connect(**postgres_conn)
        
        # Neo4j for graph relationships
        self.neo4j_driver = GraphDatabase.driver(**neo4j_conn)
        
        # Redis for caching
        self.redis = Redis(**redis_conn)

    def create_regulation(self, regulation_data: Dict) -> str:
        """
        Creates a new regulation entry in both PostgreSQL and Neo4j.
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
            self.redis.setex(
                cache_key,
                3600,  # Cache for 1 hour
                str(regulation_data)
            )

            return regulation_id

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to create regulation: {str(e)}")

    def create_crosswalk(self, source_id: str, target_id: str, crosswalk_type: str) -> None:
        """
        Creates a crosswalk relationship between regulations in Neo4j.
        """
        with self.neo4j_driver.session() as session:
            session.run("""
                MATCH (source:Regulation {RegulationID: $source_id})
                MATCH (target:Regulation {RegulationID: $target_id})
                CREATE (source)-[:CROSSWALK {
                    CrosswalkType: $type,
                    CreatedAt: datetime()
                }]->(target)
                """, {
                    'source_id': source_id,
                    'target_id': target_id,
                    'type': crosswalk_type
                })

    def get_regulation_with_crosswalks(self, regulation_id: str) -> Dict:
        """
        Retrieves a regulation with its crosswalks, using cache when available.
        """
        # Try cache first
        cache_key = f"regulation:{regulation_id}"
        cached_data = self.redis.get(cache_key)
        if cached_data:
            return eval(cached_data)  # Convert string back to dict

        # Get base regulation data from PostgreSQL
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM Regulations 
                WHERE RegulationID = %s
                """, (regulation_id,))
            regulation = cursor.fetchone()

        if not regulation:
            raise Exception("Regulation not found")

        # Get crosswalks from Neo4j
        with self.neo4j_driver.session() as session:
            crosswalks = session.run("""
                MATCH (r:Regulation {RegulationID: $reg_id})-[c:CROSSWALK]->(related:Regulation)
                RETURN related.RegulationID as related_id, 
                       related.Name as related_name,
                       c.CrosswalkType as relationship_type
                """, {'reg_id': regulation_id}).data()

        # Combine the data
        regulation_data = {
            'regulation_id': regulation[0],
            'nuremberg_number': regulation[1],
            'name': regulation[2],
            'content': regulation[5],
            'crosswalks': crosswalks
        }

        # Cache the combined data
        self.redis.setex(cache_key, 3600, str(regulation_data))

        return regulation_data

    def close(self):
        """
        Closes all database connections.
        """
        self.pg_conn.close()
        self.neo4j_driver.close()
        self.redis.close()