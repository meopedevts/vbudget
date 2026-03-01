import { api } from './client'
import type { User, LoginPayload, RegisterPayload } from './types'

const BASE = '/api/auth'

export const authService = {
  me(): Promise<User> {
    return api.get<User>(`${BASE}/me`)
  },

  login(payload: LoginPayload): Promise<User> {
    return api.post<User>(`${BASE}/login`, payload)
  },

  register(payload: RegisterPayload): Promise<User> {
    return api.post<User>(`${BASE}/register`, payload)
  },

  logout(): Promise<void> {
    return api.post<void>(`${BASE}/logout`, {})
  },
}

