"""
Hierarchical RAG (Retrieval Augmented Generation) implementation using LlamaIndex.

This module provides functionality to build and query a hierarchical knowledge graph from documents.
It uses Azure OpenAI for embeddings and LLM capabilities, organizing information in a 4D coordinate
system for enhanced retrieval.

Key Features:
- Hierarchical document parsing with multiple granularity levels
- 4D coordinate system for knowledge organization:
  - x: Domain/Pillar (1-5 scale)
  - y: Hierarchy Level (1-3 scale) 
  - z: Specificity/Branch (1.0-5.0 scale)
  - e: Expertise Level (1-5 scale)
- Persistent storage and loading of indices
- Composable graph structure for multi-level querying

Functions:
    generate_4d_coordinates: Generate 4D coordinates for document nodes
    build_hierarchical_index: Build hierarchical index from documents
    query_hierarchical_index: Query the hierarchical index

Dependencies:
    llama_index.core: Core indexing and retrieval functionality
    llama_index.llms.azure: Azure OpenAI LLM integration
    llama_index.embeddings.azure: Azure OpenAI embeddings
    dotenv: Environment variable management

Example:
    # Initialize environment and models
    load_dotenv()
    llm = AzureOpenAI(...)
    embed_model = AzureOpenAIEmbedding(...)

    # Build or load index
    graph = build_hierarchical_index("./documents")
    
    # Query the index
    results = query_hierarchical_index(graph, "What are the key requirements?")
"""

from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    Settings,
)
from llama_index.core.node_parser import HierarchicalNodeParser 
from llama_index.core.schema import IndexNode, NodeWithScore
from llama_index.core.composability import ComposableGraph
from llama_index.llms.azure_openai import AzureOpenAI
from llama_index.embeddings.azure_openai import AzureOpenAIEmbedding
import logging 
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional  
import os 

