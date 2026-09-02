import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { FormField } from '../ui/FormField'
import { Modal } from '../ui/Modal'

interface RejectReasonModalProps {
  open: boolean
  title: ReactNode
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  reasonLabel?: string
  placeholder?: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

export const RejectReasonModal = ({
  open,
  title,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
  reasonLabel = 'Razon',
  placeholder,
  required = true,
  minLength = 2,
  maxLength,
}: RejectReasonModalProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormField label={reasonLabel}>
          <textarea
            ref={inputRef}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            required={required}
            minLength={required ? minLength : undefined}
            maxLength={maxLength}
            rows={4}
            className="textarea textarea-bordered w-full"
            placeholder={placeholder}
          />
        </FormField>
        <div className="modal-action mt-0 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-error gap-1">
            <HiXMark className="h-4 w-4" aria-hidden />
            Confirmar rechazo
          </button>
        </div>
      </form>
    </Modal>
  )
}
