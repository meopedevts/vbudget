// ── Categories ────────────────────────────────────────────────────────────────

export type CategoryKind = 'income' | 'expense'

export interface Category {
  id:    number
  name:  string
  kind:  CategoryKind
  color: string
}

export interface CategoryPayload {
  name:  string
  kind:  CategoryKind
  color: string
}

// ── Transactions ──────────────────────────────────────────────────────────────

export type TransactionKind   = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'paid'   // V enum serializes lowercase

export interface Transaction {
  id:          number
  description: string
  amount:      number
  kind:        TransactionKind
  status:      TransactionStatus
  category_id: number
  due_date:    string   // ISO date string
  paid_date:   string   // ISO date string, empty string = not yet paid
  created_at:  string   // ISO timestamp
}

export interface TransactionPayload {
  description: string
  amount:      number
  kind:        TransactionKind
  status:      TransactionStatus
  category_id: number
  due_date:    string
  paid_date:   string  // empty string = not yet paid
}

// ── Integrations ──────────────────────────────────────────────────────────────

export type IntegrationProvider = 'openfinance' | 'whatsapp'

export type ConnectionStatus = 'connected' | 'disconnected' | 'error'

export interface Integration {
  id:                number
  provider:          IntegrationProvider
  connection_status: ConnectionStatus
  access_token:      string | null
  last_sync:         string | null  // ISO timestamp
}

export interface IntegrationPayload {
  provider:      IntegrationProvider
  access_token?: string
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type AlertType            = 'low_balance' | 'spending_limit'
export type NotificationChannel  = 'email' | 'whatsapp'

export interface NotificationRecipient {
  id:      number
  name:    string
  contact: string  // email or phone
}

export interface NotificationRule {
  id:         number
  alert_type: AlertType
  threshold:  number
  channels:   NotificationChannel[]
  recipients: NotificationRecipient[]
  enabled:    boolean
}

export interface NotificationRulePayload {
  alert_type: AlertType
  threshold:  number
  channels:   NotificationChannel[]
  recipients: Omit<NotificationRecipient, 'id'>[]
  enabled:    boolean
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  status:  number
  message: string
}
