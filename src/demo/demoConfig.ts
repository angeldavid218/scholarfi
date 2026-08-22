import { api } from '../api/client'

export type DemoLoginAccount = {
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | string
  email: string
  label: string
}

export type DemoConfig =
  | { enabled: false }
  | {
      enabled: true
      classroomMock: boolean
      password: string
      accounts: DemoLoginAccount[]
    }

let cached: Promise<DemoConfig> | null = null

export function loadDemoConfig(): Promise<DemoConfig> {
  if (!cached) {
    cached = api.get<DemoConfig>('/public/demo-config').catch(() => ({ enabled: false }))
  }
  return cached
}
