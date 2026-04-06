'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pizza } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DUMMY_USERNAME,
  DUMMY_PASSWORD,
  validateDummyCredentials,
  setClientLoggedIn,
  isClientLoggedIn,
} from '@/lib/auth-dummy'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isClientLoggedIn()) {
      router.replace('/')
    }
  }, [router])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const ok = validateDummyCredentials(username.trim(), password)
    if (!ok) {
      setError('Invalid username or password.')
      setSubmitting(false)
      return
    }

    setClientLoggedIn()
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-y-auto bg-background p-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            <Pizza className="size-8 text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pizza POS</h1>
          <p className="text-sm text-muted-foreground">Sign in to open the cashier dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-10" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
            Demo: username <span className="font-mono text-foreground">{DUMMY_USERNAME}</span>
            {' · '}
            password <span className="font-mono text-foreground">{DUMMY_PASSWORD}</span>
          </p>
        </form>
      </div>
    </div>
  )
}
