'use client'

export const AUTH_SESSION_KEY = 'pos_cashier_auth'

const DEFAULT_AUTH_API_URL = 'https://pizzaapi.lefruit.in/v1/cashier/auth/login'

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
  employee: CashierEmployee
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

  return {
    accessToken: payload.data.access_token,
    expiresIn: payload.data.expires_in,
    tokenType: payload.data.token_type,
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

export function getClientSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function isClientLoggedIn(): boolean {
  const session = getClientSession()
  return Boolean(session?.accessToken)
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
