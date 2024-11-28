import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const regulationData = await request.json()
    const response = await fetch('http://localhost:8000/regulations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(regulationData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create regulation: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating regulation:', error)
    return NextResponse.json({ error: 'Failed to create regulation' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const url = id 
      ? `http://localhost:8000/regulations/${id}`
      : 'http://localhost:8000/regulations'

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch regulations: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching regulations:', error)
    return NextResponse.json({ error: 'Failed to fetch regulations' }, { status: 500 })
  }
}