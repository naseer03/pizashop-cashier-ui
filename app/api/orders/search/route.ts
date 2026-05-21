import { NextRequest, NextResponse } from 'next/server'
import {
  fetchUpstreamWithRetry,
  getPizzaApiBaseUrl,
  getUpstreamErrorMessage,
} from '@/lib/upstream-fetch'

function isNumericDatabaseId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

function looksLikeOrderNumber(value: string): boolean {
  return /^ORD-/i.test(value.trim())
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const orderNumber =
      request.nextUrl.searchParams.get('order_number')?.trim() ||
      request.nextUrl.searchParams.get('q')?.trim() ||
      request.nextUrl.searchParams.get('order_id')?.trim()

    if (!orderNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'order_number query parameter is required (e.g. ORD-2026-001)',
        },
        { status: 400 },
      )
    }

    const base = getPizzaApiBaseUrl()
    const encoded = encodeURIComponent(orderNumber)

    let response: Response
    let data: unknown

    if (isNumericDatabaseId(orderNumber) && !looksLikeOrderNumber(orderNumber)) {
      const byIdUrl = `${base}/v1/cashier/orders/${encoded}`
      ;({ response, data } = await fetchUpstreamWithRetry(byIdUrl, authHeader))

      if (!response.ok) {
        const publicById = `${base}/v1/orders/${encoded}`
        ;({ response, data } = await fetchUpstreamWithRetry(publicById, authHeader))
      }
    } else {
      const searchUrl = new URL(`${base}/v1/cashier/orders/search`)
      searchUrl.searchParams.set('order_number', orderNumber)
      ;({ response, data } = await fetchUpstreamWithRetry(searchUrl.toString(), authHeader))
    }

    if (!response.ok) {
      return NextResponse.json(
        data ?? {
          success: false,
          message: getUpstreamErrorMessage(data, 'Failed to search order'),
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data ?? { success: false, message: 'Empty response from server' })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to search order' },
      { status: 500 },
    )
  }
}
