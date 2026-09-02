import { type FormEvent } from 'react'
import { HiUserGroup, HiUserPlus } from 'react-icons/hi2'
import { FormField } from '../ui/FormField'
import { SectionCard } from '../ui/executive'

type InstitutionRole = 'teacher' | 'student' | 'school_admin'

interface AdminCreateUserFormProps {
  fullName: string
  email: string
  password: string
  role: InstitutionRole
  onFullNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRoleChange: (value: InstitutionRole) => void
  onSubmit: (e: FormEvent) => void
}

export const AdminCreateUserForm = ({
  fullName,
  email,
  password,
  role,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
}: AdminCreateUserFormProps) => {
  return (
    <SectionCard
      title="Alta de usuario"
      subtitle="Incorpora nuevos perfiles operativos dentro de tu institucion."
      titleIcon={<HiUserPlus aria-hidden />}
    >
      <form className="mt-2 grid gap-4" onSubmit={onSubmit}>
        <FormField label="Nombre">
          <input
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            required
            minLength={2}
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField label="Correo">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField label="Contrasena">
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            minLength={8}
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField label="Rol">
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as InstitutionRole)}
            className="select select-bordered w-full"
          >
            <option value="student">Estudiante</option>
            <option value="teacher">Docente</option>
            <option value="school_admin">Admin escolar</option>
          </select>
        </FormField>
        <button type="submit" className="btn btn-primary w-fit">
          Crear
        </button>
      </form>
    </SectionCard>
  )
}

interface AdminAssignRoleFormProps {
  userId: string
  role: InstitutionRole
  onUserIdChange: (value: string) => void
  onRoleChange: (value: InstitutionRole) => void
  onSubmit: (e: FormEvent) => void
}

export const AdminAssignRoleForm = ({
  userId,
  role,
  onUserIdChange,
  onRoleChange,
  onSubmit,
}: AdminAssignRoleFormProps) => {
  return (
    <SectionCard
      title="Reasignar rol"
      subtitle="Ajusta la responsabilidad operativa manteniendo control institucional."
      titleIcon={<HiUserGroup aria-hidden />}
    >
      <p className="text-sm text-base-content/70">Reemplaza los roles del usuario.</p>
      <form className="mt-2 grid max-w-xl gap-4" onSubmit={onSubmit}>
        <FormField label="ID usuario">
          <input
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            required
            className="input input-bordered w-full"
          />
        </FormField>
        <FormField label="Rol">
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as InstitutionRole)}
            className="select select-bordered w-full"
          >
            <option value="student">Estudiante</option>
            <option value="teacher">Docente</option>
            <option value="school_admin">Admin escolar</option>
          </select>
        </FormField>
        <button type="submit" className="btn btn-outline btn-primary w-fit">
          Guardar
        </button>
      </form>
    </SectionCard>
  )
}
