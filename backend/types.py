from typing import TypedDict, List

class Coordinates4D(TypedDict):
    x: float
    y: float
    z: float
    e: float  # Fourth dimension

class SearchDocument(TypedDict):
    id: str
    content: str
    metadata: dict
    coordinates: Coordinates4D
    embedding: List[float]
    score: float 