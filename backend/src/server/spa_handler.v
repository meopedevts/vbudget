module server

import veb

// Embedded at compile time — run `make front` before `make back`
const index_html = $embed_file('../embedded/index.html', .zlib)
const index_js = $embed_file('../embedded/assets/index.js', .zlib)
const index_css = $embed_file('../embedded/assets/index.css', .zlib)

// Redirect root to the app
@['/'; get]
pub fn (_ &App) root_redirect(mut ctx Context) veb.Result {
	return ctx.redirect('/app')
}

@['/app'; get]
pub fn (_ &App) index(mut ctx Context) veb.Result {
	return ctx.html(index_html.to_string())
}

@['/assets/index.js'; get]
pub fn (_ &App) serve_js(mut ctx Context) veb.Result {
	return ctx.send_response_to_client('application/javascript', index_js.to_string())
}

@['/assets/index.css'; get]
pub fn (_ &App) serve_css(mut ctx Context) veb.Result {
	return ctx.send_response_to_client('text/css', index_css.to_string())
}

// SPA fallback: any /app/* client-side route returns index.html so Solid Router handles it.
@['/app/:path...'; get]
pub fn (_ &App) spa_fallback(mut ctx Context, path string) veb.Result {
	return ctx.html(index_html.to_string())
}
