import { useState, type FormEvent } from 'react'
import {
  HiArrowRightOnRectangle,
  HiEye,
  HiEyeSlash,
  HiEnvelope,
  HiIdentification,
  HiLockClosed,
} from 'react-icons/hi2'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ScholarFiWordmark, SolanaMark } from '../components/BrandLogos'

export function RegisterStudentPage() {
  const { registerStudent, token, profile, bootstrapping, registerError } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    if (password !== passwordConfirmation) {
      setLocalError('Las contrasenas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      await registerStudent(email.trim(), registrationNumber.trim(), password, passwordConfirmation)
    } catch {
      setLocalError('No se pudo completar el registro')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="relative flex min-h-[46vh] flex-col justify-center overflow-hidden border-b border-white/10 bg-primary px-8 py-10 text-primary-content sm:px-10 lg:min-h-svh lg:border-b-0 lg:border-r lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <ScholarFiWordmark className="absolute left-1/2 top-1/2 h-[min(78vh,32rem)] w-auto max-w-[min(145vw,52rem)] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.14] brightness-0 invert" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-base-content/20 via-transparent to-base-content/15"
          aria-hidden
        />

        <div className="relative z-[1] mx-auto flex w-full max-w-xl flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Activa tu cuenta con tu matricula
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-content/95">
              Si tu profesor ya cargo tu lista, registra tu correo institucional, tu matricula y elige
              una contrasena para entrar a ScholarFi.
            </p>
            <div className="mt-6 rounded-box border border-white/15 bg-base-content/10 p-4 backdrop-blur-[2px]">
              <p className="text-sm font-semibold">Sin invitacion por correo</p>
              <p className="mt-1 text-sm text-primary-content/90">
                Usa el mismo correo y matricula que aparecen en la lista de tu clase.
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
              <div className="flex min-w-0 flex-col gap-0.5">
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
          <div className="card border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title justify-center text-2xl font-semibold text-base-content">
                Registro de estudiante
              </h2>

              {(registerError || localError) && (
                <div role="alert" className="alert alert-error text-sm">
                  {registerError ?? localError}
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
                      <HiIdentification className="h-4 w-4 opacity-70" aria-hidden />
                      Matricula
                    </span>
                  </div>
                  <input
                    type="text"
                    autoComplete="off"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input input-bordered w-full pe-12"
                      minLength={8}
                      maxLength={32}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-square btn-sm absolute end-1 top-1/2 min-h-8 w-8 -translate-y-1/2 border-0"
                      onClick={() => setShowPassword((prev) => !prev)}
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

                <label className="form-control w-full">
                  <div className="label pt-0">
                    <span className="label-text flex items-center gap-1.5">
                      <HiLockClosed className="h-4 w-4 opacity-70" aria-hidden />
                      Confirmar contrasena
                    </span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="input input-bordered w-full"
                    minLength={8}
                    maxLength={32}
                    required
                  />
                </label>

                <div className="card-actions mt-2 justify-end gap-2">
                  <button type="submit" className="btn btn-primary gap-1" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Registrando…
                      </>
                    ) : (
                      <>
                        <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                        Activar cuenta
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-center text-sm text-base-content/70">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="link link-primary font-medium">
                  Iniciar sesion
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
