from llama_index.core import VectorStoreIndex, Document, Settings
from llama_index.core.node_parser import SimpleNodeParser, SentenceSplitter
from llama_index.readers.file import (
    DocxReader,
    PDFReader,
    PandasExcelReader,
    JSONReader,
    CSVReader,
    ImageReader,
    FaissReader
)
from llama_index.readers.database import DatabaseReader  
from llama_index.tools.notion import NotionToolSpec
from llama_index.readers.semanticscholar import SemanticScholarReader
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.vector_stores import AzureVectorSearch
from llama_index.core.text_splitter import TokenTextSplitter
from typing import List, Dict, Optional, Union
import os
from pathlib import Path
import magic  # for file type detection
import pandas as pd
import tempfile
import shutil

class DocumentProcessor:
    """Handles document processing and chunking."""
    def __init__(self, chunk_size: int = 1024, chunk_overlap: int = 20):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.supported_extensions = {
            '.pdf': PDFReader(),
            '.docx': DocxReader(),
            '.xlsx': PandasExcelReader(),
            '.csv': CSVReader(),
            '.json': JSONReader(),
            '.jpg': ImageReader(),
            '.jpeg': ImageReader(),
            '.png': ImageReader(),
        }
        
    def process_file(self, file_path: Union[str, Path]) -> List[Document]:
        """Process a single file based on its type."""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Use python-magic to detect file type
        file_type = magic.from_file(str(file_path), mime=True)
        extension = file_path.suffix.lower()
        
        # Get appropriate reader
        reader = self.supported_extensions.get(extension)
        if not reader:
            raise ValueError(f"Unsupported file type: {extension}")
            
        # Process file based on type
        try:
            if extension in ['.xlsx', '.csv']:
                df = pd.read_excel(file_path) if extension == '.xlsx' else pd.read_csv(file_path)
                documents = [Document(text=str(row)) for _, row in df.iterrows()]
            else:
                documents = reader.load_data(file_path=str(file_path))
            
            # Apply chunking
            text_splitter = TokenTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap
            )
            chunked_documents = []
            for doc in documents:
                chunks = text_splitter.split_text(doc.text)
                chunked_documents.extend([
                    Document(
                        text=chunk,
                        metadata={
                            **doc.metadata,
                            'chunk_index': i
                        }
                    ) for i, chunk in enumerate(chunks)
                ])
            
            return chunked_documents
            
        except Exception as e:
            raise Exception(f"Error processing file {file_path}: {str(e)}")

class EnhancedRAGAgent:
    def __init__(
        self,
        azure_openai_key: str,
        azure_endpoint: str,
        azure_deployment: str,
        chunk_size: int = 1024,
        chunk_overlap: int = 20,
        **kwargs
    ):
        # Previous initialization code remains the same
        super().__init__(azure_openai_key, azure_endpoint, azure_deployment, **kwargs)
        
        # Initialize document processor
        self.doc_processor = DocumentProcessor(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
    def upload_files(
        self,
        file_paths: Union[str, List[str]],
        source_name: str,
        batch_size: int = 100
    ):
        """
        Upload and process multiple files.
        
        Args:
            file_paths: Single file path or list of file paths
            source_name: Name for this document source
            batch_size: Number of documents to process at once
        """
        if isinstance(file_paths, str):
            file_paths = [file_paths]
            
        all_documents = []
        
        # Process files in batches
        for i in range(0, len(file_paths), batch_size):
            batch_paths = file_paths[i:i + batch_size]
            batch_documents = []
            
            for file_path in batch_paths:
                try:
                    documents = self.doc_processor.process_file(file_path)
                    batch_documents.extend(documents)
                    self.logger.info(f"Successfully processed {file_path}")
                except Exception as e:
                    self.logger.error(f"Error processing {file_path}: {str(e)}")
                    continue
            
            all_documents.extend(batch_documents)
            
        if all_documents:
            self._process_documents(all_documents, source_name)
            self.logger.info(
                f"Successfully indexed {len(all_documents)} documents for {source_name}"
            )
        else:
            raise ValueError("No documents were successfully processed")
            
    def upload_directory(
        self,
        directory_path: str,
        source_name: str,
        recursive: bool = True,
        file_extensions: Optional[List[str]] = None
    ):
        """
        Upload all supported files from a directory.
        
        Args:
            directory_path: Path to directory
            source_name: Name for this document source
            recursive: Whether to search subdirectories
            file_extensions: List of file extensions to process (e.g., ['.pdf', '.docx'])
        """
        directory_path = Path(directory_path)
        if not directory_path.exists():
            raise NotADirectoryError(f"Directory not found: {directory_path}")
            
        # Get all files
        if recursive:
            files = list(directory_path.rglob('*'))
        else:
            files = list(directory_path.glob('*'))
            
        # Filter by extension if specified
        if file_extensions:
            files = [f for f in files if f.suffix.lower() in file_extensions]
            
        # Filter out directories
        files = [f for f in files if f.is_file()]
        
        if not files:
            raise ValueError("No suitable files found in directory")
            
        self.upload_files(files, source_name)
        
    def upload_text(self, texts: Union[str, List[str]], source_name: str):
        """
        Upload raw text content.
        
        Args:
            texts: Single text string or list of text strings
            source_name: Name for this document source
        """
        if isinstance(texts, str):
            texts = [texts]
            
        documents = []
        text_splitter = TokenTextSplitter(
            chunk_size=self.doc_processor.chunk_size,
            chunk_overlap=self.doc_processor.chunk_overlap
        )
        
        for i, text in enumerate(texts):
            chunks = text_splitter.split_text(text)
            documents.extend([
                Document(
                    text=chunk,
                    metadata={'text_index': i, 'chunk_index': j}
                ) for j, chunk in enumerate(chunks)
            ])
            
        self._process_documents(documents, source_name)

# Example usage
if __name__ == "__main__":
    agent = EnhancedRAGAgent(
        azure_openai_key="your-azure-key",
        azure_endpoint="your-azure-endpoint",
        azure_deployment="your-deployment-name",
        chunk_size=1024,  # Adjust based on your needs
        chunk_overlap=20
    )
    
    # Upload a single file
    agent.upload_files(
        "path/to/document.pdf",
        source_name="company_docs"
    )
    
    # Upload multiple files
    agent.upload_files(
        ["doc1.pdf", "doc2.docx", "data.xlsx"],
        source_name="mixed_docs"
    )
    
    # Upload an entire directory
    agent.upload_directory(
        "path/to/docs",
        source_name="all_docs",
        recursive=True,
        file_extensions=['.pdf', '.docx', '.xlsx']
    )
    
    # Upload raw text
    agent.upload_text(
        "This is some important information...",
        source_name="text_content"
    )