import { NextRequest, NextResponse } from 'next/server'

const MENU_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/menu'

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

    const upstreamUrl = new URL(MENU_API_URL)
    upstreamUrl.searchParams.set('only_available', onlyAvailable)

    const response = await fetch(upstreamUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch menu' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch menu' },
      { status: 500 },
    )
  }
}
