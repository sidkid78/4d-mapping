'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Database, HardDrive, Shield } from 'lucide-react'

interface MaintenanceResult {
  vacuum: boolean;
  reindex: boolean;
  analyze: boolean;
  consistency: boolean;
}

interface BackupResult {
  backup_id: string;
  timestamp: string;
  type: string;
  size: number;
  source: string;
  status: string;
}

interface RecoveryDrillResult {
  started_at: string;
  completed_at: string;
  success: boolean;
  steps: Array<{ name: string; success: boolean }>;
}

export default function DatabaseManagement() {
  const [maintenanceResult, setMaintenanceResult] = useState<MaintenanceResult | null>(null)
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null)
  const [recoveryDrillResult, setRecoveryDrillResult] = useState<RecoveryDrillResult | null>(null)
  const [migrationResult, setMigrationResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const performMaintenance = async (database: string) => {
    setLoading('maintenance')
    setError(null)
    try {
      const response = await fetch('/api/database/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database }),
      })
      if (!response.ok) throw new Error('Maintenance failed')
      const result = await response.json()
      setMaintenanceResult(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error(errorMessage)
      setError(`Failed to perform maintenance: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const performBackup = async (type: string, source: string) => {
    setLoading('backup')
    setError(null)
    try {
      const response = await fetch('/api/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, source }),
      })
      if (!response.ok) throw new Error('Backup failed')
      const result = await response.json()
      setBackupResult(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error(errorMessage)
      setError(`Failed to perform backup: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const performRecoveryDrill = async () => {
    setLoading('recovery')
    setError(null)
    try {
      const response = await fetch('/api/database/recovery-drill', { method: 'POST' })
      if (!response.ok) throw new Error('Recovery drill failed')
      const result = await response.json()
      setRecoveryDrillResult(result)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error(errorMessage)
      setError(`Failed to perform recovery drill: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const performMigration = async (version: string, database: string) => {
    setLoading('migration')
    setError(null)
    try {
      const response = await fetch('/api/database/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, database }),
      })
      if (!response.ok) throw new Error('Migration failed')
      const result = await response.json()
      setMigrationResult(result.success)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error(errorMessage)
      setError(`Failed to perform migration: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="maintenance">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="migration">Migration</TabsTrigger>
          </TabsList>
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={() => performMaintenance('postgresql')} disabled={loading === 'maintenance'}>
                <Database className="mr-2 h-4 w-4" />
                Maintain PostgreSQL
              </Button>
              <Button onClick={() => performMaintenance('neo4j')} disabled={loading === 'maintenance'}>
                <Database className="mr-2 h-4 w-4" />
                Maintain Neo4j
              </Button>
            </div>
            {maintenanceResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Maintenance Completed</AlertTitle>
                <AlertDescription>
                  Vacuum: {maintenanceResult.vacuum ? 'Success' : 'Failed'}<br />
                  Reindex: {maintenanceResult.reindex ? 'Success' : 'Failed'}<br />
                  Analyze: {maintenanceResult.analyze ? 'Success' : 'Failed'}<br />
                  Consistency: {maintenanceResult.consistency ? 'Success' : 'Failed'}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="backup" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backupType">Backup Type</Label>
                <Select onValueChange={(value) => performBackup(value, 'postgresql')}>
                  <SelectTrigger id="backupType">
                    <SelectValue placeholder="Select backup type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="incremental">Incremental Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="backupSource">Backup Source</Label>
                <Select onValueChange={(value) => performBackup('full', value)}>
                  <SelectTrigger id="backupSource">
                    <SelectValue placeholder="Select backup source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="neo4j">Neo4j</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {backupResult && (
              <Alert>
                <HardDrive className="h-4 w-4" />
                <AlertTitle>Backup Completed</AlertTitle>
                <AlertDescription>
                  Backup ID: {backupResult.backup_id}<br />
                  Timestamp: {backupResult.timestamp}<br />
                  Type: {backupResult.type}<br />
                  Size: {backupResult.size} bytes<br />
                  Source: {backupResult.source}<br />
                  Status: {backupResult.status}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="recovery" className="space-y-4">
            <Button onClick={performRecoveryDrill} disabled={loading === 'recovery'}>
              <Shield className="mr-2 h-4 w-4" />
              Perform Recovery Drill
            </Button>
            {recoveryDrillResult && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Recovery Drill Completed</AlertTitle>
                <AlertDescription>
                  Started: {recoveryDrillResult.started_at}<br />
                  Completed: {recoveryDrillResult.completed_at}<br />
                  Success: {recoveryDrillResult.success ? 'Yes' : 'No'}<br />
                  Steps:<br />
                  {recoveryDrillResult.steps.map((step, index) => (
                    <div key={index}>
                      {step.name}: {step.success ? 'Success' : 'Failed'}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="migration" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="migrationVersion">Migration Version</Label>
                <Select onValueChange={(value) => performMigration(value, 'postgresql')}>
                  <SelectTrigger id="migrationVersion">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.0.0">Version 1.0.0</SelectItem>
                    <SelectItem value="1.1.0">Version 1.1.0</SelectItem>
                    <SelectItem value="1.2.0">Version 1.2.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="migrationDatabase">Database</Label>
                <Select onValueChange={(value) => performMigration('1.0.0', value)}>
                  <SelectTrigger id="migrationDatabase">
                    <SelectValue placeholder="Select database" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="neo4j">Neo4j</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {migrationResult !== null && (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Migration {migrationResult ? 'Successful' : 'Failed'}</AlertTitle>
                <AlertDescription>
                  The database migration has {migrationResult ? 'completed successfully' : 'failed'}.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}