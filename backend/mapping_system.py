from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging
from neo4j import GraphDatabase
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import math

@dataclass
class Coordinates4D:
    x: int  # Pillar
    y: int  # Level
    z: float  # Branch and Subsection
    e: int  # Expertise Level

class MappingSystem:
    def __init__(self, neo4j_uri: str, neo4j_auth: Tuple[str, str], 
                 search_endpoint: str, search_key: str):
        self.graph_db = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        self.search_client = SearchClient(
            endpoint=search_endpoint,
            index_name="regulations",
            credential=AzureKeyCredential(search_key)
        )
        self.logger = logging.getLogger(__name__)
        
        # Expertise level mapping
        self.expertise_mapping = {
            'Bachelors Degree': 1,
            'Masters Degree': 2,
            'PhD': 3,
            'Certification Level 1': 4,
            'Certification Level 2': 5,
            '5+ Years Experience': 6
        }

    def generate_coordinates(self, nuremberg_number: str) -> Optional[Coordinates4D]:
        """
        Generate 4D coordinates from a Nuremberg number.
        """
        try:
            parts = nuremberg_number.split('.')
            if len(parts) != 4:
                raise ValueError("Invalid Nuremberg number format")

            coordinates = Coordinates4D(
                x=int(parts[0]),  # Pillar
                y=int(parts[1]),  # Level
                z=float(f"{parts[2]}.{parts[3]}"),  # Branch and Subsection
                e=self.get_expertise_level(nuremberg_number)
            )
            
            return coordinates

        except Exception as e:
            self.logger.error(f"Error generating coordinates: {str(e)}")
            return None

    def get_expertise_level(self, nuremberg_number: str) -> int:
        """
        Retrieve expertise level from metadata.
        """
        try:
            with self.graph_db.session() as session:
                result = session.run("""
                    MATCH (r:Regulation {NurembergNumber: $number})
                    RETURN r.RequiredExpertise as expertise
                    """, number=nuremberg_number)
                
                record = result.single()
                if record and record["expertise"] in self.expertise_mapping:
                    return self.expertise_mapping[record["expertise"]]
                return 0  # Default expertise level

        except Exception as e:
            self.logger.error(f"Error retrieving expertise level: {str(e)}")
            return 0

    def create_honeycomb_relationship(self, 
                                    source_number: str, 
                                    target_number: str, 
                                    crosswalk_type: str) -> bool:
        """
        Create a honeycomb crosswalk relationship between regulations.
        """
        try:
            with self.graph_db.session() as session:
                result = session.run("""
                    MATCH (r1:Regulation {NurembergNumber: $source})
                    MATCH (r2:Regulation {NurembergNumber: $target})
                    CREATE (r1)-[:CROSSWALK {
                        CrosswalkType: $type,
                        CreatedAt: timestamp()
                    }]->(r2)
                    RETURN true
                    """, 
                    source=source_number,
                    target=target_number,
                    type=crosswalk_type
                )
                return result.single()[0]

        except Exception as e:
            self.logger.error(f"Error creating honeycomb relationship: {str(e)}")
            return False

    def create_spider_web_node(self, 
                             clause_id: str, 
                             name: str, 
                             related_regulations: List[str]) -> bool:
        """
        Create a spider web node with connections to related regulations.
        """
        try:
            with self.graph_db.session() as session:
                # Create the central clause node
                session.run("""
                    CREATE (clause:Provision {
                        ClauseID: $id,
                        Name: $name,
                        CreatedAt: timestamp()
                    })
                    """,
                    id=clause_id,
                    name=name
                )
                
                # Create relationships to regulations
                for reg_number in related_regulations:
                    session.run("""
                        MATCH (clause:Provision {ClauseID: $clause_id})
                        MATCH (reg:Regulation {NurembergNumber: $reg_number})
                        CREATE (clause)-[:RELATED_TO {
                            CreatedAt: timestamp()
                        }]->(reg)
                        """,
                        clause_id=clause_id,
                        reg_number=reg_number
                    )
                
                return True

        except Exception as e:
            self.logger.error(f"Error creating spider web node: {str(e)}")
            return False

    async def coordinate_based_search(self, 
                                    coordinates: Coordinates4D, 
                                    radius: float = 1.0) -> List[Dict]:
        """
        Perform coordinate-based search with expertise filtering.
        """
        try:
            with self.graph_db.session() as session:
                results = session.run("""
                    MATCH (r:Regulation)
                    WHERE 
                        r.X = $x AND
                        r.Y = $y AND
                        abs(r.Z - $z) <= $radius AND
                        r.E <= $e
                    RETURN r
                    """,
                    x=coordinates.x,
                    y=coordinates.y,
                    z=coordinates.z,
                    e=coordinates.e,
                    radius=radius
                )
                
                return [dict(record["r"]) for record in results]

        except Exception as e:
            self.logger.error(f"Error in coordinate search: {str(e)}")
            return []

    async def traverse_crosswalks(self, 
                                start_number: str, 
                                max_depth: int = 3,
                                crosswalk_type: Optional[str] = None) -> List[Dict]:
        """
        Traverse the honeycomb structure following crosswalk relationships.
        """
        try:
            with self.graph_db.session() as session:
                query = """
                    MATCH path = (r:Regulation {NurembergNumber: $number})-[:CROSSWALK*1..$depth]->(related)
                    WHERE $type IS NULL OR 
                          ALL(rel IN relationships(path) WHERE rel.CrosswalkType = $type)
                    RETURN path
                    """
                
                results = session.run(
                    query,
                    number=start_number,
                    depth=max_depth,
                    type=crosswalk_type
                )
                
                paths = []
                for record in results:
                    path = record["path"]
                    paths.append({
                        "nodes": [dict(node) for node in path.nodes],
                        "relationships": [dict(rel) for rel in path.relationships]
                    })
                
                return paths

        except Exception as e:
            self.logger.error(f"Error traversing crosswalks: {str(e)}")
            return []

    async def semantic_search(self, 
                            query: str, 
                            domain: Optional[str] = None,
                            min_expertise: int = 0) -> List[Dict]:
        """
        Perform semantic search using Azure Cognitive Search.
        """
        try:
            filter_condition = None
            if domain:
                filter_condition = f"Domain eq '{domain}'"
            if min_expertise > 0:
                expertise_filter = f"ExpertiseLevel ge {min_expertise}"
                filter_condition = expertise_filter if not filter_condition else f"{filter_condition} and {expertise_filter}"

            results = self.search_client.search(
                search_text=query,
                filter=filter_condition,
                semantic_configuration_name="regulatory-config",
                include_total_count=True,
                highlight_fields="Content"
            )

            return [dict(result) for result in results]

        except Exception as e:
            self.logger.error(f"Error in semantic search: {str(e)}")
            return []