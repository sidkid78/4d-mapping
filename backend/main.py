from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import os
import uvicorn
from dotenv import load_dotenv
from backend.rag.rag_agent import RAGAgent
from backend.model.model_types import Coordinates4D, SearchDocument

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Validate environment variables
required_env_vars = [
    "AZURE_SEARCH_ENDPOINT",
    "AZURE_SEARCH_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_KEY",
    "AZURE_OPENAI_DEPLOYMENT_NAME"
]

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

vector_store_client = SearchClient(
    endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
    index_name="documents",
    credential=AzureKeyCredential(os.getenv("AZURE_SEARCH_KEY"))
)

# Initialize RAG
rag_agent = RAGAgent({
    'azure_openai_key': os.getenv("AZURE_OPENAI_KEY"),
    'azure_openai_endpoint': os.getenv("AZURE_OPENAI_ENDPOINT"),
    'azure_search_endpoint': os.getenv("AZURE_SEARCH_ENDPOINT"),
    'azure_search_key': os.getenv("AZURE_SEARCH_KEY"),
    'azure_openai_deployment_name': os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
    'gpt_model': 'gpt-4o',
    'vector_store': vector_store_client,
    'coordinate_search_radius': 1.0,
    'max_coordinate_results': 10,
    'max_search_results': 10
})

class QueryRequest(BaseModel):
    """
    Represents a query request for the RAG system.

    Attributes:
        query (str): The query string to be processed.
        expertise_level (int): The level of expertise required for the query.
        use_advanced (bool): Flag indicating whether to use advanced features.
    """
    query: str
    expertise_level: int
    use_advanced: bool = False

@app.post("/api/rag/query")
async def process_query(request: QueryRequest):
    """
    Endpoint to process a query using the RAG system.

    Args:
        request (QueryRequest): The query request containing the query string and expertise level.

    Returns:
        The result of the query processing.

    Raises:
        HTTPException: If an error occurs during query processing.
    """
    try:
        result = await rag_agent.process_query(
            request.query,
            request.expertise_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/advanced/analyze")
async def analyze_advanced(request: QueryRequest):
    """
    Endpoint to perform advanced analysis on a query.

    Args:
        request (QueryRequest): The query request containing the query string and expertise level.

    Returns:
        The result of the advanced analysis.

    Raises:
        HTTPException: If an error occurs during advanced analysis.
    """
    try:
        result = await rag_agent.advanced_engine.analyze(
            query=request.query,
            expertise_level=request.expertise_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service status.

    Returns:
        A dictionary indicating the service status.
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Allows external access
        port=8000,       # Default FastAPI port
        reload=True      # Auto-reload on code changes
    )