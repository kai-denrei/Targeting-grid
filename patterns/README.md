# Patterns

Saved targeting patterns, one JSON file per pattern (named after the pattern).

These are written automatically by the app **when served via the local
save-server** (`scripts/dev-server.py`) — create/save a pattern in the editor and
a `<name>.json` file appears here. Commit the folder to sync your patterns to
GitHub. On the live GitHub Pages site (static, no server) the app falls back to
the browser's localStorage plus the Export/Import buttons.

Run the local save-server instead of `python -m http.server`:

```bash
python3 scripts/dev-server.py 8777
# open http://127.0.0.1:8777/
```
