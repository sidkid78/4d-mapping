import { NextResponse } from 'next/server'

const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams()
    params.append('fields[]', 'title')
    params.append('fields[]', 'document_number') 
    params.append('fields[]', 'publication_date')
    params.append('per_page', '20')
    params.append('order', 'relevance')
    params.append('conditions[term]', query)

    const response = await fetch(`${FEDERAL_REGISTER_API}.json?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(`API Error: ${response.status} - ${errorData?.errors || response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching from Federal Register API:', error)
    return NextResponse.json({ 
      error: 'Error fetching from Federal Register API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}