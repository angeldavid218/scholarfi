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
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout'
import { AlertBanner } from '../components/ui/AlertBanner'
import { FormField } from '../components/ui/FormField'
import { LoadingButton } from '../components/ui/LoadingButton'
import { PageSpinner } from '../components/ui/PageSpinner'

export const RegisterStudentPage = () => {
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
    return <PageSpinner fullscreen size="lg" />
  }

  if (token && profile) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
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
    <AuthSplitLayout
      asideTitle="Activa tu cuenta con tu matricula"
      asideBody="Si tu profesor ya cargo tu lista, registra tu correo institucional, tu matricula y elige una contrasena para entrar a ScholarFi."
      asideCalloutTitle="Sin invitacion por correo"
      asideCalloutBody="Usa el mismo correo y matricula que aparecen en la lista de tu clase."
    >
      <div className="card border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-semibold text-base-content">
            Registro de estudiante
          </h2>
          {registerError || localError ? (
            <AlertBanner tone="error">{registerError ?? localError}</AlertBanner>
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
                  <HiIdentification className="h-4 w-4 opacity-70" aria-hidden />
                  Matricula
                </span>
              }
            >
              <input
                type="text"
                autoComplete="off"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </FormField>
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <HiLockClosed className="h-4 w-4 opacity-70" aria-hidden />
                  Contrasena
                </span>
              }
            >
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
            </FormField>
            <FormField
              label={
                <span className="flex items-center gap-1.5">
                  <HiLockClosed className="h-4 w-4 opacity-70" aria-hidden />
                  Confirmar contrasena
                </span>
              }
            >
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
            </FormField>
            <div className="card-actions mt-2 justify-end gap-2">
              <LoadingButton
                type="submit"
                className="btn btn-primary gap-1"
                loading={submitting}
                loadingLabel="Registrando…"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                Activar cuenta
              </LoadingButton>
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
    </AuthSplitLayout>
  )
}
