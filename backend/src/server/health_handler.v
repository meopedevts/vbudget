module server

import veb

@['/api/health'; get]
pub fn (_ &App) health(mut ctx Context) veb.Result {
	return ctx.json('ok')
}

