import { NextRequest, NextResponse } from 'next/server'

const ACTIVE_ORDERS_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/orders/active'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const response = await fetch(ACTIVE_ORDERS_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })

    const text = await response.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { success: false, message: text }
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        data ?? { success: false, message: 'Failed to fetch active orders' },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch active orders' },
      { status: 500 },
    )
  }
}
