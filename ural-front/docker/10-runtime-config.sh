#!/bin/sh
set -e
# Официальный entrypoint nginx вызывает скрипты из /docker-entrypoint.d/ до старта.
# Пример: API_BASE_URL=https://api.example.com

OUT="/usr/share/nginx/html/runtime-config.js"
BASE="${API_BASE_URL:-${REACT_APP_API_BASE_URL:-http://localhost:10902}}"
BASE=$(echo "$BASE" | sed 's|/*$||')
ESC=$(printf '%s' "$BASE" | sed 's/\\/\\\\/g; s/"/\\"/g')

printf 'window.__RUNTIME_CONFIG__ = {\n  API_BASE_URL: "%s"\n};\n' "$ESC" > "$OUT"
