# RAG (Retrieval Augmented Generation) Backend System

## Overview

This system implements an advanced RAG architecture using Azure services for regulatory document analysis and querying. It combines semantic search, 4D coordinate mapping, and AI-driven analysis to provide context-aware responses.

## Core Components

### 1. RAG Agent
The main RAG implementation is split across multiple components:

- **RAGAgent Class**: Primary interface for query processing and document retrieval
  - Located in: `backend/rag/rag_agent.py`
  - Handles semantic search, embeddings, and response generation
  - Integrates with Azure OpenAI and Azure Cognitive Search

### 2. Algorithm of Thought
- Implements systematic reasoning approach for regulatory analysis
- Located in: `backend/algorithm_of_thought.py`
- Features:
  - Multi-state workflow
  - Context-aware processing
  - Expert persona selection
  - Compliance verification

### 3. Hierarchical RAG
- Provides hierarchical document parsing and querying
- Located in: `backend/hierarchical_rag/`
- Features:
  - 4D coordinate system for knowledge organization:
    - x: Domain/Pillar (1-5 scale)
    - y: Hierarchy Level (1-3 scale)
    - z: Specificity/Branch (1.0-5.0 scale)
    - e: Expertise Level (1-5 scale)

## Setup Requirements

### Environment Variables
env
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=

### Dependencies
- Azure OpenAI
- Azure Cognitive Search
- FastAPI
- LlamaIndex
- Neo4j (optional)
- PostgreSQL

## API Endpoints

### RAG Query Endpoint
python
POST /api/rag
Request body:
json
{
"query": "string",
"userContext": {
"expertise_level": number
}
}
## Architecture

### Document Processing Pipeline
1. Document ingestion and preprocessing
2. Metadata extraction
3. 4D coordinate mapping
4. Vector embedding generation
5. Storage in Azure Cognitive Search

### Query Processing Pipeline
1. Query embedding generation
2. Semantic search in 4D space
3. Context enrichment
4. Expert persona selection
5. Response generation with source attribution

## Integration

### Frontend Integration
The system integrates with Next.js frontend components:
- RAG Chat Interface (`src/components/rag-chat.tsx`)
- Query Interface (`src/components/rag-query-interface.tsx`)

### Database Integration
- Azure Cognitive Search for vector storage
- Neo4j for knowledge graph (optional)
- PostgreSQL for structured data

## Usage Example
python
from backend.rag.rag_agent import RAGAgent
Initialize RAG agent
rag_agent = RAGAgent({
'azure_openai_key': os.getenv("AZURE_OPENAI_KEY"),
'azure_openai_endpoint': os.getenv("AZURE_OPENAI_ENDPOINT"),
'azure_search_endpoint': os.getenv("AZURE_SEARCH_ENDPOINT"),
'azure_search_key': os.getenv("AZURE_SEARCH_KEY"),
'azure_openai_deployment_name': os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
})
Process query
result = await rag_agent.process_query(
query="What are the GDPR requirements for fintech?",
expertise_level=3
)
## Maintenance

### Data Updates
Use the provided scripts to update the knowledge base:
- `scripts/load-initial-data.ts`: Load initial document set
- `scripts/fetch-regulations.ts`: Fetch and update regulations

### Performance Monitoring
Monitor system performance through:
- Azure Application Insights
- Custom logging in `backend/ai_engine.log`

## Contributing
1. Follow the existing code structure
2. Ensure proper error handling
3. Add appropriate logging
4. Update tests as needed