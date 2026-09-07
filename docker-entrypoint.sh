#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

retry() {
  local n=0
  until [ $n -ge 10 ]; do
    "$@" && return 0
    n=$((n+1))
    echo "Retrying command ($n/10) in 2s..."
    sleep 2
  done

  echo "Command failed after 10 attempts: $*"
  return 1
}

echo "Waiting for database and applying migrations..."
retry ./node_modules/.bin/prisma migrate deploy

if [ "${DISABLE_DB_SEED:-0}" != "1" ]; then
  echo "Running seed script..."
  ./node_modules/.bin/prisma db seed
else
  echo "Skipping seed step because DISABLE_DB_SEED=1"
fi

if [ -n "$BALE_BOT_TOKEN" ] && [ -n "$APP_URL" ]; then
  echo "Setting up Bale webhook..."
  retry npx tsx scripts/bale/set-webhook.ts
else
  echo "Skipping Bale webhook setup (BALE_BOT_TOKEN or APP_URL not set)"
fi

echo "Starting app..."
PORT=3030 HOSTNAME=0.0.0.0 npm run start
