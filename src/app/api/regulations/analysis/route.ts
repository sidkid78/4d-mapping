import { NextResponse } from 'next/server'
import { AzureOpenAI } from 'openai'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'

// Initialize Azure OpenAI
const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  apiVersion: "2024-08-01-preview",
})

// Initialize Azure Search
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  "documents",
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY!)
)

export async function POST(req: Request) {
  try {
    const { title, content, regulation_id } = await req.json()

    // Get embeddings
    const embeddingResponse = await openai.embeddings.create({
      input: content,
      model: "text-embedding-3-small"
    })
    const embedding = embeddingResponse.data[0].embedding

    // Store in Azure Search
    await searchClient.uploadDocuments([{
      id: `reg_${regulation_id}`,
      content: content,
      title: title,
      embedding: embedding,
      metadata: JSON.stringify({ type: 'regulation', created_at: new Date().toISOString() })
    }])

    // Analyze with GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in regulatory analysis. Analyze the given regulation and provide insights."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content}\n\nPlease analyze this regulation and provide key insights.`
        }
      ]
    })

    return NextResponse.json({
      analysis: completion.choices[0].message.content,
      embedding: embedding
    })

  } catch (error) {
    console.error('Error in regulation analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze regulation' },
      { status: 500 }
    )
  }
}