#!/usr/bin/env python3
"""
Local dev server for the Targeting editor.

Serves the static site (like `python -m http.server`) AND adds a tiny pattern
save API so the editor can auto-write pattern files into ./patterns/ — which is
git-tracked, so committing the folder syncs your patterns to GitHub.

    GET  /api/patterns           -> [ {pattern}, ... ]  (all files in ./patterns)
    POST /api/patterns/save      -> writes ./patterns/<name>.json
    POST /api/patterns/delete    -> removes ./patterns/<name>.json

Usage:  python3 scripts/dev-server.py [port]   (default 8777)
"""
import http.server, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDIR = os.path.join(ROOT, "patterns")
os.makedirs(PDIR, exist_ok=True)

def safe(name):
    return (re.sub(r"[^\w\-]+", "_", name or "untitled").strip("_") or "untitled")[:80]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        if self.path.split("?")[0].rstrip("/").endswith("/api/patterns"):
            out = []
            for fn in sorted(os.listdir(PDIR)):
                if fn.endswith(".json"):
                    try:
                        out.append(json.load(open(os.path.join(PDIR, fn))))
                    except Exception:
                        pass
            return self._send(200, out)
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        try:
            data = self._read_json()
        except Exception:
            return self._send(400, {"error": "bad json"})
        if path.endswith("/api/patterns/save"):
            fn = safe(data.get("name")) + ".json"
            with open(os.path.join(PDIR, fn), "w") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return self._send(200, {"ok": True, "file": fn})
        if path.endswith("/api/patterns/delete"):
            p = os.path.join(PDIR, safe(data.get("name")) + ".json")
            if os.path.exists(p):
                os.remove(p)
            return self._send(200, {"ok": True})
        return self._send(404, {"error": "not found"})

    def log_message(self, *a):
        pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    print(f"▸ Targeting dev-server on http://127.0.0.1:{port}/  (patterns -> {PDIR})")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
