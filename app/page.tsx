'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PosApp } from '@/components/pos/pos-app'
import { isClientLoggedIn } from '@/lib/auth-dummy'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const ok = isClientLoggedIn()
    setAuthed(ok)
    setReady(true)
    if (!ok) {
      router.replace('/login')
    }
  }, [router])

  if (!ready) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background text-muted-foreground text-sm">
        Redirecting to login…
      </div>
    )
  }

  return <PosApp />
}
