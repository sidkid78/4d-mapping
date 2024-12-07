import { DatabaseManagementSystem } from './database-management-system'

// Define config interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  apiKey: string;
  version: string;
}

// Define base interface for manager methods
interface IDBManager {
  getProcessCount(): Promise<number>;
  getActiveTaskCount(): Promise<number>;
  getCompletedTaskCount(): Promise<number>;
  createCrosswalk(sourceId: string, targetId: string, crosswalkType: string): Promise<void>;
}

// Export single class implementing interface
export class DatabaseManager implements IDBManager {
  private static instance: DatabaseManager;
  private dms: DatabaseManagementSystem;

  private constructor() {
    this.dms = new DatabaseManagementSystem();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getProcessCount(): Promise<number> {
    return await this.dms.getCount('processes');
  }

  async getActiveTaskCount(): Promise<number> {
    return await this.dms.getCount('tasks', { status: 'active' });
  }

  async getCompletedTaskCount(): Promise<number> {
    return await this.dms.getCount('tasks', { status: 'completed' });
  }

  async createCrosswalk(sourceId: string, targetId: string, crosswalkType: string): Promise<void> {
    await this.dms.createCrosswalk(sourceId, targetId, crosswalkType);
  }
}

export function getDatabaseManager(): DatabaseManager {
  return DatabaseManager.getInstance();
}