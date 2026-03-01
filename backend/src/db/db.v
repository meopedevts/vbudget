module db

import db.sqlite

pub struct Database {
pub mut:
	conn sqlite.DB
}

// open opens (or creates) the SQLite database file and runs the migrations.
pub fn open(path string) !&Database {
	conn := sqlite.connect(path)!
	mut database := &Database{
		conn: conn
	}
	database.migrate()!
	return database
}

// close closes the database connection.
pub fn (mut d Database) close() ! {
	d.conn.close()!
}

// migrate creates the tables if they don't exist yet, and adds new columns to
// existing tables (ALTER TABLE errors are silently ignored when the column
// already exists — SQLite does not support IF NOT EXISTS on ADD COLUMN).
fn (mut d Database) migrate() ! {
	sql d.conn {
		create table Category
		create table Transaction
		create table User
	}!

	// Category — new columns (idempotent: error ignored if column exists)
	d.conn.exec('ALTER TABLE categories ADD COLUMN kind    INTEGER NOT NULL DEFAULT 0') or {}
	d.conn.exec('ALTER TABLE categories ADD COLUMN color   TEXT    NOT NULL DEFAULT ""') or {}

	// Transaction — new columns
	d.conn.exec('ALTER TABLE transactions ADD COLUMN status     INTEGER NOT NULL DEFAULT 0') or {}
	d.conn.exec('ALTER TABLE transactions ADD COLUMN due_date   TEXT    NOT NULL DEFAULT ""') or {}
	d.conn.exec('ALTER TABLE transactions ADD COLUMN paid_date  TEXT    NOT NULL DEFAULT ""') or {}
}
