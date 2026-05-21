import { NextRequest, NextResponse } from 'next/server'

const CASHIER_TOPPINGS_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/toppings'
const PUBLIC_TOPPINGS_API_URL = 'https://pizzaapi.lefruit.in/v1/toppings'

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { success: false, message: text }
  }
}

function availableFlag(request: NextRequest): string {
  const isAvailable = request.nextUrl.searchParams.get('is_available')
  const onlyAvailable = request.nextUrl.searchParams.get('only_available')
  if (onlyAvailable != null && onlyAvailable !== '') return onlyAvailable
  if (isAvailable != null && isAvailable !== '') return isAvailable
  return 'true'
}

function buildCashierToppingsUrl(request: NextRequest): URL {
  const upstreamUrl = new URL(CASHIER_TOPPINGS_API_URL)
  const categoryId = request.nextUrl.searchParams.get('category_id')
  if (categoryId?.trim()) {
    upstreamUrl.searchParams.set('category_id', categoryId.trim())
  }
  upstreamUrl.searchParams.set('only_available', availableFlag(request))
  return upstreamUrl
}

function buildPublicToppingsUrl(request: NextRequest): URL {
  const upstreamUrl = new URL(PUBLIC_TOPPINGS_API_URL)
  const categoryId = request.nextUrl.searchParams.get('category_id')
  if (categoryId?.trim()) {
    upstreamUrl.searchParams.set('category_id', categoryId.trim())
  }
  upstreamUrl.searchParams.set('is_available', availableFlag(request))
  return upstreamUrl
}

async function fetchToppingsUpstream(
  url: URL,
  authHeader: string,
): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: authHeader,
    },
  })
  const data = await readJsonResponse(response)
  return { response, data }
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

    let { response, data } = await fetchToppingsUpstream(
      buildCashierToppingsUrl(request),
      authHeader,
    )

    if (!response.ok) {
      const fallback = await fetchToppingsUpstream(
        buildPublicToppingsUrl(request),
        authHeader,
      )
      if (fallback.response.ok) {
        response = fallback.response
        data = fallback.data
      }
    }

    if (!response.ok) {
      const message =
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : 'Failed to fetch toppings'

      return NextResponse.json(
        data ?? { success: false, message },
        { status: response.status },
      )
    }

    return NextResponse.json(data ?? { success: true, data: { categories: [] } })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch toppings' },
      { status: 500 },
    )
  }
}
