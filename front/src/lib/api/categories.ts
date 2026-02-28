import { api } from './client'
import type { Category, CategoryPayload } from './types'

const BASE = '/api/categories'

export const categoriesService = {
  list(): Promise<Category[]> {
    return api.get<Category[]>(BASE)
  },

  get(id: number): Promise<Category> {
    return api.get<Category>(`${BASE}/${id}`)
  },

  create(payload: CategoryPayload): Promise<Category> {
    return api.post<Category>(BASE, payload)
  },

  update(id: number, payload: CategoryPayload): Promise<Category> {
    return api.put<Category>(`${BASE}/${id}`, payload)
  },

  delete(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`)
  },
}

