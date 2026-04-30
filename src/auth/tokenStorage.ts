const KEY = 'scholarfi_access_token'

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(KEY)
}
