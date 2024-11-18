import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegulationManager from '@/components/regulation-manager'
import FederalRegisterSearch from '@/components/federal-register-search'
import WorkflowManager from '@/components/workflow-manager'

export default function AdvancedOrchestratorUI() {
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold text-[#1E90FF] mb-8 text-center">Advanced Orchestrator Dashboard</h1>
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="regulations">Regulation Manager</TabsTrigger>
          <TabsTrigger value="federal-register">Federal Register</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="space-y-4">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Workflow Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="regulations">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Regulation Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <RegulationManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="federal-register">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Federal Register Search</CardTitle>
            </CardHeader>
            <CardContent>
              <FederalRegisterSearch />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}