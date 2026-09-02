import type { ReactNode } from 'react'

interface FormFieldProps {
  label: ReactNode
  children: ReactNode
  hint?: ReactNode
  className?: string
}

export const FormField = ({ label, children, hint, className }: FormFieldProps) => {
  return (
    <label className={`form-control w-full ${className ?? ''}`.trim()}>
      <div className="label pt-0">
        <span className="label-text">{label}</span>
      </div>
      {children}
      {hint ? (
        <div className="label">
          <span className="label-text-alt">{hint}</span>
        </div>
      ) : null}
    </label>
  )
}
