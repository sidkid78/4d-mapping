import { NextResponse } from 'next/server'
import { getDatabaseManager } from '@/lib/database-manager'

export async function GET() {
  try {
    const db = getDatabaseManager()
    
    // Get actual metrics from your database
    const dashboardData = {
      totalRegulations: await db.getProcessCount(),
      activeProcesses: await db.getActiveTaskCount(),
      systemHealth: 98 // This could be calculated based on various system metrics
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 