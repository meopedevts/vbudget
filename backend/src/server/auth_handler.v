module server

import json
import veb
import veb.auth
import src.db

// ── Input structs ─────────────────────────────────────────────────────────────

struct RegisterInput {
	name     string
	password string
}

struct LoginInput {
	name     string
	password string
}

// ── Response structs ──────────────────────────────────────────────────────────

struct UserResponse {
	id   int
	name string
}

// ── Middleware helper ─────────────────────────────────────────────────────────

// get_auth_user reads the "token" cookie, validates it and returns the
// authenticated user — or `none` if the request is unauthenticated.
// Call this at the top of every protected handler:
//
//   app.get_auth_user(mut ctx) or { return ctx.unauthorized() }
pub fn (mut app App) get_auth_user(mut ctx Context) ?db.User {
	token_val := ctx.get_cookie('token') or { return none }
	token := app.auth.find_token(token_val) or { return none }
	return app.db.get_user(token.user_id)
}

// unauthorized is a helper that sends a 401 JSON response.
pub fn (mut ctx Context) unauthorized() veb.Result {
	ctx.res.set_status(.unauthorized)
	return ctx.send_response_to_client('application/json', '{"message":"unauthorized"}')
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

@['/api/auth/register'; post]
pub fn (mut app App) register(mut ctx Context) veb.Result {
	input := json.decode(RegisterInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.name == '' {
		return ctx.request_error('name is required')
	}
	if input.password == '' {
		return ctx.request_error('password is required')
	}
	if app.db.user_name_taken(input.name) {
		return ctx.request_error('name already taken')
	}

	salt := auth.generate_salt()
	password_hash := auth.hash_password_with_salt(input.password, salt)

	user := app.db.create_user(input.name, password_hash, salt) or {
		return ctx.server_error(err.msg())
	}

	token := app.auth.add_token(user.id) or {
		return ctx.server_error(err.msg())
	}
	ctx.set_cookie(
		name: 'token'
		value: token
		path: '/'
		http_only: true
		same_site: .same_site_lax_mode
	)

	return ctx.json(UserResponse{ id: user.id, name: user.name })
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

@['/api/auth/login'; post]
pub fn (mut app App) login(mut ctx Context) veb.Result {
	input := json.decode(LoginInput, ctx.req.data) or {
		return ctx.request_error('invalid JSON body')
	}
	if input.name == '' || input.password == '' {
		return ctx.unauthorized()
	}

	user := app.db.find_user_by_name(input.name) or {
		return ctx.unauthorized()
	}

	if !auth.compare_password_with_hash(input.password, user.salt, user.password_hash) {
		return ctx.unauthorized()
	}

	token := app.auth.add_token(user.id) or {
		return ctx.server_error(err.msg())
	}
	ctx.set_cookie(
		name: 'token'
		value: token
		path: '/'
		http_only: true
		same_site: .same_site_lax_mode
	)

	return ctx.json(UserResponse{ id: user.id, name: user.name })
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

@['/api/auth/logout'; post]
pub fn (mut app App) logout(mut ctx Context) veb.Result {
	token_val := ctx.get_cookie('token') or {
		return ctx.no_content()
	}

	if token := app.auth.find_token(token_val) {
		app.auth.delete_tokens(token.user_id) or {}
	}

	// Clear the cookie by setting max_age to -1
	ctx.set_cookie(
		name: 'token'
		value: ''
		path: '/'
		max_age: -1
		http_only: true
		same_site: .same_site_lax_mode
	)

	return ctx.no_content()
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

@['/api/auth/me'; get]
pub fn (mut app App) me(mut ctx Context) veb.Result {
	user := app.get_auth_user(mut ctx) or {
		return ctx.unauthorized()
	}
	return ctx.json(UserResponse{ id: user.id, name: user.name })
}
