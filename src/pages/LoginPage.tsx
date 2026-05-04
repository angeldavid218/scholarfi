import { useState, type FormEvent } from 'react'
import {
  HiArrowRightOnRectangle,
  HiArrowRightStartOnRectangle,
  HiEnvelope,
  HiLockClosed,
} from 'react-icons/hi2'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ScholarDiWordmark, ScholarFiWordmark } from '../components/BrandLogos'
import { KpiStrip } from '../components/ui/executive'

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
        <div className="mt-6 rounded-box border border-primary-content/20 bg-primary-content/10 p-4">
          <p className="text-sm font-semibold">Pensado para direccion y comites</p>
          <p className="mt-1 text-sm opacity-90">
            Trazabilidad por rol, decisiones auditables y visualizacion clara del avance estudiantil.
          </p>
        </div>
      </aside>

      <div className="flex items-center justify-center bg-base-200 p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col items-center gap-2 px-1 lg:hidden">
            <ScholarFiWordmark className="h-9 w-auto max-w-[200px] object-contain" />
            <ScholarDiWordmark className="h-6 w-auto max-w-[160px] object-contain opacity-90" />
          </div>
          <KpiStrip
            items={[
              { label: 'Gobernanza', value: '100%', hint: 'Flujo por roles' },
              { label: 'Operacion', value: '24/7', hint: 'Seguimiento continuo' },
            ]}
          />
          <div className="card border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-center pb-1">
                <ScholarFiWordmark className="h-10 w-auto max-w-[200px] object-contain" />
              </div>
              <h2 className="card-title justify-center text-2xl font-semibold text-base-content">
                Iniciar sesion
              </h2>
              {/*      <p className="text-sm text-base-content/70">
                API en <code className="rounded bg-base-200 px-1 py-0.5 text-xs">/api/v1</code> (proxy Vite) o{' '}
                <code className="rounded bg-base-200 px-1 py-0.5 text-xs">VITE_API_URL</code>.
              </p> */}

              {(loginError || localError) && (
                <div role="alert" className="alert alert-error text-sm">
                  {loginError ?? localError}
                </div>
              )}

              <form className="mt-2 flex flex-col gap-4" onSubmit={onSubmit}>
                <label className="form-control w-full">
                  <div className="label pt-0">
                    <span className="label-text flex items-center gap-1.5">
                      <HiEnvelope className="h-4 w-4 opacity-70" aria-hidden />
                      Correo
                    </span>
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
                    <span className="label-text flex items-center gap-1.5">
                      <HiLockClosed className="h-4 w-4 opacity-70" aria-hidden />
                      Contrasena
                    </span>
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
                  <button type="button" className="btn btn-ghost gap-1" onClick={() => void logout()}>
                    <HiArrowRightStartOnRectangle className="h-4 w-4" aria-hidden />
                    Limpiar sesion
                  </button>
                  <button type="submit" className="btn btn-primary gap-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Entrando…
                      </>
                    ) : (
                      <>
                        <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                        Entrar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
