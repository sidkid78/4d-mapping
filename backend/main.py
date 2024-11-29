from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import uvicorn
from dotenv import load_dotenv
from rag_agent import RAGAgent
from advanced_ai_engine import AdvancedAIEngine

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

# Initialize RAG
rag_agent = RAGAgent({
    "search_endpoint": os.getenv("AZURE_SEARCH_ENDPOINT"),
    "search_key": os.getenv("AZURE_SEARCH_KEY"),
    "openai_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
    "openai_key": os.getenv("AZURE_OPENAI_KEY"),
    "deployment_name": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
})

class QueryRequest(BaseModel):
    query: str
    expertise_level: int
    use_advanced: bool = False  # Flag to use advanced features

@app.post("/api/rag/query")
async def process_query(request: QueryRequest):
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
    try:
        result = await rag_agent.advanced_engine.analyze(
            query=request.query,
            expertise_level=request.expertise_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Allows external access
        port=8000,       # Default FastAPI port
        reload=True      # Auto-reload on code changes
    )