from typing import Dict, List
from dataclasses import dataclass
import math

@dataclass
class Coordinates4D:
    """
    Represents a point in 4D regulatory space.
    
    Attributes:
        x (float): Pillar dimension (1-5) representing major regulatory domains
        y (float): Level dimension (1-4) indicating complexity
        z (float): Branch/subsection coordinates (0.0-1.0) 
        e (float): Expertise level required (1-5)
    """
    x: float  # Pillar dimension (1-5) representing major regulatory domains
    y: float  # Level dimension (1-4) indicating complexity
    z: float  # Branch/subsection coordinates (0.0-1.0)
    e: float  # Expertise level required (1-5)

class SpaceMapper:
    """
    Maps regulatory documents to points in 4D coordinate space.
    
    The mapper uses document metadata to assign coordinates across four dimensions:
    - Pillar (x): Major regulatory domains like security, privacy, compliance
    - Level (y): Complexity level of the regulation
    - Branch (z): Normalized section/subsection position
    - Expertise (e): Required expertise level
    
    Attributes:
        config (Dict): Configuration parameters
        pillar_map (Dict[str, float]): Maps regulatory domains to x coordinates
        level_map (Dict[str, float]): Maps complexity levels to y coordinates
    """
    def __init__(self, config: Dict):
        """
        Initialize the space mapper with configuration.
        
        Args:
            config (Dict): Configuration containing vector store and search parameters
        """
        self.config = config
        self.pillar_map = {
            'security': 1.0,
            'privacy': 2.0, 
            'compliance': 3.0,
            'governance': 4.0,
            'risk': 5.0
        }
        self.level_map = {
            'basic': 1.0,
            'intermediate': 2.0,
            'advanced': 3.0,
            'expert': 4.0
        }

    async def map_to_coordinates(self, data: Dict) -> Coordinates4D:
        """
        Maps document metadata to 4D coordinates.
        
        Args:
            data (Dict): Document metadata containing domain, complexity, section and expertise info
            
        Returns:
            Coordinates4D: The mapped 4D coordinates for the document
        """
        # Map pillar (x) based on primary domain
        x = self.pillar_map.get(data.get('domain', '').lower(), 3.0)
        
        # Map level (y) based on complexity
        y = self.level_map.get(data.get('complexity', '').lower(), 2.0)
        
        # Map branch/subsection (z) using normalized section numbers
        section = data.get('section', '1.0')
        try:
            z = float(section) / 10.0  # Normalize to 0-1 range
            z = max(0.0, min(1.0, z))  # Clamp to valid range
        except ValueError:
            z = 0.5
            
        # Map expertise (e) based on required knowledge level
        expertise_str = data.get('expertise_required', 'intermediate').lower()
        e = float(self.level_map.get(expertise_str, 3.0))

        return Coordinates4D(x=x, y=y, z=z, e=e)

    async def find_nearest(self, coordinates: Coordinates4D) -> List[Dict]:
        """
        Find nearest neighbors to given coordinates in 4D space.
        
        Uses Euclidean distance to find the closest documents to the target coordinates.
        
        Args:
            coordinates (Coordinates4D): Target coordinates to search around
            
        Returns:
            List[Dict]: List of nearest documents with their distances and metadata, sorted by distance
        """
        # Get search parameters from config
        max_results = self.config.get('max_results', 10)
        vector_store = self.config['vector_store']
        
        # Get all documents from vector store
        all_documents = await vector_store.get_all_documents()
        
        results = []
        for doc in all_documents:
            # Calculate 4D Euclidean distance
            distance = math.sqrt(
                (doc.coordinates.x - coordinates.x) ** 2 +
                (doc.coordinates.y - coordinates.y) ** 2 +
                (doc.coordinates.z - coordinates.z) ** 2 +
                (doc.coordinates.e - coordinates.e) ** 2
            )
            
            results.append({
                'id': doc.id,
                'content': doc.content,
                'metadata': doc.metadata,
                'coordinates': doc.coordinates,
                'distance': distance
            })
            
        # Sort by distance
        results.sort(key=lambda x: x['distance'])
        
        return results[:max_results]

    async def update_mapping(self, data: Dict) -> None:
        """
        Update the coordinate mapping for a document.
        
        Generates new coordinates based on updated metadata and updates the document
        in the vector store.
        
        Args:
            data (Dict): Document data containing:
                - id: Document ID
                - metadata: Updated metadata for mapping
                - content: Document content
        """
        # Generate new coordinates based on updated metadata
        new_coordinates = await self.map_to_coordinates(data['metadata'])
        
        # Update document coordinates in vector store
        vector_store = self.config['vector_store']
        await vector_store.update_coordinates(
            document_id=data['id'],
            coordinates=new_coordinates,
            metadata=data['metadata'],
            content=data['content']
        )