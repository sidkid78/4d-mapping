// src/app/dashboard/page.tsx
import AdvancedOrchestratorUI from '@/components/advanced-orchestrator-ui'

export default function AdvancedOrchestratorPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Advanced Orchestrator</h1>
        <AdvancedOrchestratorUI />
      </div>
    </main>
  )
}