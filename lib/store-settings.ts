export const GENERAL_SETTINGS_API_URL =
  'https://pizzaapi.lefruit.in/v1/settings/general'

export const DEFAULT_STORE_NAME = 'Pizza POS'

export interface StoreProfile {
  store_name: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  logo_url?: string | null
  currency?: string | null
  currency_symbol?: string | null
  timezone?: string | null
}

export interface GeneralSettingsData {
  store: StoreProfile
}

export interface GeneralSettingsResponse {
  success: boolean
  data?: GeneralSettingsData
}

export function getStoreName(data: GeneralSettingsData | null | undefined): string {
  const name = data?.store?.store_name?.trim()
  return name || DEFAULT_STORE_NAME
}

export async function fetchGeneralSettings(): Promise<GeneralSettingsData | null> {
  try {
    const response = await fetch(GENERAL_SETTINGS_API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as GeneralSettingsResponse
    return json.success && json.data ? json.data : null
  } catch {
    return null
  }
}

export async function fetchGeneralSettingsClient(): Promise<GeneralSettingsData | null> {
  try {
    const response = await fetch('/api/settings/general', { cache: 'no-store' })

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as GeneralSettingsResponse
    return json.success && json.data ? json.data : null
  } catch {
    return null
  }
}
