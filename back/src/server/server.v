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

pub fn (mut s Server) run() {
	veb.run[App, Context](mut s.app, 8181)
}
