import { api } from './client'
import type { Transaction, TransactionPayload } from './types'

const BASE = '/api/transactions'

export const transactionsService = {
  list(): Promise<Transaction[]> {
    return api.get<Transaction[]>(BASE)
  },

  get(id: number): Promise<Transaction> {
    return api.get<Transaction>(`${BASE}/${id}`)
  },

  create(payload: TransactionPayload): Promise<Transaction> {
    return api.post<Transaction>(BASE, payload)
  },

  update(id: number, payload: TransactionPayload): Promise<Transaction> {
    return api.put<Transaction>(`${BASE}/${id}`, payload)
  },

  delete(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`)
  },
}

