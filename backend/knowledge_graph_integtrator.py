from typing import Dict, List, Any
from neo4j import GraphDatabase
import logging

class KnowledgeGraphIntegrator:
    """
    Integrates external knowledge into a Neo4j knowledge graph.

    This class handles schema mapping, data validation, conflict resolution, and data integration
    into a Neo4j knowledge graph. It also provides methods for searching and retrieving related nodes.

    Attributes:
        config (Dict): Configuration dictionary containing Neo4j connection details and schema mappings.
        logger (logging.Logger): Logger for the class.
        driver (neo4j.GraphDatabase.driver): Neo4j driver for database operations.
    """
    def __init__(self, config: Dict):
        """
        Initialize the KnowledgeGraphIntegrator with configuration and Neo4j connection.

        Args:
            config (Dict): Configuration dictionary containing Neo4j URI, user, password, and schema mappings.
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.driver = GraphDatabase.driver(
            config['neo4j_uri'],
            auth=(config['neo4j_user'], config['neo4j_password'])
        )

    async def integrate_external_knowledge(self, source: str, data: Dict) -> bool:
        """
        Integrate external knowledge into the knowledge graph.

        Args:
            source (str): Source identifier for the external data.
            data (Dict): External data to be integrated.

        Returns:
            bool: True if integration is successful, False otherwise.
        """
        try:
            mapped_data = await self._map_schema(source, data)
            
            if not await self._validate_mapped_data(mapped_data):
                raise ValueError("Invalid mapped data")
            
            resolved_data = await self._resolve_conflicts(mapped_data)
            
            await self._integrate_data(resolved_data)
            
            return True

        except Exception as e:
            self.logger.error(f"Knowledge graph integration failed: {str(e)}")
            return False

    async def _map_schema(self, source: str, data: Dict) -> Dict:
        """
        Map external data schema to the internal schema.

        Args:
            source (str): Source identifier for the external data.
            data (Dict): External data to be mapped.

        Returns:
            Dict: Mapped data according to the internal schema.
        """
        mapping_rules = self.config['schema_mappings'][source]
        mapped_data = {}
        
        for target_field, mapping in mapping_rules.items():
            if mapping['type'] == 'direct':
                mapped_data[target_field] = data[mapping['source_field']]
            elif mapping['type'] == 'transform':
                mapped_data[target_field] = await self._transform_field(
                    data[mapping['source_field']],
                    mapping['transform_function']
                )
            elif mapping['type'] == 'composite':
                mapped_data[target_field] = await self._compose_field(
                    data,
                    mapping['source_fields'],
                    mapping['composition_function']
                )
        
        return mapped_data

    async def _validate_mapped_data(self, data: Dict) -> bool:
        """
        Validate the mapped data against required fields.

        Args:
            data (Dict): Mapped data to be validated.

        Returns:
            bool: True if all required fields are present, False otherwise.
        """
        required_fields = self.config['required_fields']
        return all(field in data for field in required_fields)

    async def _resolve_conflicts(self, data: Dict) -> Dict:
        """
        Resolve conflicts between new data and existing data in the knowledge graph.

        Args:
            data (Dict): New data to be integrated.

        Returns:
            Dict: Resolved data after applying conflict resolution rules.
        """
        with self.driver.session() as session:
            existing_node = session.execute_read(
                lambda tx: tx.run(
                    "MATCH (n:Node {id: $id}) RETURN n",
                    id=data['internal_id']
                ).single()
            )

            if not existing_node:
                return data

            existing_data = dict(existing_node['n'])
            resolved_data = data.copy()

            resolution_rules = self.config.get('conflict_resolution_rules', {})
            
            for field, rule in resolution_rules.items():
                if field in data and field in existing_data:
                    if rule == 'keep_existing':
                        resolved_data[field] = existing_data[field]
                    elif rule == 'keep_newer':
                        if data.get('timestamp', 0) > existing_data.get('timestamp', 0):
                            resolved_data[field] = data[field]
                        else:
                            resolved_data[field] = existing_data[field]
                    elif rule == 'merge_lists':
                        if isinstance(data[field], list) and isinstance(existing_data[field], list):
                            resolved_data[field] = list(set(data[field] + existing_data[field]))
                    elif rule == 'merge_dicts':
                        if isinstance(data[field], dict) and isinstance(existing_data[field], dict):
                            resolved_data[field] = {**existing_data[field], **data[field]}

            self.logger.info(f"Resolved conflicts for node {data['internal_id']}")
            
            return resolved_data

    async def _integrate_data(self, data: Dict) -> None:
        """
        Integrate resolved data into the knowledge graph.

        Args:
            data (Dict): Resolved data to be integrated.
        """
        with self.driver.session() as session:
            session.execute_write(self._create_or_update_node, data)

    @staticmethod
    def _create_or_update_node(tx, data):
        """
        Create or update a node in the knowledge graph.

        Args:
            tx: Neo4j transaction.
            data (Dict): Data to be integrated into the node.

        Returns:
            neo4j.Result: Result of the query execution.
        """
        query = (
            "MERGE (n:Node {id: $id}) "
            "SET n += $properties "
            "RETURN n"
        )
        result = tx.run(query, id=data['internal_id'], properties=data)
        return result.single()

    async def _transform_field(self, value: str, transform_function: str) -> str:
        """
        Apply a transformation function to a field value.

        Args:
            value (str): Field value to be transformed.
            transform_function (str): Transformation function to be applied.

        Returns:
            str: Transformed field value.
        """
        if transform_function == 'prefix_with_fr':
            return f"FR_{value}"
        elif transform_function == 'prefix_with_ekb':
            return f"EKB_{value}"
        elif transform_function == 'to_uppercase':
            return value.upper()
        elif transform_function == 'to_lowercase':
            return value.lower()
        elif transform_function == 'strip_whitespace':
            return value.strip()
        elif transform_function == 'normalize_spaces':
            return ' '.join(value.split())
        elif transform_function == 'remove_special_chars':
            return ''.join(c for c in value if c.isalnum() or c.isspace())
        else:
            raise ValueError(f"Unknown transform function: {transform_function}")

    async def _compose_field(self, data: Dict, source_fields: List[str], composition_function: str) -> Any:
        """
        Compose a field value from multiple source fields.

        Args:
            data (Dict): Data containing source fields.
            source_fields (List[str]): List of source fields to be composed.
            composition_function (str): Composition function to be applied.

        Returns:
            Any: Composed field value.
        """
        if composition_function == 'extract_agency_names':
            return [agency['name'] for agency in data.get('agencies', [])]
        elif composition_function == 'transform_relationships':
            return [{'type': rel['type'], 'target': rel['target_id']} for rel in data.get('connections', [])]
        else:
            raise ValueError(f"Unknown composition function: {composition_function}")

    async def search_knowledge_graph(self, query: str) -> List[Dict]:
        """
        Search the knowledge graph for nodes matching the query.

        Args:
            query (str): Query string to search for.

        Returns:
            List[Dict]: List of nodes matching the query.
        """
        with self.driver.session() as session:
            return session.read_transaction(self._search_nodes, query)

    @staticmethod
    def _search_nodes(tx, query):
        """
        Execute a search query on the knowledge graph.

        Args:
            tx: Neo4j transaction.
            query (str): Query string to search for.

        Returns:
            List[Dict]: List of nodes matching the query.
        """
        cypher_query = (
            "MATCH (n:Node) "
            "WHERE n.title CONTAINS $query OR n.content CONTAINS $query "
            "RETURN n"
        )
        result = tx.run(cypher_query, query=query)
        return [dict(record['n']) for record in result]

    async def get_related_nodes(self, node_id: str, relationship_type: str = None) -> List[Dict]:
        """
        Retrieve nodes related to a given node by a specific relationship type.

        Args:
            node_id (str): ID of the node to find related nodes for.
            relationship_type (str, optional): Type of relationship to filter by. Defaults to None.

        Returns:
            List[Dict]: List of related nodes.
        """
        with self.driver.session() as session:
            return session.read_transaction(self._get_related_nodes, node_id, relationship_type)

    @staticmethod
    def _get_related_nodes(tx, node_id, relationship_type):
        """
        Execute a query to retrieve related nodes from the knowledge graph.

        Args:
            tx: Neo4j transaction.
            node_id (str): ID of the node to find related nodes for.
            relationship_type (str, optional): Type of relationship to filter by. Defaults to None.

        Returns:
            List[Dict]: List of related nodes.
        """
        if relationship_type:
            cypher_query = (
                "MATCH (n:Node {id: $node_id})-[r:" + relationship_type + "]->(related) "
                "RETURN related"
            )
        else:
            cypher_query = (
                "MATCH (n:Node {id: $node_id})-[r]->(related) "
                "RETURN related, type(r) as relationship_type"
            )
        result = tx.run(cypher_query, node_id=node_id)
        return [dict(record['related']) for record in result]