const KEY = 'scholarfi_activity'
const MAX = 50

export type ActivityEntry = {
  id: string
  at: string
  kind: 'task' | 'redeem' | 'transfer' | 'info'
  message: string
}

function readRaw(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is ActivityEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as ActivityEntry).id === 'string' &&
        typeof (e as ActivityEntry).message === 'string',
    )
  } catch {
    return []
  }
}

export function loadActivity(): ActivityEntry[] {
  return readRaw()
}

export function appendActivity(entry: Omit<ActivityEntry, 'id' | 'at'>): ActivityEntry[] {
  const next: ActivityEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
  }
  const list = [next, ...readRaw()].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  return list
}
