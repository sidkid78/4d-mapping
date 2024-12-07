"""
Data Synchronization Schema Module

This module defines the schema mappings and validation rules for synchronizing data
between different sources into a unified format.

Components:
- schema_mappings: Dictionary defining field mappings for each data source
- required_fields: List of mandatory fields for validation

Schema Mapping Types:
- direct: Direct field copy from source to destination
- transform: Apply transformation function to source field
- composite: Combine multiple source fields using composition function

Example Mapping:
    "federal_register": {
        "internal_id": {
            "type": "transform",
            "source_field": "document_number",
            "transform_function": "prefix_with_fr"
        }
    }

Dependencies:
    - Transformation functions defined elsewhere in codebase
    - Composition functions for combining multiple fields
"""

schema_mappings = {
    "federal_register": {
        "internal_id": {
            "type": "transform",
            "source_field": "document_number", 
            "transform_function": "prefix_with_fr"
        },
        "title": {
            "type": "direct",
            "source_field": "title"
        },
        "content": {
            "type": "direct", 
            "source_field": "body"
        },
        "publication_date": {
            "type": "direct",
            "source_field": "publication_date"
        },
        "effective_date": {
            "type": "direct",
            "source_field": "effective_on"
        },
        "agencies": {
            "type": "composite",
            "source_fields": ["agencies"],
            "composition_function": "extract_agency_names"
        }
    },
    "external_knowledge_base": {
        "node_id": {
            "type": "transform",
            "source_field": "id",
            "transform_function": "prefix_with_ekb"
        },
        "label": {
            "type": "direct",
            "source_field": "name"
        },
        "description": {
            "type": "direct",
            "source_field": "description"
        },
        "relationships": {
            "type": "composite",
            "source_fields": ["connections"],
            "composition_function": "transform_relationships"
        }
    }
}

# Required fields for validation
required_fields = [
    "internal_id",
    "title", 
    "content",
    "publication_date"
]