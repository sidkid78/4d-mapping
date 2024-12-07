import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface MonitoringSystemConfig {
  alertThreshold?: number
  checkInterval?: number
  enableNotifications?: boolean
}

interface MonitoringMetrics {
  cpu: number
  memory: number
  latency: number
  timestamp: number
}

interface MonitoringAlert {
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: number
}

export class MonitoringSystem {
  private config: Required<MonitoringSystemConfig>
  private metrics: MonitoringMetrics[]
  private alerts: MonitoringAlert[]

  constructor(config: MonitoringSystemConfig = {}) {
    this.config = {
      alertThreshold: config.alertThreshold ?? 90,
      checkInterval: config.checkInterval ?? 60000,
      enableNotifications: config.enableNotifications ?? true
    }
    this.metrics = []
    this.alerts = []
  }

  async configure_monitoring() {
    try {
      await this.initializeMonitoring()
      return {
        status: 'success',
        message: 'Monitoring system configured successfully'
      }
    } catch (error) {
      console.error('Failed to configure monitoring:', error)
      throw new Error('Monitoring configuration failed')
    }
  }

  private async initializeMonitoring() {
    // Simulate monitoring initialization
    const metrics: MonitoringMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      latency: Math.random() * 1000,
      timestamp: Date.now()
    }

    this.metrics.push(metrics)

    if (metrics.cpu > this.config.alertThreshold) {
      this.addAlert({
        type: 'warning',
        message: `High CPU usage detected: ${metrics.cpu.toFixed(2)}%`,
        timestamp: Date.now()
      })
    }

    return metrics
  }

  private addAlert(alert: MonitoringAlert) {
    this.alerts.push(alert)
    if (this.config.enableNotifications) {
      this.sendNotification(alert)
    }
  }

  private sendNotification(alert: MonitoringAlert) {
    // Implement notification logic (e.g., webhooks, email)
    console.log('Alert notification:', alert)
  }

  public getMetrics() {
    return this.metrics
  }

  public getAlerts() {
    return this.alerts
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
