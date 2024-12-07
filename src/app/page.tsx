import AdvancedOrchestratorUI from '@/components/advanced-orchestrator-ui'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Procurity.ai</h1>
        <AdvancedOrchestratorUI />
      </div>
    </main>
  )
}