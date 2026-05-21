'use client'

import {
  getApiUrl,
  getClientSession,
  handleAuthExpired,
  invalidateSessionIfAuthError,
} from '@/lib/auth'

/**
 * Authenticated fetch for cashier API routes. Returns null if session is missing or expired (redirects to login).
 */
export async function cashierAuthFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const session = getClientSession()
  if (!session?.accessToken) {
    handleAuthExpired('Please sign in to continue.')
    return null
  }

  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  headers.set('Authorization', `${session.tokenType || 'Bearer'} ${session.accessToken}`)

  const url = typeof input === 'string' ? getApiUrl(input) : input
  const response = await fetch(url, { ...init, headers })

  if (response.status === 401) {
    let body: unknown = null
    try {
      body = await response.clone().json()
    } catch {
      // ignore non-JSON 401
    }
    if (invalidateSessionIfAuthError(response.status, body)) {
      return null
    }
  }

  return response
}

/** Call after parsing JSON when status may be 401 or body reports token expiry */
export function handleAuthErrorFromResponse(
  status: number,
  body: unknown,
): boolean {
  return invalidateSessionIfAuthError(status, body)
}
