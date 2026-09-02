import { type FormEvent } from 'react'
import { HiPlusCircle, HiPower, HiUserPlus } from 'react-icons/hi2'
import { FormField } from '../ui/FormField'
import { SectionCard } from '../ui/executive'
import { formatId } from '../../i18n/format'
import { SuperFormCard, SuperTextField } from './SuperFormCard'
import type { InstitutionCreditPool } from './types'

interface SuperCreateInstitutionFormProps {
  name: string
  code: string
  onNameChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export const SuperCreateInstitutionForm = ({
  name,
  code,
  onNameChange,
  onCodeChange,
  onSubmit,
}: SuperCreateInstitutionFormProps) => {
  return (
    <SuperFormCard
      title="Crear institucion (draft)"
      subtitle="Da de alta nuevas sedes con codigo unico para control de despliegue."
      titleIcon={<HiPlusCircle aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Crear"
    >
      <SuperTextField label="Nombre" value={name} onChange={onNameChange} required minLength={2} />
      <SuperTextField label="Codigo unico" value={code} onChange={onCodeChange} required minLength={2} />
    </SuperFormCard>
  )
}

interface SuperCreateNgoFormProps {
  name: string
  code: string
  onNameChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export const SuperCreateNgoForm = ({
  name,
  code,
  onNameChange,
  onCodeChange,
  onSubmit,
}: SuperCreateNgoFormProps) => {
  return (
    <SuperFormCard
      title="Crear ONG"
      subtitle="Da de alta una nueva organización no gubernamental."
      titleIcon={<HiPlusCircle aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Crear"
    >
      <SuperTextField label="Nombre" value={name} onChange={onNameChange} required minLength={2} />
      <SuperTextField label="Codigo unico" value={code} onChange={onCodeChange} required minLength={2} />
    </SuperFormCard>
  )
}

interface SuperAllocateCreditsFormProps {
  institutionId: string
  amount: string
  notes: string
  poolPreview: InstitutionCreditPool | null
  onInstitutionIdChange: (value: string) => void
  onAmountChange: (value: string) => void
  onNotesChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onPreview: () => void
}

export const SuperAllocateCreditsForm = ({
  institutionId,
  amount,
  notes,
  poolPreview,
  onInstitutionIdChange,
  onAmountChange,
  onNotesChange,
  onSubmit,
  onPreview,
}: SuperAllocateCreditsFormProps) => {
  return (
    <SectionCard
      title="Asignar presupuesto de créditos"
      subtitle="Provisiona el pool institucional para que los admins distribuyan recompensas."
      titleIcon={<HiPlusCircle aria-hidden />}
    >
      <form className="mt-2 grid gap-4" onSubmit={onSubmit}>
        <SuperTextField label="ID institución" value={institutionId} onChange={onInstitutionIdChange} required />
        <SuperTextField
          label="Créditos a asignar"
          value={amount}
          onChange={onAmountChange}
          type="number"
          required
          min={1}
        />
        <SuperTextField label="Notas (opcional)" value={notes} onChange={onNotesChange} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">
            Asignar créditos
          </button>
          <button type="button" className="btn btn-outline" onClick={onPreview}>
            Ver pool
          </button>
        </div>
      </form>
      {poolPreview ? (
        <p className="mt-4 text-sm text-base-content/75">
          Pool institución {formatId(poolPreview.institutionId)}:{' '}
          <span className="font-medium text-secondary">{poolPreview.remainingCredits} disponibles</span> de{' '}
          {poolPreview.allocatedCredits} asignados ({poolPreview.utilizedCredits} utilizados).
        </p>
      ) : null}
    </SectionCard>
  )
}

interface SuperPatchStatusFormProps {
  institutionId: string
  status: 'active' | 'inactive'
  onInstitutionIdChange: (value: string) => void
  onStatusChange: (value: 'active' | 'inactive') => void
  onSubmit: (e: FormEvent) => void
}

export const SuperPatchStatusForm = ({
  institutionId,
  status,
  onInstitutionIdChange,
  onStatusChange,
  onSubmit,
}: SuperPatchStatusFormProps) => {
  return (
    <SuperFormCard
      title="Activar / desactivar institucion"
      subtitle="Controla disponibilidad operativa y riesgo de cambios."
      titleIcon={<HiPower aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Guardar"
      submitClassName="btn btn-outline btn-primary w-fit"
    >
      <SuperTextField label="ID institucion" value={institutionId} onChange={onInstitutionIdChange} required />
      <FormField label="Estado">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as 'active' | 'inactive')}
          className="select select-bordered w-full"
        >
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </select>
      </FormField>
    </SuperFormCard>
  )
}

interface SuperAssignNgoAdminFormProps {
  ngoId: string
  userId: string
  onNgoIdChange: (value: string) => void
  onUserIdChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export const SuperAssignNgoAdminForm = ({
  ngoId,
  userId,
  onNgoIdChange,
  onUserIdChange,
  onSubmit,
}: SuperAssignNgoAdminFormProps) => {
  return (
    <SuperFormCard
      title="Asociar Administrador de ONG"
      subtitle="Asocia un Administrador de ONG existente ingresando su ID de usuario."
      titleIcon={<HiUserPlus aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Asociar Admin"
      submitClassName="btn btn-outline btn-primary w-fit"
    >
      <SuperTextField label="ID de ONG" value={ngoId} onChange={onNgoIdChange} required />
      <SuperTextField label="ID de Usuario" value={userId} onChange={onUserIdChange} required />
    </SuperFormCard>
  )
}

interface SuperBootstrapSchoolAdminFormProps {
  institutionId: string
  fullName: string
  email: string
  password: string
  onInstitutionIdChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export const SuperBootstrapSchoolAdminForm = ({
  institutionId,
  fullName,
  email,
  password,
  onInstitutionIdChange,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: SuperBootstrapSchoolAdminFormProps) => {
  return (
    <SuperFormCard
      title="Bootstrap primer admin escolar"
      subtitle="Asigna custodio inicial para habilitar operacion local segura."
      titleIcon={<HiUserPlus aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Crear admin"
    >
      <SuperTextField label="ID institucion" value={institutionId} onChange={onInstitutionIdChange} required />
      <SuperTextField label="Nombre completo" value={fullName} onChange={onFullNameChange} required />
      <SuperTextField label="Correo" value={email} onChange={onEmailChange} type="email" required />
      <SuperTextField
        label="Contrasena"
        value={password}
        onChange={onPasswordChange}
        type="password"
        required
        minLength={8}
      />
    </SuperFormCard>
  )
}

interface SuperBootstrapNgoAdminFormProps {
  ngoId: string
  fullName: string
  email: string
  password: string
  onNgoIdChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export const SuperBootstrapNgoAdminForm = ({
  ngoId,
  fullName,
  email,
  password,
  onNgoIdChange,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: SuperBootstrapNgoAdminFormProps) => {
  return (
    <SuperFormCard
      title="Bootstrap Administrador de ONG"
      subtitle="Crea y bootstrap un nuevo administrador de la ONG."
      titleIcon={<HiUserPlus aria-hidden />}
      onSubmit={onSubmit}
      submitLabel="Crear admin"
    >
      <SuperTextField label="ID de ONG" value={ngoId} onChange={onNgoIdChange} required />
      <SuperTextField label="Nombre completo" value={fullName} onChange={onFullNameChange} required />
      <SuperTextField label="Correo" value={email} onChange={onEmailChange} type="email" required />
      <SuperTextField
        label="Contrasena"
        value={password}
        onChange={onPasswordChange}
        type="password"
        required
        minLength={8}
      />
    </SuperFormCard>
  )
}
