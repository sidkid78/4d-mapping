# Hierarchical RAG

A Retrieval Augmented Generation implementation using LlamaIndex.

## Overview

This module provides functionality to build and query a hierarchical knowledge graph from documents. It uses Azure OpenAI for embeddings and LLM capabilities, organizing information in a 4D coordinate system for enhanced retrieval.

## Key Features

- Hierarchical document parsing with multiple granularity levels
- 4D coordinate system for knowledge organization:
  - x: Domain/Pillar (1-5 scale)
  - y: Hierarchy Level (1-3 scale) 
  - z: Specificity/Branch (1.0-5.0 scale)
  - e: Expertise Level (1-5 scale)
- Persistent storage and loading of indices
- Composable graph structure for multi-level querying

## Functions

- `generate_4d_coordinates`: Generate 4D coordinates for document nodes
- `build_hierarchical_index`: Build hierarchical index from documents
- `query_hierarchical_index`: Query the hierarchical index

## Dependencies

- `llama_index.core`: Core indexing and retrieval functionality
- `llama_index.llms.azure`: Azure OpenAI LLM integration
- `llama_index.embeddings.azure`: Azure OpenAI embeddings
- `dotenv`: Environment variable management

## Example Usage

## Setup

1. Clone the repository: bash
git clone [repository-url]
cd hierarchical_rag


2. Create and activate a virtual environment:
bash
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

3. Install dependencies:

bash

pip install -r requirements.txt


4. Configure environment variables:
- Copy `.env.example` to `.env`
- Fill in your Azure OpenAI credentials

## Usage

1. Place your documents in the `data/` directory

2. Run the RAG system:
ython
from src.rag.hiar_rag import build_hierarchical_index, query_hierarchical_index
Build index
graph = build_hierarchical_index("./data")
Query the system
results = query_hierarchical_index(graph, "Your query here")
## Features

- 4D coordinate system for knowledge organization
- Hierarchical document parsing
- Persistent storage of indices
- Composable graph structure

## Directory Structure

- `src/rag/`: Source code
- `data/`: Directory for document storage
- `tests/`: Test files

## Requirements

- Python 3.8+
- Azure OpenAI API access
- See requirements.txt for full dependencies
