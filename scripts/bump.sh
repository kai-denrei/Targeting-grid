#!/usr/bin/env bash
# Unified version bump: cache-bust token (HTML widget + ?v= asset URLs) AND the
# service-worker cache name, so one command rolls the whole app forward.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
./scripts/bust.sh "$@"                                  # bumps <meta name=cb> + ?v= URLs
TOK=$(grep -oE 'name="cb" content="[0-9a-f]+"' index.html | grep -oE '[0-9a-f]{8}' | head -1)
sed -i '' -E "s/const VERSION   = '[^']*';/const VERSION   = 'cb-${TOK}';/" sw.js
echo "▸ synced sw.js cache version -> cb-${TOK}"
