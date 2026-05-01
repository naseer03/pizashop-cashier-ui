import { NextRequest, NextResponse } from 'next/server'

/** Use cashier create-order endpoint as requested. */
const KOT_RECEIPT_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/orders/'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization header' },
        { status: 401 },
      )
    }

    const bodyText = await request.text()
    if (!bodyText) {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
    }

    const response = await fetch(KOT_RECEIPT_API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/pdf, text/html;q=0.9,*/*;q=0.8',
      },
      body: bodyText,
    })

    const contentType = response.headers.get('content-type') ?? ''
    const buffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Unable to fetch KOT receipt' },
      { status: 500 },
    )
  }
}
