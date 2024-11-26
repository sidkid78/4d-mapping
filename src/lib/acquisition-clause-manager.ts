import { SearchClient, AzureKeyCredential } from "@azure/search-documents"
import { DefaultAzureCredential } from "@azure/identity"
import { Driver } from "neo4j-driver"
import neo4j from "neo4j-driver"
import { Pool } from "pg"

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  [key: string]: unknown;
}

interface Config {
  postgresql: {
    host: string
    port: number
    database: string
    user: string
    password: string
  }
  neo4j: {
    uri: string
    user: string
    password: string 
  }
  search_endpoint: string
  search_key: string
  keyvault_url: string
  keyvault_key: string
}

interface ClauseData {
  title: string
  content: string
  category: string
  metadata: Record<string, unknown>
}

interface AnalysisOptions {
  role: string
}

interface AnalysisResult {
  risk_score: number
  compliance_status: string
  recommendations: string[]
  related_clauses: string[]
}

export class AcquisitionClauseManager {
  private pgPool: Pool
  private neo4jClient: Driver
  private searchClient: SearchClient<SearchDocument>
  private keyClient: KeyClient

  constructor(config: Config) {
    this.pgPool = new Pool(config.postgresql)
    this.neo4jClient = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    )
    this.searchClient = new SearchClient<SearchDocument>(
      config.search_endpoint,
      "clauses",
      new AzureKeyCredential(config.search_key)
    )
    this.keyClient = new KeyClient(
      config.keyvault_url,
      new AzureKeyCredential(config.keyvault_key)
    )
  }

  async create_clause(clauseData: ClauseData): Promise<string> {
    try {
      // Store in PostgreSQL
      const { rows } = await this.pgPool.query(
        'INSERT INTO clauses (title, content, category, metadata) VALUES ($1, $2, $3, $4) RETURNING id',
        [clauseData.title, clauseData.content, clauseData.category, clauseData.metadata]
      )
      const clauseId = rows[0].id

      // Index in Azure Search
      await this.searchClient.uploadDocuments([{
        id: clauseId,
        ...clauseData
      }])

      // Create node in Neo4j
      await this.neo4jClient.session().run(
        'CREATE (c:Clause {id: $id, title: $title, category: $category})',
        { id: clauseId, title: clauseData.title, category: clauseData.category }
      )

      return clauseId
    } catch (error) {
      console.error('Error creating clause:', error)
      throw error
    }
  }

  async get_clause(id: string) {
    const { rows } = await this.pgPool.query('SELECT * FROM clauses WHERE id = $1', [id])
    return rows[0]
  }

  async update_clause(id: string, updates: Partial<ClauseData>) {
    const { rows } = await this.pgPool.query(
      'UPDATE clauses SET title = COALESCE($1, title), content = COALESCE($2, content), category = COALESCE($3, category), metadata = COALESCE($4, metadata) WHERE id = $5 RETURNING *',
      [updates.title, updates.content, updates.category, updates.metadata, id]
    )
    return rows[0]
  }

  async delete_clause(id: string) {
    await Promise.all([
      this.pgPool.query('DELETE FROM clauses WHERE id = $1', [id]),
      this.searchClient.deleteDocuments([{ id }]),
      this.neo4jClient.session().run('MATCH (c:Clause {id: $id}) DELETE c', { id })
    ])
  }
}

export class ClauseAnalyzer {
  private searchClient: SearchClient<SearchDocument>
  private neo4jClient: Driver

  constructor(config: Config) {
    this.searchClient = new SearchClient<SearchDocument>(
      config.search_endpoint,
      "clauses", 
      new AzureKeyCredential(config.search_key)
    )
    this.neo4jClient = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    )
  }

  async analyze_clause(clauseId: string, options: AnalysisOptions): Promise<AnalysisResult> {
    try {
      // Get related clauses using Azure Search vector similarity
      const searchResults = await this.searchClient.search("", {
        filter: `id ne '${clauseId}'`,
        select: ["id", "title"],
        top: 5
      })

      // Get graph relationships from Neo4j
      const session = this.neo4jClient.session()
      const graphResults = await session.run(
        `MATCH (c:Clause {id: $clauseId})-[r]-(related)
         RETURN type(r) as relationship, related.id as relatedId`,
        { clauseId }
      )

      // Calculate risk score based on role and relationships
      const riskScore = this.calculateRiskScore(graphResults.records, options.role)

      // Determine compliance status
      const complianceStatus = riskScore > 0.7 ? "Compliant" : "Review Required"

      // Generate recommendations
      const recommendations = this.generateRecommendations(riskScore, options.role)

      const relatedClauses = await this.getRelatedClauses(searchResults)

      return {
        risk_score: riskScore,
        compliance_status: complianceStatus,
        recommendations,
        related_clauses: relatedClauses
      }
    } catch (error) {
      console.error('Error analyzing clause:', error)
      throw error
    }
  }

  private calculateRiskScore(relationships: Record<string, unknown>[], role: string): number {
    // Simplified risk scoring logic
    const baseScore = 0.5
    const relationshipFactor = relationships.length * 0.1
    const roleFactor = role === "compliance_officer" ? 0.2 : 0
    return Math.min(baseScore + relationshipFactor + roleFactor, 1.0)
  }

  private generateRecommendations(riskScore: number, role: string): string[] {
    const recommendations: string[] = []
    
    if (riskScore < 0.7) {
      recommendations.push("Review clause for compliance issues")
    }
    if (role === "compliance_officer") {
      recommendations.push("Perform detailed compliance assessment")
    }
    if (riskScore < 0.5) {
      recommendations.push("Consider clause revision or replacement")
    }

    return recommendations
  }

  private async getRelatedClauses(searchResults: any) {
    return searchResults.results.map((r: { document: { id: string } }) => r.document.id)
  }
}
