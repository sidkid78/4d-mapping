import neo4j, { Driver } from 'neo4j-driver'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

interface RegulationData {
  nuremberg_number: string
  name: string
  original_reference: string
  sam_tag: string
  content: string
  level: string
  domain: string
  effective_date: Date
}

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export class DatabaseManager {
  private prisma: PrismaClient
  private neo4j: Driver
  private redis: Redis

  constructor(
    config: DatabaseConfig,
    apiSecret: string,
    version: string
  ) {
    this.prisma = new PrismaClient()
    this.neo4j = neo4j.driver(
      `${config.host}:${config.port}`,
      neo4j.auth.basic(config.user, config.password)
    )
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  async createRegulation(regulationData: RegulationData): Promise<string> {
    const regulationId = crypto.randomUUID()

    try {
      // Store in Postgres using Prisma
      await this.prisma.regulation.create({
        data: {
          id: regulationId,
          nurembergNumber: regulationData.nuremberg_number,
          name: regulationData.name,
          originalReference: regulationData.original_reference,
          samTag: regulationData.sam_tag,
          content: regulationData.content,
          level: regulationData.level,
          domain: regulationData.domain,
          effectiveDate: regulationData.effective_date
        }
      })

      // Store in Neo4j
      const session = this.neo4j.session()
      await session.run(`
        CREATE (r:Regulation {
          regulationId: $regId,
          nurembergNumber: $nuremberg,
          name: $name,
          level: $level
        })
      `, {
        regId: regulationId,
        nuremberg: regulationData.nuremberg_number,
        name: regulationData.name,
        level: regulationData.level
      })

      // Cache in Redis
      const cacheKey = `regulation:${regulationId}`
      await this.redis.setex(cacheKey, 3600, JSON.stringify(regulationData))

      return regulationId
    } catch (error) {
      throw new Error(`Failed to create regulation: ${error}`)
    }
  }

  async createCrosswalk(sourceId: string, targetId: string, crosswalkType: string): Promise<void> {
    const session = this.neo4j.session()
    await session.run(`
      MATCH (source:Regulation {regulationId: $sourceId})
      MATCH (target:Regulation {regulationId: $targetId})
      CREATE (source)-[:CROSSWALK {
        crosswalkType: $type,
        createdAt: datetime()
      }]->(target)
    `, {
      sourceId,
      targetId,
      type: crosswalkType
    })
  }

  async getRegulationWithCrosswalks(regulationId: string) {
    // Try cache first
    const cacheKey = `regulation:${regulationId}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    // Get regulation from Prisma
    const regulation = await this.prisma.regulation.findUnique({
      where: { id: regulationId }
    })

    if (!regulation) throw new Error('Regulation not found')

    // Get crosswalks from Neo4j
    const session = this.neo4j.session()
    const result = await session.run(`
      MATCH (r:Regulation {regulationId: $regId})-[c:CROSSWALK]->(related:Regulation)
      RETURN related.regulationId as relatedId, 
             related.name as relatedName,
             c.crosswalkType as relationshipType
    `, { regId: regulationId })

    const crosswalks = result.records.map(record => ({
      relatedId: record.get('relatedId'),
      relatedName: record.get('relatedName'),
      relationshipType: record.get('relationshipType')
    }))

    const regulationData = {
      ...regulation,
      crosswalks
    }

    // Cache the combined data
    await this.redis.setex(cacheKey, 3600, JSON.stringify(regulationData))

    return regulationData
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect()
    await this.neo4j.close()
    await this.redis.quit()
  }
}