# Configure logging
logging.basicConfig(
    filename="rag_agent.log",
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()
logger.info("Loaded environment variables")

os.environ["AZURE_OPENAI_API_KEY"] = os.getenv("AZURE_OPENAI_API_KEY")
os.environ["AZURE_OPENAI_ENDPOINT"] = os.getenv("AZURE_OPENAI_ENDPOINT")
os.environ["AZURE_OPENAI_API_VERSION"] = os.getenv("AZURE_OPENAI_API_VERSION")

# Initialize LLM 
logger.info("Initializing Azure OpenAI LLM")
llm = AzureOpenAI(
    engine="gpt-4o",
    model="gpt-4o",
    temperature=0
)

logger.info("Initializing Azure OpenAI Embeddings")
embed_model = AzureOpenAIEmbedding(
    model="text-embedding-3-small",
    deployment_name="text-embedding-3-small-2",
    api_key=os.getenv("AZURE_OPENAI_EMBEDDING_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_EMBEDDING_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_EMBEDDING_API_VERSION")
)

directory_path = "data"

Settings.llm = llm
Settings.embed_model = embed_model
logger.info("Initialized settings")

def generate_4d_coordinates(node: IndexNode) -> Dict[str, Any]:
    """
    Generate 4D coordinates for a given index node.
    
    Args:
        node (IndexNode): The node to generate coordinates for
        
    Returns:
        Dict[str, Any]: Dictionary containing x,y,z,e coordinates representing:
            x: Domain/Pillar (1-5)
            y: Hierarchy Level (1-3) 
            z: Specificity (1.0-5.0)
            e: Expertise Level (1-5)
    """
    logger.debug(f"Generating 4D coordinates for node: {node.id_}")
    
    # Extract text content and metadata
    text = node.get_content()
    metadata = node.metadata
    
    # Domain/Pillar (x) determination based on content keywords
    domain_keywords = {
        "security": 1,
        "compliance": 2, 
        "technology": 3,
        "operations": 4,
        "governance": 5
    }
    
    x = 1  # Default domain
    for keyword, value in domain_keywords.items():
        if keyword.lower() in text.lower():
            x = value
            break
            
    # Hierarchy Level (y) based on node depth and length
    if len(text) < 200:  # Sentence/small chunk
        y = 1
    elif len(text) < 1000:  # Paragraph
        y = 2
    else:  # Document level
        y = 3
        
    # Specificity (z) based on technical terms and numerical content
    technical_terms = [
        "algorithm", "protocol", "framework", "architecture",
        "implementation", "configuration", "specification"
    ]
    
    technical_term_count = sum(1 for term in technical_terms if term.lower() in text.lower())
    has_numbers = any(char.isdigit() for char in text)
    
    z = 1.0 + (technical_term_count * 0.5) + (1.0 if has_numbers else 0)
    z = min(5.0, z)  # Cap at 5.0
    
    # Expertise Level (e) based on complexity indicators
    expertise_indicators = {
        "basic": ["overview", "introduction", "basic", "fundamental"],
        "intermediate": ["detailed", "specific", "implementation"],
        "advanced": ["complex", "advanced", "technical", "specialized"]
    }
    
    e = 1  # Default expertise level
    for level, indicators in expertise_indicators.items():
        if any(indicator.lower() in text.lower() for indicator in indicators):
            if level == "basic":
                e = 2
            elif level == "intermediate":
                e = 3
            else:
                e = 4
                
    # Adjust expertise level based on technical density
    if technical_term_count > 5:
        e = min(5, e + 1)
    
    coordinates = {
        "x": x,  # Domain/Pillar
        "y": y,  # Hierarchy Level
        "z": z,  # Specificity
        "e": e,  # Expertise Level
    }
    
    logger.debug(f"Generated coordinates for node {node.id_}: {coordinates}")
    return coordinates

def build_hierarchical_index(directory_path: str) -> ComposableGraph:
    """
    Build a hierarchical index from documents in the specified directory.
    
    Args:
        directory_path (str): Path to directory containing documents
        
    Returns:
        ComposableGraph: Hierarchical graph structure containing document indices
    """
    logger.info(f"Building hierarchical index from directory: {directory_path}")
    
    # Load documents 
    documents = SimpleDirectoryReader(directory_path).load_data()
    logger.info(f"Loaded {len(documents)} documents")
    
    # Initialize hierarchical parser
    hier_parser = HierarchicalNodeParser.from_defaults(
        chunk_sizes=[2048, 512, 128],
    )
    logger.info("Initialized hierarchical parser")
    
    # Parse nodes hierarchically 
    nodes = hier_parser.get_nodes_from_documents(documents)
    logger.info(f"Generated {len(nodes)} nodes from documents")
    
    for node in nodes:
        node.metadata["4d_coordinates"] = generate_4d_coordinates(node)
    logger.info("Added 4D coordinates to all nodes")
    
    # Build indices for each level 
    logger.info("Building indices for each level")
    doc_idx = VectorStoreIndex(nodes)
    para_idx = VectorStoreIndex([n for n in nodes if isinstance(n, IndexNode)])
    sent_idx = VectorStoreIndex([n for n in nodes if not isinstance(n, IndexNode)])
    
    # Construct composable graph
    logger.info("Constructing composable graph")
    graph = ComposableGraph.from_indices(
        IndexNode.from_index(doc_idx),
        [
            IndexNode.from_index(para_idx),
            IndexNode.from_index(sent_idx),
        ],
    )
    
    return graph 

def query_hierarchical_index(graph: ComposableGraph, query: str) -> List[NodeWithScore]:
    """
    Query the hierarchical index with a natural language query.
    
    Args:
        graph (ComposableGraph): The hierarchical graph to query
        query (str): Natural language query string
        
    Returns:
        List[NodeWithScore]: List of relevant nodes with their scores and 4D coordinates
    """
    logger.info(f"Querying hierarchical index with: {query}")
    
    # Query the graph 
    query_engine = graph.as_query_engine()
    response = query_engine.query(query)
    
    source_nodes = [] 
    for node in response.source_nodes:
        node_info = {
            "content": node.node.get_content(),
            "4d_coordinates": node.node.metadata.get("4d_coordinates", {}),
            "score": node.score,
        }
        source_nodes.append(node_info)
    
    logger.info(f"Found {len(source_nodes)} relevant nodes")
    return source_nodes

# Create documents directory if it doesn't exist
if not os.path.exists("./documents"):
    os.makedirs("./documents")
    logger.info("Created documents directory")

# Build or load the index
if not os.path.exists("./storage"):
    logger.info("Storage directory not found, building new index")
    graph = build_hierarchical_index("./documents")
    # Save index to disk 
    graph.storage_context.persist("./storage")
    logger.info("Saved index to disk")
else:
    logger.info("Loading existing index from disk")
    # Load index from disk 
    storage_context = StorageContext.from_defaults(persist_dir="./storage")
    graph = ComposableGraph.load_from_disk(
        "composed_graph", storage_context
    )
    logger.info("Successfully loaded index")
    
query = "What are the key requirements for cybersecurity compliance in the financial sector?"
results = query_hierarchical_index(graph, query)

# Print results for 40 coordinates
for i, result in enumerate(results):
    logger.info(f"Result {i + 1}:")
    logger.info(f"Content: {result['content'][:100]}...")
    logger.info(f"4D Coordinates: {result['4d_coordinates']}")
    logger.info(f"Score: {result['score']}") 
    logger.info("")