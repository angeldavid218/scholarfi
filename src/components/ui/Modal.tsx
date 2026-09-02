import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

const MODAL_WIDTHS = {
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  full: 'min(96vw, 72rem)',
} as const

export type ModalSize = keyof typeof MODAL_WIDTHS

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Beats DaisyUI `.modal-box` default max-width (32rem). */
  size?: ModalSize
  /** Extra classes on `modal-box` (padding, etc.). Avoid `max-w-*` — use `size` instead. */
  boxClassName?: string
  /** Optional class on the title heading */
  titleClassName?: string
  /** Blocks Escape, backdrop, and ✕ while true; `open={false}` still closes programmatically. */
  closeDisabled?: boolean
}

/**
 * DaisyUI modal backed by `<dialog>` — backdrop click, ESC, and ✕ close the dialog.
 * Parent should clear related state in `onClose`.
 */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  size = 'lg',
  boxClassName = '',
  titleClassName = 'text-lg font-bold',
  closeDisabled = false,
}: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null)
  const closingFromProp = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      closingFromProp.current = true
      el.close()
      closingFromProp.current = false
    }
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleCancel = (event: Event) => {
      if (closeDisabled) event.preventDefault()
    }

    const handleClose = () => {
      if (closingFromProp.current) return
      if (closeDisabled) {
        el.showModal()
        return
      }
      onClose()
    }

    el.addEventListener('cancel', handleCancel)
    el.addEventListener('close', handleClose)
    return () => {
      el.removeEventListener('cancel', handleCancel)
      el.removeEventListener('close', handleClose)
    }
  }, [closeDisabled, onClose])

  const boxStyle: CSSProperties = {
    maxWidth: MODAL_WIDTHS[size],
    width: 'calc(11/12 * 100%)',
  }

  return (
    <dialog ref={ref} className="modal">
      <div className={`modal-box relative ${boxClassName}`.trim()} style={boxStyle}>
        {/* Title + children before the close control so the first focusable inside the dialog is usually in `children` (e.g. textarea), not the ✕ button. */}
        <h3 className={`pe-10 ${titleClassName}`.trim()}>{title}</h3>
        <div className="mt-3">{children}</div>
        <form method="dialog" className="absolute end-2 top-2 z-10">
          <button type="submit" className="btn btn-sm btn-circle btn-ghost" aria-label="Cerrar">
            ✕
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" className="cursor-default bg-transparent" aria-label="Cerrar dialogo">
          <span className="sr-only">Cerrar</span>
        </button>
      </form>
    </dialog>
  )
}
