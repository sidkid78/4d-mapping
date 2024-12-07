interface MaintenanceTask {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  scheduledFor: Date;
  description: string;
}

interface MaintenanceManagerConfig {
  enableAutoScheduling?: boolean;
  notificationThreshold?: number; // Hours before task to notify
}

export class MaintenanceManager {
  private config: Required<MaintenanceManagerConfig>;
  private tasks: MaintenanceTask[];

  constructor(config: MaintenanceManagerConfig = {}) {
    this.config = {
      enableAutoScheduling: config.enableAutoScheduling ?? true,
      notificationThreshold: config.notificationThreshold ?? 24, // Default to 24 hours
    };
    this.tasks = [];
  }
}

