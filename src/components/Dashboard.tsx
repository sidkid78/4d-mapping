"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RegulationManager } from './regulation-manager'
import { MonitoringSystem } from './monitoring-system'
import { MaintenanceManager } from './maintenance-manager'

interface DashboardMetrics {
  totalRegulations: number
  activeProcesses: number
  systemHealth: number
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Regulations</h3>
          <p className="text-2xl font-bold">{metrics?.totalRegulations ?? '-'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Active Processes</h3>
          <p className="text-2xl font-bold">{metrics?.activeProcesses ?? '-'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">System Health</h3>
          <p className="text-2xl font-bold">{metrics?.systemHealth ?? '-'}%</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RegulationManager />
        <MonitoringSystem />
      </div>

      <MaintenanceManager />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}