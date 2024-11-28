import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { source_id, target_id, crosswalk_type } = await request.json()

    if (!source_id || !target_id || !crosswalk_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await fetch('http://localhost:8000/crosswalks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source_id, target_id, crosswalk_type }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create crosswalk: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating crosswalk:', error)
    return NextResponse.json({ error: 'Failed to create crosswalk' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regulation_id = searchParams.get('regulation_id')

    if (!regulation_id) {
      return NextResponse.json({ error: 'Missing regulation_id parameter' }, { status: 400 })
    }

    const response = await fetch(`http://localhost:8000/regulations/${regulation_id}/crosswalks`)
    if (!response.ok) {
      throw new Error(`Failed to fetch crosswalks: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching crosswalks:', error)
    return NextResponse.json({ error: 'Failed to fetch crosswalks' }, { status: 500 })
  }
}