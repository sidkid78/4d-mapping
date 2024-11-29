import { NextResponse } from 'next/server';
import { indexDocuments } from '@/lib/document-indexer';

export async function POST(request: Request) {
  try {
    const documents = await request.json();
    await indexDocuments(documents);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to index documents:', error);
    return NextResponse.json({ error: 'Failed to index documents' }, { status: 500 });
  }
} 