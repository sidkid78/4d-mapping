import  neo4j  from 'neo4j-driver'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

async function fetchAndStoreRegulations() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  )
  const session = driver.session()

  try {
    const response = await axios.get(
      'https://www.federalregister.gov/api/v1/documents', {
        params: {
          per_page: 20,
          order: 'newest',
          conditions: {
            type: 'RULE'
          }
        }
      }
    )

    for (const reg of response.data.results) {
      // Store in Neo4j
      await session.run(`
        MERGE (r:Regulation {
          document_number: $documentNumber
        })
        SET r.title = $title,
            r.publication_date = $publicationDate,
            r.agency_names = $agencyNames,
            r.abstract = $abstract
      `, {
        documentNumber: reg.document_number,
        title: reg.title,
        publicationDate: reg.publication_date,
        agencyNames: reg.agencies.map((a: any) => a.name),
        abstract: reg.abstract
      })

      // Store in Postgres
      await prisma.regulation.upsert({
        where: { documentNumber: reg.document_number },
        update: {
          title: reg.title,
          publicationDate: new Date(reg.publication_date),
          agencyNames: reg.agencies.map((a: any) => a.name),
          abstract: reg.abstract
        },
        create: {
          documentNumber: reg.document_number,
          title: reg.title,
          publicationDate: new Date(reg.publication_date),
          agencyNames: reg.agencies.map((a: any) => a.name),
          abstract: reg.abstract
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await session.close()
    await driver.close()
    await prisma.$disconnect()
  }
}