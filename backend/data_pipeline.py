from typing import Dict, List, Optional
import yaml
import re
import logging
from datetime import datetime
import hashlib
from azure.storage.blob import BlobServiceClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

class DataPipeline:
    def __init__(self, blob_conn_str: str, form_recognizer_endpoint: str, 
                 form_recognizer_key: str, search_endpoint: str, search_key: str):
        self.blob_service = BlobServiceClient.from_connection_string(blob_conn_str)
        self.form_recognizer = DocumentAnalysisClient(
            endpoint=form_recognizer_endpoint, 
            credential=AzureKeyCredential(form_recognizer_key)
        )
        self.search_client = SearchClient(
            endpoint=search_endpoint,
            index_name="regulations",
            credential=AzureKeyCredential(search_key)
        )
        self.logger = logging.getLogger(__name__)

    def process_document(self, document_content: str, source_type: str) -> Dict:
        """
        Main pipeline for processing incoming documents.
        """
        try:
            # Step 1: Initial preprocessing
            cleaned_content = self._preprocess_document(document_content)
            
            # Step 2: Extract metadata and entities
            metadata = self._extract_metadata(cleaned_content, source_type)
            
            # Step 3: Generate Nuremberg number
            nuremberg_number = self._generate_nuremberg_number(metadata)
            
            # Step 4: Convert to SAM.gov naming convention
            sam_tag = self._generate_sam_tag(metadata)
            
            # Step 5: Generate YAML structure
            yaml_content = self._generate_yaml(
                content=cleaned_content,
                metadata=metadata,
                nuremberg_number=nuremberg_number,
                sam_tag=sam_tag
            )
            
            # Step 6: Validate the generated content
            self._validate_data(yaml_content)
            
            # Step 7: Store and index the content
            self._store_and_index(yaml_content)
            
            return yaml_content

        except Exception as e:
            self.logger.error(f"Error processing document: {str(e)}")
            raise

    def _preprocess_document(self, content: str) -> str:
        """
        Clean and standardize document content.
        """
        # Remove special characters and normalize whitespace
        cleaned = re.sub(r'\s+', ' ', content)
        cleaned = cleaned.strip()
        
        # Convert common symbols to standard format
        cleaned = cleaned.replace('–', '-').replace('"', '"').replace('"', '"')
        
        return cleaned

    def _extract_metadata(self, content: str, source_type: str) -> Dict:
        """
        Extract metadata using Azure Document Intelligence.
        """
        try:
            # Use Form Recognizer to extract key information
            result = self.form_recognizer.begin_analyze_document(
                "prebuilt-document", content
            ).result()

            metadata = {
                "source_type": source_type,
                "extraction_date": datetime.utcnow().isoformat(),
                "document_type": result.doc_type,
                "confidence_score": result.confidence,
                "entities": self._extract_entities(result),
                "keywords": self._extract_keywords(content)
            }

            return metadata

        except Exception as e:
            self.logger.error(f"Metadata extraction failed: {str(e)}")
            raise

    def _generate_nuremberg_number(self, metadata: Dict) -> str:
        """
        Generate a Nuremberg number based on document hierarchy and content.
        """
        try:
            # Extract components for Nuremberg number
            domain = self._determine_domain(metadata)
            level = self._determine_level(metadata)
            branch = self._determine_branch(metadata)
            subsection = self._determine_subsection(metadata)
            
            return f"{domain}.{level}.{branch}.{subsection}"

        except Exception as e:
            self.logger.error(f"Nuremberg number generation failed: {str(e)}")
            raise

    def _generate_sam_tag(self, metadata: Dict) -> str:
        """
        Convert document title to SAM.gov naming convention.
        """
        try:
            # Extract title from metadata
            title = metadata.get("title", "").lower()
            
            # Remove special characters and replace spaces with hyphens
            sam_tag = re.sub(r'[^a-z0-9\s-]', '', title)
            sam_tag = re.sub(r'\s+', '-', sam_tag)
            
            # Add prefix based on document type
            doc_type = metadata.get("document_type", "").lower()
            prefix = f"{doc_type}-" if doc_type else ""
            
            return f"{prefix}{sam_tag}"

        except Exception as e:
            self.logger.error(f"SAM tag generation failed: {str(e)}")
            raise

    def _generate_yaml(self, content: str, metadata: Dict, 
                      nuremberg_number: str, sam_tag: str) -> Dict:
        """
        Generate YAML structure for the document.
        """
        yaml_content = {
            "document_id": hashlib.sha256(content.encode()).hexdigest()[:12],
            "nuremberg_number": nuremberg_number,
            "sam_tag": sam_tag,
            "metadata": metadata,
            "content": content,
            "processing_info": {
                "processed_at": datetime.utcnow().isoformat(),
                "pipeline_version": "1.0"
            }
        }
        
        return yaml_content

    def _validate_data(self, yaml_content: Dict) -> None:
        """
        Validate the generated YAML content.
        """
        required_fields = [
            "document_id", "nuremberg_number", "sam_tag", 
            "metadata", "content"
        ]
        
        for field in required_fields:
            if field not in yaml_content:
                raise ValueError(f"Missing required field: {field}")
            
        if not re.match(r'^\d+\.\d+\.\d+\.\d+$', yaml_content['nuremberg_number']):
            raise ValueError("Invalid Nuremberg number format")

    def _store_and_index(self, yaml_content: Dict) -> None:
        """
        Store the YAML content in Blob storage and index in Azure Cognitive Search.
        """
        try:
            # Store in Blob Storage
            container_client = self.blob_service.get_container_client("documents")
            blob_name = f"{yaml_content['nuremberg_number']}.yaml"
            
            yaml_str = yaml.dump(yaml_content, default_flow_style=False)
            container_client.upload_blob(
                name=blob_name,
                data=yaml_str,
                overwrite=True
            )

            # Index in Azure Cognitive Search
            self.search_client.upload_documents([{
                "id": yaml_content['document_id'],
                "nuremberg_number": yaml_content['nuremberg_number'],
                "sam_tag": yaml_content['sam_tag'],
                "content": yaml_content['content'],
                "metadata": str(yaml_content['metadata'])
            }])

        except Exception as e:
            self.logger.error(f"Storage and indexing failed: {str(e)}")
            raise

    def _extract_entities(self, form_result) -> List[Dict]:
        """
        Extract named entities from form recognizer results.
        """
        entities = []
        for entity in form_result.entities:
            entities.append({
                "type": entity.type,
                "value": entity.content,
                "confidence": entity.confidence
            })
        return entities

    def _extract_keywords(self, content: str) -> List[str]:
        """
        Extract key phrases from document content.
        """
        # Implement keyword extraction logic here
        # This could use Azure Text Analytics or other NLP services
        pass