module db

import time

// --- Transaction CRUD ---

pub fn (mut d Database) list_transactions() ![]Transaction {
	return sql d.conn {
		select from Transaction order by due_date
	}!
}

pub fn (mut d Database) get_transaction(id int) !Transaction {
	results := sql d.conn {
		select from Transaction where id == id limit 1
	}!
	if results.len == 0 {
		return error('transaction not found')
	}
	return results[0]
}

pub fn (mut d Database) create_transaction(description string, amount f64, kind TransactionKind, status TransactionStatus, category_id int, due_date string, paid_date string) !Transaction {
	row := Transaction{
		description: description
		amount:      amount
		kind:        kind
		status:      status
		category_id: category_id
		due_date:    due_date
		paid_date:   paid_date
		created_at:  time.now()
	}
	sql d.conn {
		insert row into Transaction
	}!
	id := d.conn.last_id()
	return d.get_transaction(id)
}

pub fn (mut d Database) update_transaction(id int, description string, amount f64, kind TransactionKind, status TransactionStatus, category_id int, due_date string, paid_date string) !Transaction {
	sql d.conn {
		update Transaction set description = description, amount = amount, kind = kind,
			status = status, category_id = category_id, due_date = due_date,
			paid_date = paid_date where id == id
	}!
	return d.get_transaction(id)
}

pub fn (mut d Database) delete_transaction(id int) ! {
	sql d.conn {
		delete from Transaction where id == id
	}!
}
