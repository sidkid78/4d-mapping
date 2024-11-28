import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`http://localhost:8000/regulations/${params.id}/crosswalks`)
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Regulation not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch regulation: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching regulation:', error)
    return NextResponse.json({ error: 'Failed to fetch regulation' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const regulationData = await request.json()
    const response = await fetch(`http://localhost:8000/regulations/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(regulationData),
    })

    if (!response.ok) {
      throw new Error(`Failed to update regulation: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating regulation:', error)
    return NextResponse.json({ error: 'Failed to update regulation' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`http://localhost:8000/regulations/${params.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete regulation: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting regulation:', error)
    return NextResponse.json({ error: 'Failed to delete regulation' }, { status: 500 })
  }
} 