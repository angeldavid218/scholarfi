import { useEffect, useRef, type ReactNode } from 'react'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Applied to `modal-box` (width, etc.) */
  boxClassName?: string
  /** Optional class on the title heading */
  titleClassName?: string
}

/**
 * DaisyUI modal backed by `<dialog>` — backdrop click, ESC, and ✕ close the dialog.
 * Parent should clear related state in `onClose`.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  boxClassName = '',
  titleClassName = 'text-lg font-bold',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open])

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className={`modal-box relative max-w-lg ${boxClassName}`.trim()}>
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
