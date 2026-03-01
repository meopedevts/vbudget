module db

// --- Category CRUD ---

pub fn (mut d Database) list_categories() ![]Category {
	return sql d.conn {
		select from Category order by name
	}!
}

pub fn (mut d Database) get_category(id int) !Category {
	results := sql d.conn {
		select from Category where id == id limit 1
	}!
	if results.len == 0 {
		return error('category not found')
	}
	return results[0]
}

pub fn (mut d Database) create_category(name string, kind TransactionKind, color string) !Category {
	row := Category{
		name:  name
		kind:  kind
		color: color
	}
	sql d.conn {
		insert row into Category
	}!
	id := d.conn.last_id()
	return d.get_category(id)
}

pub fn (mut d Database) update_category(id int, name string, kind TransactionKind, color string) !Category {
	sql d.conn {
		update Category set name = name, kind = kind, color = color where id == id
	}!
	return d.get_category(id)
}

pub fn (mut d Database) delete_category(id int) ! {
	sql d.conn {
		delete from Category where id == id
	}!
}
