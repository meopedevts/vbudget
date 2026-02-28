module server

import veb
import src.db

pub struct Context {
	veb.Context
}

pub struct App {
pub mut:
	db &db.Database = unsafe { nil }
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
	return &Server{
		app: app
	}
}

pub fn (mut s Server) run() {
	veb.run[App, Context](mut s.app, 8181)
}
