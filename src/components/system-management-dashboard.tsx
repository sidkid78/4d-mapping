'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeploymentManager } from '@/components/deployment-manager'
import { MaintenanceManager } from '@/components/maintenance-manager'
import { MonitoringSystem } from '@/components/monitoring-system'
import { FutureEnhancements } from '@/components/future-enhancements'

export function SystemManagementDashboard() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">System Management Dashboard</h1>
      <Tabs defaultValue="deployment">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="enhancements">Enhancements</TabsTrigger>
        </TabsList>
        <TabsContent value="deployment">
          <DeploymentManager />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceManager />
        </TabsContent>
        <TabsContent value="monitoring">
          <MonitoringSystem />
        </TabsContent>
        <TabsContent value="enhancements">
          <FutureEnhancements />
        </TabsContent>
      </Tabs>
    </div>
  )
}

