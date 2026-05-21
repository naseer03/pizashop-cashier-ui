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

    const onlyAvailable = request.nextUrl.searchParams.get('only_available') ?? 'true'
    const upstreamUrl = new URL(`${getPizzaApiBaseUrl()}/v1/cashier/menu`)
    upstreamUrl.searchParams.set('only_available', onlyAvailable)

    const { response, data } = await fetchUpstreamWithRetry(
      upstreamUrl.toString(),
      authHeader,
    )

    if (!response.ok) {
      return NextResponse.json(
        data ?? {
          success: false,
          message: getUpstreamErrorMessage(data, 'Failed to fetch menu'),
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data ?? { success: true, data: { items: [] } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch menu' },
      { status: 500 },
    )
  }
}
