import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file to a temporary location
    const uploadDir = join(process.cwd(), 'uploads')
    const filePath = join(uploadDir, file.name)
    await writeFile(filePath, buffer)

    // Here you would typically process the file with LlamaIndex
    // and store it in your vector database

    return NextResponse.json({ 
      success: true,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    )
  }
} 