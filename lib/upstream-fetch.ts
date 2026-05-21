const DEFAULT_API_BASE = 'https://pizzaapi.lefruit.in'

export const UPSTREAM_FETCH_TIMEOUT_MS = 25_000

export function getPizzaApiBaseUrl(): string {
  const raw = process.env.PIZZA_API_URL?.trim() || DEFAULT_API_BASE
  return raw.replace(/\/$/, '')
}

export async function readUpstreamJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { success: false, message: text.slice(0, 500) }
  }
}

export function getUpstreamErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message.trim()
  }

  const nested = record.error
  if (nested && typeof nested === 'object') {
    const err = nested as Record<string, unknown>
    const code = typeof err.code === 'string' ? err.code.trim() : ''
    const msg = typeof err.message === 'string' ? err.message.trim() : ''
    if (code && msg) return `${msg} (${code})`
    if (msg) return msg
    if (code) return code
  }

  return fallback
}

export async function fetchUpstreamWithAuth(
  url: string,
  authHeader: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: unknown }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
        ...(init.headers ?? {}),
      },
    })
    const data = await readUpstreamJson(response)
    return { response, data }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Request timed out while contacting the server.'
        : 'Unable to reach the API server. Check your network connection.'

    return {
      response: new Response(
        JSON.stringify({ success: false, message }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      ),
      data: { success: false, message },
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchUpstreamWithRetry(
  url: string,
  authHeader: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: unknown }> {
  let result = await fetchUpstreamWithAuth(url, authHeader, init)

  if (
    !result.response.ok &&
    [502, 503, 504].includes(result.response.status)
  ) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    result = await fetchUpstreamWithAuth(url, authHeader, init)
  }

  return result
}
