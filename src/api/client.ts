import { getApiErrorEsMessage } from '../i18n/es'

/** Full API base including `/api/v1`, or leave unset to use Vite proxy + same-origin `/api/v1`. */
const configured = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const baseUrl = configured && configured.length > 0 ? configured : '/api/v1'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function unwrapEnvelope<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    const layer = (body as { data: unknown }).data
    if (layer && typeof layer === 'object' && layer !== null && 'data' in layer) {
      return (layer as { data: T }).data
    }
    return layer as T
  }
  return body as T
}

export function getApiErrorMessage(body: unknown): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error?: { message?: string; code?: string } }).error
    const mapped = getApiErrorEsMessage(err?.code)
    if (mapped) return mapped
    if (err?.message) return err.message
    if (err?.code) return err.code
  }
  return 'No se pudo completar la solicitud.'
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: {
    token?: string | null
    body?: BodyInit | null
    headers?: HeadersInit
  } = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined && options.body !== null && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  }
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const res = await fetch(url, { method, headers, body: options.body ?? null })
  const parsed = await parseJsonResponse(res)

  if (!res.ok) {
    throw new ApiError(res.status, parsed)
  }

  return unwrapEnvelope<T>(parsed)
}

async function apiRequestRaw<T>(
  method: string,
  path: string,
  options: {
    token?: string | null
    body?: BodyInit | null
    headers?: HeadersInit
  } = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined && options.body !== null && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  }
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  const res = await fetch(url, { method, headers, body: options.body ?? null })
  const parsed = await parseJsonResponse(res)

  if (!res.ok) {
    throw new ApiError(res.status, parsed)
  }

  return parsed as T
}

export const api = {
  get: <T>(path: string, opts?: { token?: string | null }) =>
    apiRequest<T>('GET', path, { token: opts?.token }),

  /** Returns parsed JSON without unwrapping `{ data }` — for responses with extra top-level fields. */
  getRaw: <T>(path: string, opts?: { token?: string | null }) =>
    apiRequestRaw<T>('GET', path, { token: opts?.token }),

  post: <T>(path: string, opts?: { json?: unknown; token?: string | null }) =>
    apiRequest<T>('POST', path, {
      token: opts?.token,
      body: opts?.json !== undefined ? JSON.stringify(opts.json) : undefined,
    }),

  patch: <T>(path: string, opts?: { json?: unknown; token?: string | null }) =>
    apiRequest<T>('PATCH', path, {
      token: opts?.token,
      body: opts?.json !== undefined ? JSON.stringify(opts.json) : undefined,
    }),
}
