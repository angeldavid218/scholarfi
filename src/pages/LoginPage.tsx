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
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout'
import { AlertBanner } from '../components/ui/AlertBanner'
import { FormField } from '../components/ui/FormField'
import { LoadingButton } from '../components/ui/LoadingButton'
import { PageSpinner } from '../components/ui/PageSpinner'

export const LoginPage = () => {
  const { login, token, profile, bootstrapping, loginError } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (token && bootstrapping) {
    return <PageSpinner fullscreen size="lg" />
  }

  if (token && profile) {
    return <Navigate to={from} replace />
  }

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setLocalError(null)
    setSubmitting(true)
    try {
      await login(nextEmail.trim(), nextPassword)
    } catch {
      setLocalError('Credenciales invalidas')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }

  return (
    <AuthSplitLayout
      asideTitle="Gestiona y reconoce el mérito escolar"
      asideBody="Revisa los logros registrados por los estudiantes, valida evidencias y aprueba la entrega de ScholarFi Credits desde un solo lugar."
      asideCalloutTitle="Para dirección y comités escolares"
      asideCalloutBody="Consulta el estado de cada solicitud, identifica quién la revisó y mantén un historial claro de todas las decisiones."
    >
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-semibold text-base-content">
            Iniciar sesion
          </h2>
          {loginError || localError ? (
            <AlertBanner tone="error">{loginError ?? localError}</AlertBanner>
          ) : null}
          <form className="mt-2 flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <HiEnvelope className="h-4 w-4 opacity-70" aria-hidden />
                  Correo
                </span>
              }
            >
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </FormField>
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <HiLockClosed className="h-4 w-4 opacity-70" aria-hidden />
                  Contraseña
                </span>
              }
            >
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
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <HiEyeSlash className="h-5 w-5 opacity-80" aria-hidden />
                  ) : (
                    <HiEye className="h-5 w-5 opacity-80" aria-hidden />
                  )}
                </button>
              </div>
            </FormField>
            <div className="card-actions mt-2 justify-end gap-2">
              <LoadingButton
                type="submit"
                className="btn btn-primary gap-1"
                loading={submitting}
                loadingLabel="Entrando…"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                Entrar
              </LoadingButton>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-base-content/70">
            <Link to="/registro" className="link link-primary font-medium">
              activa tu cuenta aqui
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
