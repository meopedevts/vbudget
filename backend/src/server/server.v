module server

import veb
import veb.auth
import db.sqlite
import src.db

pub struct Context {
	veb.Context
pub mut:
	current_user db.User
}

pub struct App {
pub mut:
	db   &db.Database = unsafe { nil }
	auth auth.Auth[sqlite.DB]
}

pub struct Server {
mut:
	app &App
}

pub fn new() &Server {
	database := db.open('vbudget.db') or { panic('could not open database: ${err}') }
	mut app := &App{
		db: database
	}
	app.auth = auth.new(database.conn)
	return &Server{
		app: app
	}
}

// before_request is called before every request to set CORS headers
pub fn (mut app App) before_request(mut ctx Context) {
	// Allow credentials (cookies) from the frontend
	ctx.res.header.add_custom('Access-Control-Allow-Origin', 'http://localhost:3000') or {}
	ctx.res.header.add_custom('Access-Control-Allow-Credentials', 'true') or {}
	ctx.res.header.add_custom('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') or {}
	ctx.res.header.add_custom('Access-Control-Allow-Headers', 'Content-Type, Authorization') or {}
}

pub fn (mut s Server) run() {
	veb.run[App, Context](mut s.app, 8181)
}
