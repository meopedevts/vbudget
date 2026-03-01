module db

// --- User CRUD ---

pub fn (mut d Database) find_user_by_name(name string) ?User {
	users := sql d.conn {
		select from User where name == name limit 1
	} or { return none }
	if users.len == 0 {
		return none
	}
	return users[0]
}

pub fn (mut d Database) get_user(id int) ?User {
	users := sql d.conn {
		select from User where id == id limit 1
	} or { return none }
	if users.len == 0 {
		return none
	}
	return users[0]
}

pub fn (mut d Database) create_user(name string, password_hash string, salt string) !User {
	row := User{
		name:          name
		password_hash: password_hash
		salt:          salt
	}
	sql d.conn {
		insert row into User
	}!
	id := d.conn.last_id()
	return d.get_user(id) or { error('user not found after insert') }
}

pub fn (mut d Database) user_name_taken(name string) bool {
	users := sql d.conn {
		select from User where name == name limit 1
	} or { return false }
	return users.len > 0
}

