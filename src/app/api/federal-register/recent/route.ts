import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const params = new URLSearchParams({
      per_page: '5',
      order: 'newest',
      fields: [
        'id',
        'title',
        'abstract',
        'document_number',
        'html_url',
        'publication_date',
        'type',
        'agency_names'
      ].join(',')
    })
    
    params.append('conditions[type][]', 'RULE')
    params.append('conditions[type][]', 'PRORULE')
    params.append('conditions[type][]', 'NOTICE')

    const response = await fetch(
      'https://www.federalregister.gov/api/v1/documents?' + params.toString(),
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        next: { revalidate: 3600 }  // Cache for 1 hour
      }
    )

    if (!response.ok) {
      // Return mock data if API fails
      return NextResponse.json({
        results: [
          {
            id: "mock-1",
            title: "Sample Regulatory Update",
            abstract: "This is a sample regulatory update while the Federal Register API is unavailable.",
            document_number: "2024-001",
            html_url: "#",
            publication_date: new Date().toISOString(),
            type: "RULE",
            agency_names: ["Sample Agency"]
          }
        ]
      })
    }

    const data = await response.json()
    return NextResponse.json({ results: data.results })
  } catch (error: unknown) {
    console.error('Error fetching from Federal Register:', error)
    // Return mock data in case of error
    return NextResponse.json({
      results: [
        {
          id: "mock-1",
          title: "Sample Regulatory Update",
          abstract: "This is a sample regulatory update while the Federal Register API is unavailable.",
          document_number: "2024-001",
          html_url: "#",
          publication_date: new Date().toISOString(),
          type: "RULE",
          agency_names: ["Sample Agency"]
        }
      ]
    })
  }
} 