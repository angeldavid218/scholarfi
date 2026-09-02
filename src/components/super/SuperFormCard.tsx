import { type FormEvent, type ReactNode } from 'react'
import { FormField } from '../ui/FormField'
import { SectionCard } from '../ui/executive'

interface SuperFormCardProps {
  title: string
  subtitle: string
  titleIcon: ReactNode
  onSubmit: (e: FormEvent) => void
  submitLabel: string
  submitClassName?: string
  children: ReactNode
}

export const SuperFormCard = ({
  title,
  subtitle,
  titleIcon,
  onSubmit,
  submitLabel,
  submitClassName = 'btn btn-primary w-fit',
  children,
}: SuperFormCardProps) => {
  return (
    <SectionCard title={title} subtitle={subtitle} titleIcon={titleIcon}>
      <form className="mt-2 grid gap-4" onSubmit={onSubmit}>
        {children}
        <button type="submit" className={submitClassName}>
          {submitLabel}
        </button>
      </form>
    </SectionCard>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  minLength?: number
  min?: number
}

export const SuperTextField = ({
  label,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
  min,
}: TextFieldProps) => {
  return (
    <FormField label={label}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        min={min}
        className="input input-bordered w-full"
      />
    </FormField>
  )
}
