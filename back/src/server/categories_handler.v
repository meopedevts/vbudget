module server

import json
import veb
import src.db

struct CategoryInput {
	name  string
	kind  db.TransactionKind
	color string
}

// GET /api/categories
@['/api/categories'; get]
pub fn (mut app App) list_categories(mut ctx Context) veb.Result {
	rows := app.db.list_categories() or { return ctx.server_error(err.msg()) }
	return ctx.json(rows)
}

// GET /api/categories/:id
@['/api/categories/:id'; get]
pub fn (mut app App) get_category(mut ctx Context, id int) veb.Result {
	row := app.db.get_category(id) or { return ctx.not_found() }
	return ctx.json(row)
}

// POST /api/categories
@['/api/categories'; post]
pub fn (mut app App) create_category(mut ctx Context) veb.Result {
	input := json.decode(CategoryInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.name == '' {
		return ctx.request_error('name is required')
	}
	row := app.db.create_category(input.name, input.kind, input.color) or {
		return ctx.server_error(err.msg())
	}
	return ctx.json(row)
}

// PUT /api/categories/:id
@['/api/categories/:id'; put]
pub fn (mut app App) update_category(mut ctx Context, id int) veb.Result {
	input := json.decode(CategoryInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.name == '' {
		return ctx.request_error('name is required')
	}
	row := app.db.update_category(id, input.name, input.kind, input.color) or {
		return ctx.not_found()
	}
	return ctx.json(row)
}

// DELETE /api/categories/:id
@['/api/categories/:id'; delete]
pub fn (mut app App) delete_category(mut ctx Context, id int) veb.Result {
	app.db.delete_category(id) or { return ctx.not_found() }
	return ctx.no_content()
}
