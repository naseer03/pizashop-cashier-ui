import { NextRequest, NextResponse } from 'next/server'

const CRUSTS_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/crusts?only_available=true'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const response = await fetch(CRUSTS_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch crusts' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch crusts' },
      { status: 500 },
    )
  }
}
