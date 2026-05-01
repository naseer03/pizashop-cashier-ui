import { NextRequest, NextResponse } from 'next/server'

const TAX_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/tax'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const response = await fetch(TAX_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch tax' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch tax' },
      { status: 500 },
    )
  }
}
