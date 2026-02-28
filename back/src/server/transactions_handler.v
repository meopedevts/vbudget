module server

import json
import veb
import src.db

struct TransactionInput {
	description string
	amount      f64
	kind        db.TransactionKind
	status      db.TransactionStatus
	category_id int
	due_date    string
	paid_date   string
}

// GET /api/transactions
@['/api/transactions'; get]
pub fn (mut app App) list_transactions(mut ctx Context) veb.Result {
	rows := app.db.list_transactions() or { return ctx.server_error(err.msg()) }
	return ctx.json(rows)
}

// GET /api/transactions/:id
@['/api/transactions/:id'; get]
pub fn (mut app App) get_transaction(mut ctx Context, id int) veb.Result {
	row := app.db.get_transaction(id) or { return ctx.not_found() }
	return ctx.json(row)
}

// POST /api/transactions
@['/api/transactions'; post]
pub fn (mut app App) create_transaction(mut ctx Context) veb.Result {
	input := json.decode(TransactionInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.description == '' {
		return ctx.request_error('description is required')
	}
	if input.amount <= 0 {
		return ctx.request_error('amount must be positive')
	}
	if input.due_date == '' {
		return ctx.request_error('due_date is required')
	}
	row := app.db.create_transaction(input.description, input.amount, input.kind,
		input.status, input.category_id, input.due_date, input.paid_date) or {
		return ctx.server_error(err.msg())
	}
	return ctx.json(row)
}

// PUT /api/transactions/:id
@['/api/transactions/:id'; put]
pub fn (mut app App) update_transaction(mut ctx Context, id int) veb.Result {
	input := json.decode(TransactionInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.description == '' {
		return ctx.request_error('description is required')
	}
	if input.amount <= 0 {
		return ctx.request_error('amount must be positive')
	}
	if input.due_date == '' {
		return ctx.request_error('due_date is required')
	}
	row := app.db.update_transaction(id, input.description, input.amount, input.kind,
		input.status, input.category_id, input.due_date, input.paid_date) or {
		return ctx.not_found()
	}
	return ctx.json(row)
}

// DELETE /api/transactions/:id
@['/api/transactions/:id'; delete]
pub fn (mut app App) delete_transaction(mut ctx Context, id int) veb.Result {
	app.db.delete_transaction(id) or { return ctx.not_found() }
	return ctx.no_content()
}
