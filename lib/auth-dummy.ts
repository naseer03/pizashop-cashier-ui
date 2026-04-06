/** Demo-only credentials. Replace with real auth when integrating a backend. */
export const DUMMY_USERNAME = 'cashier'
export const DUMMY_PASSWORD = 'pizza123'

export const AUTH_SESSION_KEY = 'pos_cashier_auth'

export function validateDummyCredentials(username: string, password: string): boolean {
  return username.trim() === DUMMY_USERNAME && password === DUMMY_PASSWORD
}

export function setClientLoggedIn(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_SESSION_KEY, '1')
}

export function clearClientAuth(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function isClientLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(AUTH_SESSION_KEY) === '1'
}
