import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

export async function indexDocuments(documents: Array<{
  id: string;
  content: string;
  metadata: Record<string, any>;
}>) {
  const client = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    "documents",
    new AzureKeyCredential(process.env.AZURE_SEARCH_KEY!)
  );

  for (let i = 0; i < documents.length; i += 100) {
    const batch = documents.slice(i, i + 100);
    await client.uploadDocuments(batch);
  }
} 