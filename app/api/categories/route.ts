import { NextRequest, NextResponse } from 'next/server'
import {
  fetchUpstreamWithRetry,
  getPizzaApiBaseUrl,
  getUpstreamErrorMessage,
} from '@/lib/upstream-fetch'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const url = `${getPizzaApiBaseUrl()}/v1/cashier/categories`
    const { response, data } = await fetchUpstreamWithRetry(url, authHeader)

    if (!response.ok) {
      return NextResponse.json(
        data ?? {
          success: false,
          message: getUpstreamErrorMessage(data, 'Failed to fetch categories'),
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data ?? { success: true, data: { categories: [] } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch categories' },
      { status: 500 },
    )
  }
}
