from typing import Dict, List, Optional
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
import numpy as np
from .model_types import Coordinates4D, SearchDocument
from .advanced_ai_engine import AdvancedAIEngine

class RAGAgent:
    def __init__(self, config: Dict[str, str]):
        self.search_client = SearchClient(
            endpoint=config["search_endpoint"],
            index_name="documents",
            credential=AzureKeyCredential(config["search_key"])
        )
        
        self.openai = AzureOpenAI(
            api_key=config["openai_key"],
            api_version="2024-02-15-preview",
            azure_endpoint=config["openai_endpoint"]
        )
        
        self.deployment_name = config["deployment_name"]
        
        # Initialize Advanced AI Engine
        self.advanced_engine = AdvancedAIEngine(config)

    async def process_query(self, query: str, expertise_level: int) -> Dict:
        # Get embeddings and basic search results
        embedding_response = await self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = embedding_response.data[0].embedding

        # Get advanced analysis
        advanced_results = await self.advanced_engine.analyze(
            query=query,
            expertise_level=expertise_level,
            embeddings=query_embedding
        )

        # Combine with semantic search
        search_results = await self.search_client.search(
            search_text=query,
            select=["id", "content", "metadata", "coordinates", "_score"],
            query_type="semantic",
            semantic_configuration_name="default",
            top=5
        )

        documents = [doc for doc in search_results]

        # Generate visualization data with advanced insights
        visualization_data = self._generate_visualization(
            documents, 
            query_embedding,
            advanced_results.get('insights', {})
        )

        return {
            "query": query,
            "semantic_results": [{
                "id": doc["id"],
                "content": doc["content"],
                "coordinates": doc["coordinates"],
                "relevance_score": doc.get("_score", 0)
            } for doc in documents],
            "visualization_data": visualization_data,
            "explanation_tree": advanced_results.get('explanation_tree', {}),
            "response": advanced_results.get('response', '')
        }

    def _construct_prompt(self, query: str, documents: List[Dict]) -> str:
        return f"""
        Query: {query}

        Context:
        {chr(10).join(doc["content"] for doc in documents)}

        Please provide a detailed response based on the above context.
        """

    def _generate_visualization(self, documents: List[Dict], query_embedding: List[float], advanced_insights: Dict) -> Dict:
        nodes = [{
            "id": doc["id"],
            "coordinates": doc["coordinates"],
            "category": doc["metadata"].get("category", "unknown"),
            "relevance": self._calculate_relevance(
                doc.get("embedding", []), 
                query_embedding
            )
        } for doc in documents]

        edges = self._generate_edges(nodes)
        heatmap = self._generate_heatmap(documents)

        return {
            "space_mapping": {"nodes": nodes, "edges": edges},
            "heatmap_data": heatmap,
            "advanced_insights": advanced_insights
        }

    def _calculate_relevance(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2:
            return 0.0
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def _generate_edges(self, nodes: List[Dict]) -> List[Dict]:
        edges = []
        for i, node in enumerate(nodes):
            for other in nodes[i+1:]:
                edges.append({
                    "source": node["id"],
                    "target": other["id"],
                    "weight": self._calculate_similarity(
                        node["coordinates"],
                        other["coordinates"]
                    )
                })
        return edges

    def _generate_heatmap(self, documents: List[Dict]) -> Dict:
        categories = list(set(doc["metadata"].get("category") for doc in documents))
        requirements = list(set(doc["metadata"].get("requirement") for doc in documents))
        
        matrix = []
        for req in requirements:
            row = []
            for cat in categories:
                relevant_docs = [
                    doc for doc in documents 
                    if doc["metadata"].get("category") == cat and 
                       doc["metadata"].get("requirement") == req
                ]
                row.append(max((doc.get("_score", 0) for doc in relevant_docs), default=0))
            matrix.append(row)
            
        return {
            "matrix": matrix,
            "categories": categories,
            "requirements": requirements
        }

    def _generate_explanation_tree(self, query: str, documents: List[Dict]) -> Dict:
        return {
            "step": "Query Analysis",
            "reasoning": f"Analyzing query: {query}",
            "confidence": 0.9,
            "evidence": [{
                "content": doc["content"][:200],
                "source": doc["id"],
                "relevance": doc.get("_score", 0)
            } for doc in documents[:3]],
            "subSteps": []
        }