import { createContext } from 'react'

export type ScholarfiRole = 'student' | 'teacher'

export type RoleContextValue = {
  role: ScholarfiRole | null
  setRole: (role: ScholarfiRole | null) => void
}

export const ScholarfiRoleContext = createContext<RoleContextValue | null>(null)
