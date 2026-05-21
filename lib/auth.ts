'use client'

export const AUTH_SESSION_KEY = 'pos_cashier_auth'
export const AUTH_EXPIRED_MESSAGE_KEY = 'pos_auth_expired_message'

const DEFAULT_AUTH_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/auth/login'

/** Buffer before JWT expiry to avoid edge-case 401s mid-request */
const EXPIRY_BUFFER_MS = 30_000

export interface CashierEmployee {
  id: number
  email: string
  first_name: string
  last_name: string
  role?: {
    id: number
    name: string
  }
  permissions?: string[]
}

interface LoginApiResponse {
  success: boolean
  data?: {
    access_token: string
    expires_in: number
    token_type: string
    employee: CashierEmployee
  }
  message?: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresIn: number
  /** Unix ms when the access token should be treated as invalid */
  expiresAt: number
  employee: CashierEmployee
}

export function getAppBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
  if (!raw || raw === '/') return ''
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash.replace(/\/$/, '')
}

export function getLoginUrl(): string {
  return `${getAppBasePath()}/login`
}

/** Prefix relative API paths with Next.js basePath (e.g. GitHub Pages deploy). */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = getAppBasePath()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export async function loginCashier(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(DEFAULT_AUTH_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  })

  let payload: LoginApiResponse | null = null
  try {
    payload = (await response.json()) as LoginApiResponse
  } catch {
    throw new Error('Unable to read login response from server.')
  }

  if (!response.ok || !payload?.success || !payload.data?.access_token || !payload.data?.employee) {
    const errorMessage = payload?.message?.trim()
    throw new Error(errorMessage || 'Invalid email or password.')
  }

  const expiresIn = Number(payload.data.expires_in)
  const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600

  return {
    accessToken: payload.data.access_token,
    expiresIn: safeExpiresIn,
    expiresAt: Date.now() + safeExpiresIn * 1000,
    tokenType: payload.data.token_type || 'Bearer',
    employee: payload.data.employee,
  }
}

export function setClientSession(session: AuthSession): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearClientAuth(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

function normalizeStoredSession(raw: AuthSession): AuthSession | null {
  if (!raw?.accessToken) return null

  let expiresAt = raw.expiresAt
  if (!Number.isFinite(expiresAt) && Number.isFinite(raw.expiresIn) && raw.expiresIn > 0) {
    expiresAt = Date.now() + raw.expiresIn * 1000
  }

  if (!Number.isFinite(expiresAt)) {
    return { ...raw, expiresAt: Date.now() + 3600 * 1000 }
  }

  if (Date.now() >= expiresAt - EXPIRY_BUFFER_MS) {
    return null
  }

  return { ...raw, expiresAt }
}

export function getClientSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as AuthSession
    const session = normalizeStoredSession(parsed)
    if (!session) {
      sessionStorage.removeItem(AUTH_SESSION_KEY)
      return null
    }
    return session
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function isClientLoggedIn(): boolean {
  return Boolean(getClientSession()?.accessToken)
}

export function getAuthExpiredMessageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  const message = typeof record.message === 'string' ? record.message.trim() : ''
  if (message) return message
  const error = typeof record.error === 'string' ? record.error.trim() : ''
  return error || null
}

export function isApiAuthExpired(status: number, body: unknown): boolean {
  if (status === 401) return true

  if (!body || typeof body !== 'object') return false

  const record = body as Record<string, unknown>
  const code = String(record.code ?? record.error_code ?? '').toUpperCase()
  const message = String(record.message ?? record.error ?? '').toUpperCase()

  return (
    code.includes('AUTH_TOKEN_EXPIRED') ||
    code.includes('TOKEN_EXPIRED') ||
    message.includes('AUTH_TOKEN_EXPIRED') ||
    message.includes('TOKEN HAS EXPIRED') ||
    message.includes('ACCESS TOKEN HAS EXPIRED')
  )
}

export function invalidateSessionIfAuthError(status: number, body: unknown): boolean {
  if (!isApiAuthExpired(status, body)) return false
  handleAuthExpired(
    getAuthExpiredMessageFromBody(body) ?? 'Your session has expired. Please sign in again.',
  )
  return true
}

export function handleAuthExpired(message?: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(
    AUTH_EXPIRED_MESSAGE_KEY,
    message?.trim() || 'Your session has expired. Please sign in again.',
  )
  clearClientAuth()
  window.location.replace(getLoginUrl())
}

export function consumeAuthExpiredMessage(): string | null {
  if (typeof window === 'undefined') return null
  const message = sessionStorage.getItem(AUTH_EXPIRED_MESSAGE_KEY)
  if (message) {
    sessionStorage.removeItem(AUTH_EXPIRED_MESSAGE_KEY)
  }
  return message
}

export function getCashierInitials(employee?: CashierEmployee | null): string {
  if (!employee) return 'CA'
  const first = employee.first_name?.trim().charAt(0) ?? ''
  const last = employee.last_name?.trim().charAt(0) ?? ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || 'CA'
}

export function getCashierDisplayName(employee?: CashierEmployee | null): string {
  if (!employee) return 'Cashier'
  const fullName = `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim()
  return fullName || employee.email || 'Cashier'
}
