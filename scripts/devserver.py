#!/usr/bin/env python3
"""dev server for localhost testing — plain `python -m http.server` plus
one trick: it proxies api.mista.tech.

the api's CORS allowlist only names the real origins (https://mista.tech,
https://nirupama.mista.tech), so a page on http://localhost gets its
responses dropped by the browser and every live number goes dark. that's
the api behaving correctly — it just makes local testing impossible.

so this server:
  1. proxies  http://localhost:PORT/__api/<path>  →  https://api.mista.tech/<path>
     server-to-server, where CORS doesn't apply, and hands the json back
     from the page's own origin.
  2. rewrites "https://api.mista.tech" → "/__api" in js/data.js as it's
     served, so the repo needs no edits and nothing can get committed by
     accident. the file on disk is never touched.

    python scripts/devserver.py [port]      # default 4174

only for local testing. the real fix for a real origin is adding it to
the api's allowlist — this can't and doesn't test that CORS actually
works, only everything downstream of it.
"""

import sys
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM = "https://api.mista.tech"
PREFIX = "/__api"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4174


class DevHandler(SimpleHTTPRequestHandler):
    # code you edit: never cached. everything else: cached normally.
    SOURCE = (".html", ".css", ".js", ".json", ".xml", ".md", "/")

    def end_headers(self):
        """Stop the browser serving stale CODE, without un-caching
        the artwork.

        SimpleHTTPRequestHandler sends Last-Modified and no
        Cache-Control, so browsers fall back to HEURISTIC freshness
        and happily reuse a .js file you edited seconds ago. That
        failure is vicious because it is silent and selective: the
        HTML reloads, the stylesheet often reloads, and the one
        stale file looks like a bug in the code you just wrote.

        But blanket no-store is worse than the disease — it also
        drops every thumbnail, so each hop between / and /art.html
        re-downloads the whole gallery and the site feels broken.
        Only the files you actually edit are held uncacheable.

        Production is unaffected either way: the deploy workflow
        stamps asset URLs with the commit sha, which is the real fix
        there.
        """
        if self.path.split("?")[0].endswith(self.SOURCE):
            self.send_header("Cache-Control", "no-store, must-revalidate")
        else:
            self.send_header("Cache-Control", "max-age=600")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith(PREFIX + "/"):
            self.proxy(self.path[len(PREFIX):])
        elif self.path.split("?")[0].endswith("js/data.js"):
            self.rewritten_data_js()
        else:
            super().do_GET()

    def proxy(self, path):
        url = UPSTREAM + path
        try:
            with urllib.request.urlopen(url, timeout=10) as up:
                body = up.read()
                ctype = up.headers.get("Content-Type", "application/json")
                code = up.status
        except urllib.error.HTTPError as e:      # upstream said no — pass it through
            body, ctype, code = e.read(), "application/json", e.code
        except Exception as e:                   # unreachable — look like a dead endpoint
            body, ctype, code = str(e).encode(), "text/plain", 502
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
        sys.stderr.write("  proxied %s -> %s [%s]\n" % (self.path, url, code))

    def rewritten_data_js(self):
        try:
            src = open("js/data.js", "rb").read()
        except OSError:
            self.send_error(404)
            return
        body = src.replace(UPSTREAM.encode(), PREFIX.encode())
        self.send_response(200)
        self.send_header("Content-Type", "application/javascript")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        """nothing gets cached in dev — edit, reload, see it"""
        if "Cache-Control" not in self._headers_buffer_str():
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _headers_buffer_str(self):
        return b"".join(getattr(self, "_headers_buffer", [])).decode("latin-1")


if __name__ == "__main__":
    print("serving . on http://localhost:%d" % PORT)
    print("  %s/*  ->  %s/*   (js/data.js rewritten in flight)" % (PREFIX, UPSTREAM))
    ThreadingHTTPServer(("", PORT), partial(DevHandler, directory=".")).serve_forever()
