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
retry npx prisma migrate deploy

if [ "${DISABLE_DB_SEED:-0}" != "1" ]; then
  echo "Running seed script..."
  npx prisma db seed
else
  echo "Skipping seed step because DISABLE_DB_SEED=1"
fi

echo "Starting app..."
npm run start
