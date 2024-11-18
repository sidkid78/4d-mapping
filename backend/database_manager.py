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
        """Creates a new regulation entry in both Postgres and Neo4j"""
        regulation_id = str(uuid.uuid4())
        
        try:
            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO regulations (Regulation_ID, Nuremberg_Number, Name, OriginalReference, SAMTag, Content, Level, Domain, EffectiveDate)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (regulation_id, regulation_data['nuremberg_number'], regulation_data['name'], regulation_data['original_reference'], regulation_data['sam_tag'], regulation_data['content'], regulation_data['level'], regulation_data['domain'], regulation_data['effective_date']))
            self.pg_conn.commit()
            
            with self.neo4j_driver.session() as session:
                session.run("""
                    CREATE (r:Regulation {RegulationID: $id, NurembergNumber: $nuremberg_number, Name: $name, OriginalReference: $original_reference, SAMTag: $sam_tag, Content: $content, Level: $level, Domain: $domain, EffectiveDate: $effective_date})
                """, id=regulation_id, **regulation_data)

    def handle_request(self, request):
        method = request['method']
        params = request['params']

        if method == 'create_crosswalk':
            self.create_crosswalk(params['source_id'], params['target_id'], params['crosswalk_type'])
            return json.dumps({'success': True})
        elif method == 'get_regulation_with_crosswalks':
            regulation = self.get_regulation_with_crosswalks(params['regulation_id'])
            return json.dumps(regulation)
        else:
            return json.dumps({'error': 'Unknown method'})

if __name__ == '__main__':
    # Read connection details from stdin
    connection_details = json.loads(sys.stdin.readline())
    
    db_manager = DatabaseManager(
        connection_details['postgres_conn'],
        connection_details['neo4j_conn'],
        connection_details['redis_conn']
    )

    # Handle incoming requests
    for line in sys.stdin:
        request = json.loads(line)
        result = db_manager.handle_request(request)
        sys.stdout.write(result + '\n')
        sys.stdout.flush()

    db_manager.close()