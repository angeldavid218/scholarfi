import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, token, profile, bootstrapping, loginError, logout } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (token && bootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-base-200">
        <span className="loading loading-lg loading-spinner text-primary" aria-label="Cargando" />
      </div>
    )
  }

  if (token && profile) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch {
      setLocalError('Credenciales invalidas')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="hidden flex-col justify-center bg-primary px-10 py-12 text-primary-content lg:flex">
        <p className="text-sm font-medium uppercase tracking-wide opacity-90">ScholarFi</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
          Libro mayor del merito escolar
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-95">
          Gobernanza clara, colas de validacion y recompensa simulada — sin ruido de cadena. Accede con tu cuenta
          institucional.
        </p>
      </aside>

      <div className="flex items-center justify-center bg-base-200 p-6">
        <div className="card w-full max-w-md border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-semibold text-base-content">Iniciar sesion</h2>
            <p className="text-sm text-base-content/70">
              API en <code className="rounded bg-base-200 px-1 py-0.5 text-xs">/api/v1</code> (proxy Vite) o{' '}
              <code className="rounded bg-base-200 px-1 py-0.5 text-xs">VITE_API_URL</code>.
            </p>

            {(loginError || localError) && (
              <div role="alert" className="alert alert-error text-sm">
                {loginError ?? localError}
              </div>
            )}

            <form className="mt-2 flex flex-col gap-4" onSubmit={onSubmit}>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Correo</span>
                </div>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                  required
                />
              </label>
              <label className="form-control w-full">
                <div className="label pt-0">
                  <span className="label-text">Contrasena</span>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full"
                  required
                />
              </label>
              <div className="card-actions mt-2 justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                  Limpiar sesion
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Entrando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
