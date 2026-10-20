#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
echo "Abra http://localhost:8080 no Chrome ou Edge. Ctrl+C encerra o servidor."
exec python3 -m http.server 8080 --bind 127.0.0.1
