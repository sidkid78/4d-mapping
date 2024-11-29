import { indexDocuments } from '../src/lib/document-indexer';
import { PrismaClient } from '@prisma/client';

// Define interface based on your Prisma schema
interface RegulationData {
  id: string;
  content: string;
  domain: string;
  level: string;
  effectiveDate: Date;
}

async function loadInitialData() {
  const prisma = new PrismaClient();
  
  // Get regulations from database
  const regulations = await prisma.regulation.findMany();
  
  // Format for search index
  const documents = regulations.map((reg: RegulationData) => ({
    id: reg.id,
    content: reg.content,
    metadata: {
      type: 'regulation',
      domain: reg.domain,
      level: reg.level,
      effectiveDate: reg.effectiveDate.toISOString()
    }
  }));

  await indexDocuments(documents);
  await prisma.$disconnect();
}

loadInitialData().catch(console.error); 