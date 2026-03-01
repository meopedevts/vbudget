import { api } from './client'
import type { Integration, IntegrationPayload } from './types'

const BASE = '/api/integrations'

export const integrationsService = {
  list(): Promise<Integration[]> {
    return api.get<Integration[]>(BASE)
  },

  get(id: number): Promise<Integration> {
    return api.get<Integration>(`${BASE}/${id}`)
  },

  create(payload: IntegrationPayload): Promise<Integration> {
    return api.post<Integration>(BASE, payload)
  },

  update(id: number, payload: Partial<IntegrationPayload>): Promise<Integration> {
    return api.put<Integration>(`${BASE}/${id}`, payload)
  },

  delete(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`)
  },
}

