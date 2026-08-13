import { useState, type FormEvent } from 'react'
import {
  HiArrowRightOnRectangle,
  HiEye,
  HiEyeSlash,
  HiEnvelope,
  HiLockClosed,
} from 'react-icons/hi2'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ScholarFiWordmark, SolanaMark } from '../components/BrandLogos'

export function LoginPage() {
  const { login, token, profile, bootstrapping, loginError } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleToggle() {
    setShowPassword((prev) => !prev)
  }

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
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="relative flex min-h-[46vh] flex-col justify-center overflow-hidden border-b border-white/10 bg-primary px-8 py-10 text-primary-content sm:px-10 lg:min-h-svh lg:border-b-0 lg:border-r lg:py-14">
        {/* Background: ScholarFi wordmark only as oversized watermark � no photo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <ScholarFiWordmark className="absolute left-1/2 top-1/2 h-[min(78vh,32rem)] w-auto max-w-[min(145vw,52rem)] -translate-x-1/2 -translate-y-1/2  object-contain opacity-[0.14] brightness-0 invert" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-base-content/20 via-transparent to-base-content/15"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Gestiona y reconoce el mérito escolar
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-content/95">
              Revisa los logros registrados por los estudiantes, valida evidencias y aprueba la entrega de ScholarFi Credits desde un solo lugar.
            </p>
            <div className="mt-6 rounded-box border border-white/15 bg-base-content/10 p-4 backdrop-blur-[2px]">
              <p className="text-sm font-semibold">Para dirección y comités escolares</p>
              <p className="mt-1 text-sm text-primary-content/90">
                Consulta el estado de cada solicitud, identifica quién la revisó y mantén un historial claro de todas las decisiones.
              </p>
            </div>

            <div
              className="mt-6 inline-flex max-w-full items-center gap-3 rounded-xl border border-white/15 bg-base-content/10 px-3 py-2.5 backdrop-blur-[2px]"
              role="img"
              aria-label="Powered by Solana. Verified ecosystem."
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0a1628]/90 ring-1 ring-white/10">
                <SolanaMark className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="text-sm font-bold leading-tight text-white">Powered by Solana</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-content/65">
                  VERIFIED ECOSYSTEM
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center bg-base-200 p-6">
        <div className="w-full max-w-md space-y-4">
          {/*     <KpiStrip
            items={[
              { label: 'Gobernanza', value: '100%', hint: 'Flujo por roles' },
              { label: 'Operacion', value: '24/7', hint: 'Seguimiento continuo' },
            ]}
          /> */}
          <div className="card border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body">
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input input-bordered w-full pe-12"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-square btn-sm absolute end-1 top-1/2 min-h-8 w-8 -translate-y-1/2 border-0"
                      onClick={handleToggle}
                      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <HiEyeSlash className="h-5 w-5 opacity-80" aria-hidden />
                      ) : (
                        <HiEye className="h-5 w-5 opacity-80" aria-hidden />
                      )}
                    </button>
                  </div>
                </label>
                <div className="card-actions mt-2 justify-end gap-2">
                  {/*  <button type="button" className="btn btn-ghost gap-1" onClick={() => void logout()}>
                    <HiArrowRightStartOnRectangle className="h-4 w-4" aria-hidden />
                    Limpiar sesion
                  </button> */}
                  <button type="submit" className="btn btn-primary gap-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Entrando�
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

              <p className="mt-4 text-center text-sm text-base-content/70">
                Si tu docente sincronizo tu clase de Google Classroom, entra con tu correo y la
                contrasena inicial; luego cambiala desde el menu de usuario. Si te registraron con
                matricula,{' '}
                <Link to="/registro" className="link link-primary font-medium">
                  activa tu cuenta aqui
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
