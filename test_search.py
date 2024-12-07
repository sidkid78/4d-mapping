from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from openai import AzureOpenAI
import os

# Initialize the OpenAI client for embeddings
openai_client = AzureOpenAI(
    api_key="8ec992fbf7f04b648a961c22aa1b38dd",  # From your .env
    api_version="2024-08-01-preview",
    azure_endpoint="https://openai-procurity-ai.openai.azure.com"  # From your .env
)

# Initialize the search client
search_client = SearchClient(
    endpoint="https://sksearchdev.search.windows.net",
    index_name="documents",
    credential=AzureKeyCredential("nRgpiKwRUiLR29TGWbAwZubVu6XUbxhTYJjzTDN5yXAzSeCeeU0t")
)

# Get embeddings for a test document
response = openai_client.embeddings.create(
    input="This is a sample document about regulatory compliance in healthcare.",
    model="text-embedding-3-small"  # Make sure this matches your deployment
)
embedding = response.data[0].embedding

# Sample document with embeddings
sample_document = {
    "id": "doc1",
    "content": "This is a sample document about regulatory compliance in healthcare.",
    "metadata": "{'source': 'test', 'date': '2024-03-20'}",
    "embedding": embedding
}

# Upload the document
try:
    result = search_client.upload_documents([sample_document])
    print(f"Upload result: {result[0].succeeded}")
    
    # Test vector search
    vector_query = openai_client.embeddings.create(
        input="healthcare regulations",
        model="text-embedding-3-small"
    ).data[0].embedding
    
    # Updated vector search syntax
    results = search_client.search(
        search_text="*",  # Use "*" for all documents
        select="id,content",
        vector_queries=[{
            "vector": vector_query,
            "k": 1,
            "fields": "embedding",
            "kind": "vector"
        }]
    )
    
    for result in results:
        print(f"\nFound document: {result['content']}")
        
except Exception as e:
    print(f"Error: {str(e)}")