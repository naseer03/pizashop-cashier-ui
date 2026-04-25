import { NextRequest, NextResponse } from 'next/server'

const ORDERS_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/orders'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 },
      )
    }

    const response = await fetch(ORDERS_API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
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
        data ?? { success: false, message: 'Failed to create order' },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to create order' },
      { status: 500 },
    )
  }
}
