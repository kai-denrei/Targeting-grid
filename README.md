# 的 — Targeting Pattern Editor

An installable, offline-capable **Progressive Web App** for designing and exporting
3D targeting / stance patterns for the 的 card system.

**Live:** https://kai-denrei.github.io/Targeting-grid/

## Features

- **3D perspective grid editor** — a near grid (shooter stance) and a far grid (target
  footprint), rendered as a tilted board with extruded glass cubes.
- **Orange target cubes** + **compact teal stance orbs** (hot core + halo).
- Click targets track the **visible top face** of each cube (post-perspective), not the
  flat base — so toggling cells feels right despite the tilt.
- **Transparent PNG export** — re-projects the exact tilted scene onto a `<canvas>` and
  downloads a transparent image, ready to drop into card art.
- **Fixed** and **Stance-linked** modes, movement axes, animated preview, ASCII notation,
  JSON export, and a live card preview.

## PWA

- Installable on Android/Chrome/Edge (custom install button) and iOS Safari
  (Add-to-Home-Screen hint).
- Works fully offline after first load (vanilla service worker, no build step).
- Update flow asks before reloading — no interrupted sessions.

## Run locally

It's a static site — any static server works:

```bash
python3 -m http.server 8777
# open http://127.0.0.1:8777/
```

A service worker requires `https://` in production (GitHub Pages provides it) or
`localhost`/`127.0.0.1` in development.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The editor + PWA wiring |
| `sw.js` | Service worker (NetworkFirst nav, cached shell, offline fallback) |
| `manifest.webmanifest` | Web app manifest |
| `offline.html` | Offline fallback page |
| `icons/` | App icons (192 / 512 / maskable / apple-touch) |
