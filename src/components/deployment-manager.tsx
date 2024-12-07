'use client'

import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormReturn, ControllerRenderProps } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'

const deploymentFormSchema = z.object({
  environment: z.string().min(1, "Environment is required"),
  region: z.string().min(1, "Region is required"),
  resources: z.string().min(1, "Resources configuration is required"),
  scalingRules: z.string().min(1, "Scaling rules are required"),
  backupConfig: z.string().min(1, "Backup configuration is required"),
  monitoringConfig: z.string().min(1, "Monitoring configuration is required"),
})

export function DeploymentManager() {
  const [deploymentResult, setDeploymentResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof deploymentFormSchema>>({
    resolver: zodResolver(deploymentFormSchema),
    defaultValues: {
      environment: "",
      region: "",
      resources: "",
      scalingRules: "",
      backupConfig: "",
      monitoringConfig: "",
    },
  })

  async function onSubmit(values: z.infer<typeof deploymentFormSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) throw new Error('Deployment failed')
      const result = await response.json()
      setDeploymentResult(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Deployment error:', error)
      setDeploymentResult('Deployment failed. Please check the logs.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Manager</CardTitle>
        <CardDescription>Configure and deploy your system</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "environment"> }) => (
                <FormItem>
                  <FormLabel>Environment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "region"> }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. East US" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resources"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "resources"> }) => (
                <FormItem>
                  <FormLabel>Resources Configuration</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter JSON configuration for resources" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scalingRules"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "scalingRules"> }) => (
                <FormItem>
                  <FormLabel>Scaling Rules</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter JSON configuration for scaling rules" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="backupConfig"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "backupConfig"> }) => (
                <FormItem>
                  <FormLabel>Backup Configuration</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter JSON configuration for backups" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monitoringConfig"
              render={({ field }: { field: ControllerRenderProps<z.infer<typeof deploymentFormSchema>, "monitoringConfig"> }) => (
                <FormItem>
                  <FormLabel>Monitoring Configuration</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter JSON configuration for monitoring" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                'Deploy System'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {deploymentResult && (
        <CardFooter>
          <pre className="mt-4 w-full overflow-auto bg-gray-100 p-4 rounded">
            {deploymentResult}
          </pre>
        </CardFooter>
      )}
    </Card>
  )
}

