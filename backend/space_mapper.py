from typing import Dict, List
import numpy as np
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from backend.model.model_types import Coordinates4D

class SpaceMapper:
    def __init__(self, config: Dict[str, str]):
        """
        Initialize the SpaceMapper with configuration for scaling and dimensionality reduction.

        Args:
            config (Dict[str, str]): Configuration dictionary for the SpaceMapper.
        """
        self.scaler = StandardScaler()
        self.tsne = TSNE(
            n_components=4,
            perplexity=30,
            n_iter=1000,
            random_state=42
        )
        
    async def map_to_4d(self, query: str, embeddings: List[float]) -> Coordinates4D:
        """
        Map input embeddings to a 4D coordinate space using t-SNE.

        Args:
            query (str): The query string associated with the embeddings.
            embeddings (List[float]): A list of float values representing the embeddings.

        Returns:
            Coordinates4D: A dictionary containing the 4D coordinates (x, y, z, e).
        """
        embeddings_array = np.array(embeddings).reshape(1, -1)
        scaled_embeddings = self.scaler.fit_transform(embeddings_array)
        coordinates_4d = self.tsne.fit_transform(scaled_embeddings)[0]
        
        return {
            "x": float(coordinates_4d[0]),
            "y": float(coordinates_4d[1]),
            "z": float(coordinates_4d[2]),
            "e": float(coordinates_4d[3])  # Fourth dimension
        }

    def calculate_similarity(self, coords1: Coordinates4D, coords2: Coordinates4D) -> float:
        """
        Calculate the similarity between two 4D coordinates using Euclidean distance.

        Args:
            coords1 (Coordinates4D): The first set of 4D coordinates.
            coords2 (Coordinates4D): The second set of 4D coordinates.

        Returns:
            float: A similarity score between 0 and 1, where 1 indicates identical coordinates.
        """
        v1 = np.array([coords1["x"], coords1["y"], coords1["z"], coords1["e"]])
        v2 = np.array([coords2["x"], coords2["y"], coords2["z"], coords2["e"]])
        return float(1 / (1 + np.linalg.norm(v1 - v2)))