import { spawn } from 'child_process'

interface DatabaseOptions {
  timeout?: number;
  retries?: number;
}

export class DatabaseManager {
  private pythonProcess: ReturnType<typeof spawn>

  constructor(
    postgresConn: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    },
    neo4jConn: {
      uri: string;
      username: string;
      password: string;
    },
    options: DatabaseOptions = {}
  ) {
    this.pythonProcess = spawn('python', ['C:\Users\sidki\source\repos\my-4d-mapping-app\backend\database_manager.py'], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Send connection details to the Python process
    this.pythonProcess.stdin!.write(JSON.stringify({
      postgres_conn: postgresConn,
      neo4j_conn: neo4jConn,
      options: options
    }))
    this.pythonProcess.stdin!.end()
  }

  async create_crosswalk(source_id: string, target_id: string, crosswalk_type: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pythonProcess.stdin!.write(JSON.stringify({
        method: 'create_crosswalk',
        params: { source_id, target_id, crosswalk_type }
      }))

      if (!this.pythonProcess.stdout) {
        reject(new Error('Python process stdout is not available'));
        return;
      }

      this.pythonProcess.stdout.once('data', (data: Buffer) => {
        const result = JSON.parse(data.toString())
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve()
        }
      })
    })
  }

  async get_regulation_with_crosswalks(regulation_id: string): Promise<{
    id: string;
    content: string;
    crosswalks: Array<{
      source_id: string;
      target_id: string;
      crosswalk_type: string;
    }>;
  }> {
    return new Promise((resolve, reject) => {
      this.pythonProcess.stdin!.write(JSON.stringify({
        method: 'get_regulation_with_crosswalks',
        params: { regulation_id }
      }))

      if (!this.pythonProcess.stdout) {
        reject(new Error('Python process stdout is not available'));
        return;
      }

      this.pythonProcess.stdout.once('data', (data: Buffer) => {
        const result = JSON.parse(data.toString())
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result)
        }
      })
    })
  }

  close() {
    this.pythonProcess.kill()
  }
}