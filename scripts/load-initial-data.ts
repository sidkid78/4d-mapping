import { indexDocuments } from '../src/lib/document-indexer';
import { PrismaClient, Regulation } from '@prisma/client';

async function loadInitialData() {
  const prisma = new PrismaClient();
  
  // Get regulations from database
  const regulations = await prisma.regulation.findMany();
  
  // Format for search index
  const documents = regulations.map((reg: Regulation) => ({
    id: reg.id.toString(),
    content: reg.abstract || reg.title,
    metadata: {
      type: 'federal_register',
      documentNumber: reg.documentNumber,
      publicationDate: reg.publicationDate.toISOString(),
      agencies: reg.agencyNames
    }
  }));

  await indexDocuments(documents);
  await prisma.$disconnect();
}

loadInitialData().catch(console.error); 