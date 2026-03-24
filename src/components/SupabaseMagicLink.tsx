import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.ts'
import type { ProfileRole } from '../types/db.ts'

type SupabaseMagicLinkProps = {
  walletAddress?: string | null
  roleHint?: ProfileRole
}

export function SupabaseMagicLink({
  walletAddress,
  roleHint,
}: SupabaseMagicLinkProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const metadata = (() => {
    const data: Record<string, string> = {}
    const wallet = walletAddress?.trim()
    if (wallet) data.wallet_address = wallet
    if (roleHint) data.role = roleHint
    const name = fullName.trim()
    if (name) data.full_name = name
    return data
  })()

  const signUpWithPassword = async () => {
    setMessage(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: Object.keys(metadata).length > 0 ? metadata : undefined,
        },
      })
      setMessage(
        error
          ? error.message
          : 'Account created. You can now sign in with your email and password.',
      )
    } finally {
      setBusy(false)
    }
  }

  const signInWithPassword = async () => {
    setMessage(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setMessage(error ? error.message : 'Signed in successfully.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-base-200 p-4">
      <p className="text-sm text-base-content/80">
        Register or sign in with email and password.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          className="input input-bordered input-sm min-w-48 flex-1"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          className="input input-bordered input-sm min-w-48 flex-1"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          className="input input-bordered input-sm min-w-48 flex-1"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy || !email.trim() || password.length < 6}
          onClick={() => void signInWithPassword()}
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : 'Sign in'}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={busy || !email.trim() || password.length < 6}
          onClick={() => void signUpWithPassword()}
        >
          Register
        </button>
      </div>
      <p className="text-xs text-base-content/70">
        Keep the intended wallet connected before auth so your profile can link wallet + role.
      </p>
      {roleHint && (
        <p className="text-xs text-base-content/70">
          Registering from this page will default your role to <strong>{roleHint}</strong>.
        </p>
      )}
      {message && <p className="text-xs text-base-content/90">{message}</p>}
    </div>
  )
}
