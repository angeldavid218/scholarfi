import { useContext } from 'react'
import { ScholarfiRoleContext } from '../context/scholarfiRoleContext.ts'

export function useScholarfiRole() {
  const ctx = useContext(ScholarfiRoleContext)
  if (!ctx) {
    throw new Error('useScholarfiRole must be used within RoleProvider')
  }
  return ctx
}

export type { ScholarfiRole } from '../context/scholarfiRoleContext.ts'
