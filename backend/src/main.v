module main

import src.server

fn main() {
	mut s := server.new()
	s.run()
}
