import { api } from '../api/client'

export type DemoConfig =
  | { enabled: false }
  | {
      enabled: true
      classroomMock: boolean
    }

let cached: Promise<DemoConfig> | null = null

export function loadDemoConfig(): Promise<DemoConfig> {
  if (!cached) {
    cached = api.get<DemoConfig>('/public/demo-config').catch(() => ({ enabled: false }))
  }
  return cached
}
