import { api } from './client'
import type { NotificationRule, NotificationRulePayload } from './types'

const BASE = '/api/notifications'

export const notificationsService = {
  list(): Promise<NotificationRule[]> {
    return api.get<NotificationRule[]>(BASE)
  },

  get(id: number): Promise<NotificationRule> {
    return api.get<NotificationRule>(`${BASE}/${id}`)
  },

  create(payload: NotificationRulePayload): Promise<NotificationRule> {
    return api.post<NotificationRule>(BASE, payload)
  },

  update(id: number, payload: Partial<NotificationRulePayload>): Promise<NotificationRule> {
    return api.put<NotificationRule>(`${BASE}/${id}`, payload)
  },

  delete(id: number): Promise<void> {
    return api.delete(`${BASE}/${id}`)
  },
}

