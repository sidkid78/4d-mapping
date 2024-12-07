import { Session, Transaction, Record } from 'neo4j-driver'
import neo4j from 'neo4j-driver'
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.colorize(),
    format.simple()
  ),
  transports: [
    new transports.Console()
  ]
});

interface KnowledgeGraphConfig {
  neo4jUri: string
  neo4jUser: string 
  neo4jPassword: string
  schemaMappings: { [key: string]: MappingRule }
  requiredFields: string[]
}

interface MappingRule {
  type: 'direct' | 'transform' | 'composite'
  sourceField?: string
  sourceFields?: string[]
  transformFunction?: string
  compositionFunction?: string
}

interface GraphNode {
  id: string
  [key: string]: any
}

interface Agency {
  name: string
}

interface Connection {
  type: string
  target_id: string
}

export function createKnowledgeGraphIntegrator(config: KnowledgeGraphConfig) {
  const driver = neo4j.driver(
    config.neo4jUri,
    neo4j.auth.basic(config.neo4jUser, config.neo4jPassword)
  )

  async function integrateExternalKnowledge(source: string, data: GraphNode): Promise<boolean> {
    try {
      const mappedData = await mapSchema(source, data)
      if (!validateMappedData(mappedData)) {
        throw new Error("Invalid mapped data")
      }
      const resolvedData = await resolveConflicts(mappedData)
      await integrateData(resolvedData)
      return true
    } catch (error) {
      console.error(`Knowledge graph integration failed:`, error)
      return false
    }
  }

  function mapSchema(source: string, data: GraphNode): GraphNode {
    const mappingRules = config.schemaMappings[source]
    return Object.entries(mappingRules).reduce((mapped, [targetField, rule]) => {
      mapped[targetField] = mapField(data, rule)
      return mapped
    }, {} as GraphNode)
  }

  function mapField(data: GraphNode, rule: MappingRule): any {
    switch (rule.type) {
      case 'direct':
        return data[rule.sourceField!]
      case 'transform':
        return transformField(data[rule.sourceField!], rule.transformFunction!)
      case 'composite':
        return composeField(data, rule.sourceFields!, rule.compositionFunction!)
      default:
        throw new Error(`Unknown mapping type: ${rule.type}`)
    }
  }

  function validateMappedData(data: GraphNode): boolean {
    return config.requiredFields.every(field => field in data)
  }

  async function resolveConflicts(data: GraphNode): Promise<GraphNode> {
    const session = driver.session()
    try {
      const existingNode = await findExistingNode(session, data.id)
      if (!existingNode) return data

      return mergeNodes(data, existingNode)
    } finally {
      await session.close()
    }
  }

  async function findExistingNode(session: Session, id: string): Promise<GraphNode | null> {
    const result = await session.executeRead(async tx => {
      const result = await tx.run('MATCH (n:Node {id: $id}) RETURN n', { id })
      return result.records[0]?.get('n').properties || null
    })
    return result
  }

  function mergeNodes(newData: GraphNode, existingData: GraphNode): GraphNode {
    const merged = { ...newData }

    for (const [key, value] of Object.entries(existingData)) {
      // Keep existing value if new is null/undefined
      if (merged[key] == null) {
        merged[key] = value
        continue
      }

      // Merge arrays
      if (Array.isArray(value) && Array.isArray(merged[key])) {
        merged[key] = Array.from(new Set([...value, ...merged[key]]))
        continue
      }

      // Handle timestamps
      if (key.includes('timestamp') || key.includes('date')) {
        const existingDate = new Date(value as string)
        const newDate = new Date(merged[key])
        if (existingDate > newDate) {
          merged[key] = value
        }
      }
    }

    merged.lastMerged = new Date().toISOString()
    merged.mergeCount = (existingData.mergeCount || 0) + 1

    return merged
  }

  async function integrateData(data: GraphNode): Promise<void> {
    const session = driver.session()
    try {
      await session.executeWrite(async tx => {
        await tx.run(`
          MERGE (n:Node {id: $id})
          SET n += $properties
          RETURN n
        `, { 
          id: data.id,
          properties: data 
        })
      })
    } finally {
      await session.close()
    }
  }

  function transformField(value: string, transformFunction: string): string {
    switch (transformFunction) {
      case 'prefix_with_fr':
        return `FR_${value}`
      case 'prefix_with_ekb':
        return `EKB_${value}`
      default:
        throw new Error(`Unknown transform function: ${transformFunction}`)
    }
  }

  function composeField(data: GraphNode, sourceFields: string[], compositionFunction: string): any {
    switch (compositionFunction) {
      case 'extract_agency_names':
        return data.agencies?.map((agency: Agency) => agency.name) || []
      case 'transform_relationships':
        return data.connections?.map((rel: Connection) => ({
          type: rel.type,
          target: rel.target_id
        })) || []
      default:
        throw new Error(`Unknown composition function: ${compositionFunction}`)
    }
  }

  async function searchKnowledgeGraph(query: string): Promise<GraphNode[]> {
    const session = driver.session()
    try {
      return await session.executeRead(async tx => {
        const result = await tx.run(`
          MATCH (n:Node)
          WHERE n.title CONTAINS $query OR n.content CONTAINS $query
          RETURN n
        `, { query })
        return result.records.map(record => record.get('n').properties)
      })
    } finally {
      await session.close()
    }
  }

  async function getRelatedNodes(nodeId: string, relationshipType?: string): Promise<GraphNode[]> {
    const session = driver.session()
    try {
      return await session.executeRead(async tx => {
        const query = relationshipType
          ? `MATCH (n:Node {id: $nodeId})-[r:${relationshipType}]->(related) RETURN related`
          : `MATCH (n:Node {id: $nodeId})-[r]->(related) RETURN related, type(r) as relationship_type`

        const result = await tx.run(query, { nodeId })
        
        return result.records.map(record => {
          const node = record.get('related').properties
          return relationshipType ? node : {
            ...node,
            relationship_type: record.get('relationship_type')
          }
        })
      })
    } finally {
      await session.close()
    }
  }

  return {
    integrateExternalKnowledge,
    searchKnowledgeGraph,
    getRelatedNodes
  }
}