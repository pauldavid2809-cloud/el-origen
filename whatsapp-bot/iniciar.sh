#!/usr/bin/env bash
# Inicia el bot en macOS o Linux.
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Instale Node.js (LTS) desde https://nodejs.org/"; exit 1; }
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se creó el archivo .env: complete WHATSAPP_QUEUE_SECRET y vuelva a ejecutar."
  exit 1
fi
[ -d node_modules ] || npm install
( sleep 2; command -v open >/dev/null && open http://localhost:3001 || xdg-open http://localhost:3001 ) >/dev/null 2>&1 &
exec node index.js
