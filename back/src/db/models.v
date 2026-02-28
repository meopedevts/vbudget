module db

import time

pub enum TransactionKind {
	income
	expense
}

pub enum TransactionStatus {
	pending
	paid
}

@[table: 'categories']
pub struct Category {
pub:
	id    int             @[primary; sql: serial]
	name  string
	kind  TransactionKind // income | expense — used to filter categories by transaction type
	color string
}

@[table: 'transactions']
pub struct Transaction {
pub:
	id          int               @[primary; sql: serial]
	description string
	amount      f64
	kind        TransactionKind
	status      TransactionStatus
	category_id int
	due_date    string            // ISO date string e.g. "2026-03-01"
	paid_date   string            // ISO date string, empty = not yet paid
	created_at  time.Time
}
