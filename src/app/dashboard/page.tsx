import Dashboard from '@/components/Dashboard'

export const metadata = {
  title: 'Dashboard',
  description: 'View your dashboard metrics and analytics'
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Dashboard />
    </div>
  )
} 
