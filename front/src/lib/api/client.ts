import type { ApiError } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({ message: res.statusText }))

  if (!res.ok) {
    const error: ApiError = { status: res.status, message: data?.message ?? res.statusText }
    throw error
  }

  return data as T
}

export const api = {
  get<T>(path: string) {
    return request<T>(path)
  },
  post<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  },
  put<T>(path: string, body: unknown) {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
  },
  delete(path: string) {
    return request<void>(path, { method: 'DELETE' })
  },
}

