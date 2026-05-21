import { NextResponse } from 'next/server'
import { GENERAL_SETTINGS_API_URL } from '@/lib/store-settings'

export async function GET() {
  try {
    const response = await fetch(GENERAL_SETTINGS_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch general settings' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch general settings' },
      { status: 500 },
    )
  }
}
