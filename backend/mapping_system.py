from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging
from neo4j import GraphDatabase
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import math

@dataclass
class Coordinates4D:
    """
    Represents a point in 4D regulatory space.
    
    Attributes:
        x (int): Pillar dimension (1-5) representing major regulatory domains
        y (int): Level dimension (1-4) indicating complexity of regulation
        z (float): Branch and subsection coordinates within a domain
        e (int): Expertise level dimension (1-5) required for comprehension
    """
    x: int  # Pillar
    y: int  # Level 
    z: float  # Branch and Subsection
    e: int  # Expertise Level

class MappingSystem:
    """
    Maps regulatory data to a 4D coordinate system and provides spatial search capabilities.
    
    The system uses Neo4j for graph storage and Azure Search for text search functionality.
    Coordinates are mapped across four dimensions: pillar, level, branch/subsection, and expertise.
    
    Attributes:
        graph_db: Neo4j database driver for graph operations
        search_client: Azure Search client for text search
        logger: Logging instance for error tracking
        pillar_map (dict): Maps regulatory domains to x coordinates
        level_map (dict): Maps complexity levels to y coordinates
        expertise_map (dict): Maps expertise levels to e coordinates
    """
    def __init__(self, neo4j_uri: str, neo4j_auth: Tuple[str, str],
                 search_endpoint: str, search_key: str):
        """
        Initialize the mapping system with database connections.
        
        Args:
            neo4j_uri (str): URI for Neo4j database connection
            neo4j_auth (Tuple[str, str]): Neo4j authentication credentials (username, password)
            search_endpoint (str): Azure Search service endpoint
            search_key (str): Azure Search API key
        """
        self.graph_db = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        self.search_client = SearchClient(
            endpoint=search_endpoint,
            index_name="regulations", 
            credential=AzureKeyCredential(search_key)
        )
        self.logger = logging.getLogger(__name__)
        
        # Initialize mapping dimensions
        self.pillar_map = {
            "SAFETY": 1,
            "QUALITY": 2, 
            "COMPLIANCE": 3,
            "OPERATIONS": 4,
            "GOVERNANCE": 5
        }
        
        self.level_map = {
            "FOUNDATIONAL": 1,
            "INTERMEDIATE": 2,
            "ADVANCED": 3,
            "EXPERT": 4
        }
        
        self.expertise_map = {
            "ENTRY": 1,
            "INTERMEDIATE": 2,
            "ADVANCED": 3,
            "EXPERT": 4,
            "SPECIALIST": 5
        }

    def map_coordinates(self, data: Dict) -> Optional[Coordinates4D]:
        """
        Map input data to 4D coordinates based on regulatory domain.
        
        Args:
            data (Dict): Input data containing domain, complexity, section, subsection and expertise
                        fields for coordinate mapping
        
        Returns:
            Optional[Coordinates4D]: 4D coordinates if mapping successful, None if error occurs
        
        Raises:
            ValueError: If input data contains invalid pillar, level or expertise values
        """
        try:
            # Extract key attributes
            pillar = data.get("domain", "").upper()
            level = data.get("complexity", "").upper()
            branch = data.get("section", 0)
            subsection = data.get("subsection", 0)
            expertise = data.get("expertise", "").upper()

            # Validate and map coordinates
            if pillar not in self.pillar_map:
                raise ValueError(f"Invalid pillar: {pillar}")
            if level not in self.level_map:
                raise ValueError(f"Invalid level: {level}")
            if expertise not in self.expertise_map:
                raise ValueError(f"Invalid expertise: {expertise}")

            # Calculate z coordinate from branch and subsection
            z_coord = float(f"{branch}.{subsection}")

            return Coordinates4D(
                x=self.pillar_map[pillar],
                y=self.level_map[level],
                z=z_coord,
                e=self.expertise_map[expertise]
            )

        except Exception as e:
            self.logger.error(f"Error mapping coordinates: {str(e)}")
            return None

    def calculate_distance(self, coord1: Coordinates4D, coord2: Coordinates4D) -> float:
        """
        Calculate Euclidean distance between two 4D coordinates.
        
        Args:
            coord1 (Coordinates4D): First coordinate point
            coord2 (Coordinates4D): Second coordinate point
            
        Returns:
            float: Euclidean distance between the two points
        """
        return math.sqrt(
            (coord1.x - coord2.x) ** 2 +
            (coord1.y - coord2.y) ** 2 +
            (coord1.z - coord2.z) ** 2 +
            (coord1.e - coord2.e) ** 2
        )

    def find_nearest_neighbors(self, coord: Coordinates4D, k: int = 5) -> List[Dict]:
        """
        Find k-nearest neighbors to given coordinates in the regulatory space.
        
        Args:
            coord (Coordinates4D): Reference coordinates to search from
            k (int, optional): Number of nearest neighbors to return. Defaults to 5.
            
        Returns:
            List[Dict]: List of k nearest regulations with their distances, empty list if error occurs
        """
        try:
            with self.graph_db.session() as session:
                results = session.run("""
                    MATCH (r:Regulation)
                    WITH r, 
                    sqrt(
                        (r.X - $x)^2 + 
                        (r.Y - $y)^2 + 
                        (r.Z - $z)^2 + 
                        (r.E - $e)^2
                    ) as distance
                    ORDER BY distance ASC
                    LIMIT $k
                    RETURN r, distance
                    """,
                    x=coord.x,
                    y=coord.y,
                    z=coord.z,
                    e=coord.e,
                    k=k
                )
                
                return [{
                    "regulation": dict(record["r"]),
                    "distance": record["distance"]
                } for record in results]

        except Exception as e:
            self.logger.error(f"Error finding nearest neighbors: {str(e)}")
            return []