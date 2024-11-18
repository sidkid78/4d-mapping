import sys
import json
from typing import Dict, List, Optional, Tuple
import psycopg2
from neo4j import GraphDatabase
from redis import Redis
import uuid
from datetime import datetime

class DatabaseManager:
    def __init__(self, postgres_conn, neo4j_conn, redis_conn):
        self.pg_conn = psycopg2.connect(**postgres_conn)
        self.neo4j_driver = GraphDatabase.driver(**neo4j_conn)
        self.redis_conn = Redis(**redis_conn)
        
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
            self.redis_conn.setex(
                cache_key,
                3600,  # Cache for 1 hour
                str(regulation_data)
            )

            return regulation_id

        except Exception as e:
            self.pg_conn.rollback()
            raise Exception(f"Failed to create regulation: {str(e)}")