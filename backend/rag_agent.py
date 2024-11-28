from typing import Dict, List
import asyncio
from space_mapper import SpaceMapper, Coordinates4D
from query_engine import QueryEngine
from openai import embeddings 

class RAGAgent:
    """
    A Retrieval-Augmented Generation (RAG) agent that processes queries using 4D space mapping and semantic search.

    This agent combines semantic search, 4D coordinate mapping, and document retrieval to provide
    context-aware responses to queries. It uses Azure OpenAI embeddings and a custom query engine.

    Attributes:
        config (Dict): Configuration dictionary containing Azure and model settings
        space_mapper (SpaceMapper): Component for mapping content to 4D coordinates
        query_engine (QueryEngine): Component for processing semantic and coordinate-based queries

    Example:
        ```python
        config = {
            'azure_endpoint': 'https://...',
            'azure_deployment': 'deployment-name'
        }
        agent = RAGAgent(config)
        result = await agent.process_query("What are the cybersecurity requirements?", context)
        ```
    """

    def __init__(self, config: Dict):
        """
        Initialize the RAG agent with configuration settings.

        Args:
            config (Dict): Configuration dictionary containing Azure endpoints and model settings
        """
        self.config = config
        self.space_mapper = SpaceMapper(config)
        self.query_engine = QueryEngine(config)

    async def process_query(self, query: str, context: Dict) -> Dict:
        """
        Process a query using 4D space mapping and RAG techniques.

        Args:
            query (str): The user's query text
            context (Dict): Additional context for query processing

        Returns:
            Dict: Results containing:
                - query: Original query text
                - semantic_results: Results from semantic search
                - relevant_documents: Retrieved relevant documents
                - response: Generated RAG response

        Raises:
            Exception: If embedding generation or query processing fails
        """
        # Generate query embedding
        query_embedding = await self.generate_embedding(query)

        # Perform semantic search in 4D space
        semantic_results = await self.query_engine.semantic_query(query, context)

        # Retrieve relevant documents based on 4D coordinates
        relevant_docs = await self.retrieve_relevant_documents(semantic_results)

        # Generate response using RAG
        response = await self.generate_rag_response(query, relevant_docs)

        return {
            'query': query,
            'semantic_results': semantic_results,
            'relevant_documents': relevant_docs,
            'response': response
        }

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embeddings for input text using Azure OpenAI.

        Args:
            text (str): Input text to embed

        Returns:
            List[float]: Vector embedding of the input text

        Raises:
            Exception: If embedding generation fails
        """
        embedding = OpenAIEmbeddings(
            model="text-embedding-3-small",
            azure_endpoint=self.config['azure_endpoint'],
            azure_deployment=self.config['azure_deployment']
        )
        return embedding.get_text_embedding(text)

    async def retrieve_relevant_documents(self, semantic_results: List[Dict]) -> List[Dict]:
        """
        Retrieve documents based on semantic search results and 4D coordinates.

        Args:
            semantic_results (List[Dict]): Results from semantic search containing 4D coordinates

        Returns:
            List[Dict]: List of relevant documents with their metadata

        Raises:
            Exception: If document retrieval fails
        """
        relevant_docs = []
        for result in semantic_results:
            coordinates = Coordinates4D(
                x=result['4d_coordinates']['x'],
                y=result['4d_coordinates']['y'],
                z=result['4d_coordinates']['z'],
                e=result['4d_coordinates']['e']
            )
            docs = await self.query_engine.coordinate_query(coordinates)
            relevant_docs.extend(docs)
        return relevant_docs

    async def generate_rag_response(self, query: str, relevant_docs: List[Dict]) -> str:
        """
        Generate a response using retrieved documents and RAG techniques.

        Args:
            query (str): Original query text
            relevant_docs (List[Dict]): Retrieved relevant documents

        Returns:
            str: Generated response incorporating document context

        Raises:
            Exception: If RAG response generation fails
        """
        rag_response = await self.query_engine.rag_query(query, relevant_docs)
        return rag_response