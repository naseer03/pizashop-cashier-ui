'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_STORE_NAME,
  fetchGeneralSettingsClient,
  getStoreName,
} from '@/lib/store-settings'

interface StoreBrandingContextValue {
  storeName: string
}

const StoreBrandingContext = createContext<StoreBrandingContextValue>({
  storeName: DEFAULT_STORE_NAME,
})

export function useStoreBranding(): StoreBrandingContextValue {
  return useContext(StoreBrandingContext)
}

interface StoreBrandingProviderProps {
  children: ReactNode
  initialStoreName?: string
}

export function StoreBrandingProvider({
  children,
  initialStoreName,
}: StoreBrandingProviderProps) {
  const [storeName, setStoreName] = useState(
    initialStoreName?.trim() || DEFAULT_STORE_NAME,
  )

  useEffect(() => {
    let cancelled = false

    void fetchGeneralSettingsClient().then((data) => {
      if (cancelled) return
      setStoreName(getStoreName(data))
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.title = `${storeName} - Cashier Dashboard`
  }, [storeName])

  return (
    <StoreBrandingContext.Provider value={{ storeName }}>
      {children}
    </StoreBrandingContext.Provider>
  )
}
