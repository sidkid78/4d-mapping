from typing import Dict, List, Optional
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
import numpy as np
from backend.model.model_types import Coordinates4D, SearchDocument
from advanced_ai_engine import AdvancedAIEngine

class RAGAgent:
    """
    RAGAgent integrates Azure OpenAI and Azure Search to process queries,
    perform semantic searches, and generate advanced visualizations and insights.

    Attributes:
        search_client (SearchClient): Client for Azure Search operations.
        openai (AzureOpenAI): Client for Azure OpenAI operations.
        deployment_name (str): Name of the OpenAI deployment.
        advanced_engine (AdvancedAIEngine): Engine for advanced AI analysis.
    """

    def __init__(self, config: Dict[str, str]):
        """
        Initialize RAGAgent with configuration for Azure services.

        Args:
            config (Dict[str, str]): Configuration dictionary containing:
                - azure_search_endpoint: Endpoint for Azure Search.
                - azure_search_key: API key for Azure Search.
                - azure_openai_key: API key for Azure OpenAI.
                - azure_openai_endpoint: Endpoint for Azure OpenAI.
                - azure_openai_deployment_name: Deployment name for OpenAI.
        """
        self.search_client = SearchClient(
            endpoint=config["azure_search_endpoint"],
            index_name="documents",
            credential=AzureKeyCredential(config["azure_search_key"])
        )
        
        self.openai = AzureOpenAI(
            api_key=config["azure_openai_key"],
            api_version="2024-08-01-preview",
            azure_endpoint=config["azure_openai_endpoint"]
        )
        
        self.deployment_name = config["azure_openai_deployment_name"]
        
        # Initialize Advanced AI Engine
        self.advanced_engine = AdvancedAIEngine(config)

    async def process_query(self, query: str, expertise_level: int) -> Dict:
        """
        Process a query to retrieve semantic search results and advanced insights.

        Args:
            query (str): The query string to process.
            expertise_level (int): Expertise level for advanced analysis.

        Returns:
            Dict: A dictionary containing the query, semantic results, visualization data,
                  explanation tree, and response.
        """
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
        """
        Construct a prompt for generating a detailed response based on query and documents.

        Args:
            query (str): The query string.
            documents (List[Dict]): List of document dictionaries.

        Returns:
            str: A formatted prompt string.
        """
        return f"""
        Query: {query}

        Context:
        {chr(10).join(doc["content"] for doc in documents)}

        Please provide a detailed response based on the above context.
        """

    def _generate_visualization(self, documents: List[Dict], query_embedding: List[float], advanced_insights: Dict) -> Dict:
        """
        Generate visualization data including nodes, edges, and heatmap.

        Args:
            documents (List[Dict]): List of document dictionaries.
            query_embedding (List[float]): Embedding vector for the query.
            advanced_insights (Dict): Insights from advanced analysis.

        Returns:
            Dict: Visualization data including space mapping and heatmap.
        """
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
        """
        Calculate the relevance score between two vectors.

        Args:
            v1 (List[float]): First vector.
            v2 (List[float]): Second vector.

        Returns:
            float: Relevance score as a cosine similarity.
        """
        if not v1 or not v2:
            return 0.0
        return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

    def _generate_edges(self, nodes: List[Dict]) -> List[Dict]:
        """
        Generate edges between nodes based on coordinate similarity.

        Args:
            nodes (List[Dict]): List of node dictionaries.

        Returns:
            List[Dict]: List of edge dictionaries with source, target, and weight.
        """
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
        """
        Generate a heatmap matrix based on document categories and requirements.

        Args:
            documents (List[Dict]): List of document dictionaries.

        Returns:
            Dict: Heatmap data including matrix, categories, and requirements.
        """
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
        """
        Generate an explanation tree for the query analysis.

        Args:
            query (str): The query string.
            documents (List[Dict]): List of document dictionaries.

        Returns:
            Dict: Explanation tree with steps, reasoning, confidence, and evidence.
        """
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