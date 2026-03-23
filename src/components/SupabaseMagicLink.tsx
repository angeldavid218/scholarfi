import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.ts'

export function SupabaseMagicLink() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setMessage(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      })
      setMessage(
        error
          ? error.message
          : 'Check your email for the sign-in link, then return here.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-base-200 p-4">
      <p className="text-sm text-base-content/80">
        Use Supabase Auth with the same user id as your <code className="text-xs">profiles</code>{' '}
        row so task completions and rewards match your wallet profile.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          className="input input-bordered input-sm min-w-[12rem] flex-1"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy || !email.trim()}
          onClick={() => void send()}
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : 'Email link'}
        </button>
      </div>
      {message && <p className="text-xs text-base-content/90">{message}</p>}
    </div>
  )
}
