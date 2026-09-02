import { useState, type FormEvent } from 'react'
import { ApiError, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { AlertBanner } from '../ui/AlertBanner'
import { FormField } from '../ui/FormField'
import { LoadingButton } from '../ui/LoadingButton'
import { Modal } from '../ui/Modal'

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

export const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setPasswordConfirmation('')
    setError(null)
    setSuccess(null)
  }

  const handleClose = () => {
    if (submitting) return
    resetFields()
    onClose()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (newPassword !== passwordConfirmation) {
      setError('La confirmacion no coincide')
      return
    }
    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword, passwordConfirmation)
      setSuccess('Contrasena actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setError(err instanceof ApiError ? getApiErrorMessage(err.body) : 'No se pudo cambiar la contrasena')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cambiar contraseña">
      <p className="text-sm text-base-content/70">
        Usa tu contraseña actual y elige una nueva de al menos 8 caracteres.
      </p>
      {error ? <AlertBanner tone="error" className="mt-4">{error}</AlertBanner> : null}
      {success ? <AlertBanner tone="success" className="mt-4">{success}</AlertBanner> : null}
      <form className="mt-4 flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
        <FormField label="Contraseña actual">
          <input
            type="password"
            autoComplete="current-password"
            className="input input-bordered w-full"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Nueva contraseña">
          <input
            type="password"
            autoComplete="new-password"
            className="input input-bordered w-full"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            maxLength={32}
            required
          />
        </FormField>
        <FormField label="Confirmar contraseña">
          <input
            type="password"
            autoComplete="new-password"
            className="input input-bordered w-full"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            minLength={8}
            maxLength={32}
            required
          />
        </FormField>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cerrar
          </button>
          <LoadingButton type="submit" className="btn btn-primary" loading={submitting} loadingLabel="Guardando…">
            Guardar
          </LoadingButton>
        </div>
      </form>
    </Modal>
  )
}
