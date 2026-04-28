import { NextRequest, NextResponse } from 'next/server'

const TOPPINGS_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/toppings?only_available=true'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const response = await fetch(TOPPINGS_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch toppings' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch toppings' },
      { status: 500 },
    )
  }
}
