#!/usr/bin/env sh
set -eu

hash_input="/app/package.json"
if [ -f "/app/package-lock.json" ]; then
  hash_input="$hash_input /app/package-lock.json"
fi

pkg_hash="$(sha256sum $hash_input | sha256sum | awk '{print $1}')"
sentinel="/app/node_modules/.pkg_hash"

if [ ! -d "/app/node_modules" ]; then
  mkdir -p /app/node_modules
fi

old_hash=""
if [ -f "$sentinel" ]; then
  old_hash="$(cat "$sentinel" || true)"
fi

if [ "$pkg_hash" != "$old_hash" ]; then
  echo "Dependencies changed; installing..."
  npm install
  echo "$pkg_hash" > "$sentinel"
fi

exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort

