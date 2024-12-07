import { Metadata } from 'next'
import { SystemManagementDashboard } from '@/components/system-management-dashboard'

export const metadata: Metadata = {
  title: 'System Management Dashboard',
  description: 'Manage deployments, maintenance, monitoring, and enhancements',
}

export default function SystemManagementPage() {
  return <SystemManagementDashboard />
}

