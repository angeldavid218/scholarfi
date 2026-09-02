import type { IconType } from 'react-icons'
import {
  HiAcademicCap,
  HiBanknotes,
  HiBuildingOffice2,
  HiCheckBadge,
  HiClipboardDocumentCheck,
  HiClipboardDocumentList,
  HiDocumentText,
  HiGift,
  HiGlobeAlt,
  HiLink,
  HiTrophy,
  HiUserGroup,
} from 'react-icons/hi2'

export interface NavItem {
  to: string
  label: string
  end?: boolean
  Icon: IconType
}

export const buildPanelNavItems = (roles: string[], classroomDemoNav: boolean): NavItem[] => {
  return [
    ...(roles.includes('student')
      ? ([
          { to: '/student', end: true, label: 'Resumen', Icon: HiAcademicCap },
          { to: '/student/ranking', label: 'Ranking', Icon: HiTrophy },
        ] as NavItem[])
      : []),
    ...(roles.includes('teacher')
      ? ([
          { to: '/teacher', end: true, label: 'Docente', Icon: HiClipboardDocumentList },
          { to: '/teacher/clases', label: 'Mis clases', Icon: HiUserGroup },
          {
            to: '/teacher/integraciones',
            label: classroomDemoNav ? 'Classroom (demo)' : 'Google Classroom',
            Icon: HiLink,
          },
        ] as NavItem[])
      : []),
    ...(roles.includes('school_admin')
      ? ([
          { to: '/admin', end: true, label: 'Admin escolar', Icon: HiBuildingOffice2 },
          { to: '/admin/presupuesto-docentes', label: 'Presupuesto docentes', Icon: HiBanknotes },
          { to: '/admin/recompensas-internas', label: 'Recompensas internas', Icon: HiGift },
          { to: '/admin/cola-aprobacion', label: 'Cola de aprobacion', Icon: HiClipboardDocumentCheck },
          { to: '/admin/diploma', label: 'Reconocimiento académico', Icon: HiAcademicCap },
          { to: '/admin/attestaciones', label: 'Attestaciones SAS', Icon: HiCheckBadge },
        ] as NavItem[])
      : []),
    ...(roles.includes('ngo_admin')
      ? ([{ to: '/ngo', end: true, label: 'Dashboard ONG', Icon: HiGlobeAlt }] as NavItem[])
      : []),
    ...(roles.includes('super_admin')
      ? ([{ to: '/super', label: 'Super admin', Icon: HiGlobeAlt }] as NavItem[])
      : []),
  ]
}

export const buildBitacoraNavItems = (roles: string[]): NavItem[] => {
  if (!roles.includes('school_admin')) return []
  return [
    {
      to: '/admin/bitacora-aprobacion',
      label: 'Bitácora de aprobación',
      Icon: HiDocumentText,
    },
  ]
}
