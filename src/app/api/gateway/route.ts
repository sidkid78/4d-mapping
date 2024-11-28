import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/api_utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { isValid, errorMessage } = validateRequest(body, ['route', 'data'])
    
    if (!isValid) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { route, data } = body

    let result

    switch (route) {
      case 'advanced-ai-engine':
        result = await fetch('/api/advanced-ai-engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'regulation-manager':
        // Implement or call regulation manager API
        break
      case 'workflow-manager':
        // Implement or call workflow manager API
        break
      case 'database-management':
        // Implement or call database management API
        break
      default:
        return NextResponse.json({ error: 'Invalid route' }, { status: 400 })
    }

    if (result) {
      const responseData = await result.json()
      return NextResponse.json(responseData)
    } else {
      return NextResponse.json({ error: 'Route not implemented' }, { status: 501 })
    }
  } catch (error) {
    console.error('Error in API Gateway:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}