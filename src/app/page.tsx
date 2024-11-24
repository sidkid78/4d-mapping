/**
 * AdvancedOrchestratorUI Component
 * 
 * A React component that provides a tabbed interface for managing regulatory workflows,
 * regulation data, and Federal Register searches.
 * 
 * Features:
 * - Workflow management tab for orchestrating system processes
 * - Regulation management tab for handling regulatory data
 * - Federal Register search tab for accessing government publications
 * - RAG query interface for AI-assisted regulatory search
 * 
 * @component
 * @example
 * ```tsx
 * <AdvancedOrchestratorUI />
 * ```
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegulationManager from '@/components/regulation-manager'
import FederalRegisterSearch from '@/components/federal-register-search'
import WorkflowManager from '@/components/workflow-manager'
import { RAGQueryInterface } from '@/components/rag-query-interface'

interface TabConfig {
  value: string
  title: string
  component: () => JSX.Element
}

export default function OrchestratorPage() {
  const tabs: TabConfig[] = [
    {
      value: "workflows",
      title: "Workflow Manager",
      component: () => <WorkflowManager />
    },
    {
      value: "regulations", 
      title: "Regulation Manager",
      component: () => <RegulationManager />
    },
    {
      value: "federal-register",
      title: "Federal Register Search", 
      component: () => <FederalRegisterSearch />
    },
    {
      value: "rag",
      title: "RAG Query",
      component: () => <RAGQueryInterface />
    }
  ]

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold text-[#1E90FF] mb-8 text-center">
        Advanced Orchestrator Dashboard
      </h1>
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => {
          return (
            <TabsContent key={tab.value} value={tab.value}>
              <Card className="border-[#1E90FF]/10">
                <CardHeader>
                  <CardTitle className="text-[#1E90FF]">{tab.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {tab.component()}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}