import { NextApiRequest, NextApiResponse } from 'next'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { params } = req.query
  const path = Array.isArray(params) ? params.join('/') : params

  try {
    const response = await fetch(`${FASTAPI_URL}/items/${path}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error: unknown) {
    console.error('Error connecting to backend:', error)
    res.status(500).json({ error: 'Error connecting to the backend server' })
  }
}