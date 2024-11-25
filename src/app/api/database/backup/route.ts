import { NextResponse } from 'next/server'
import { BackupManager } from '@/lib/database_management_system'

const config = {
  storage_connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING,
  credential: {
    // Azure credentials
  },
  subscription_id: process.env.AZURE_SUBSCRIPTION_ID
}

const backupManager = new BackupManager(config)

export async function POST(request: Request) {
  try {
    const { type, source } = await request.json()

    const result = await backupManager.perform_backup(type, source)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'An error occurred during backup' }, { status: 500 })
  }
}