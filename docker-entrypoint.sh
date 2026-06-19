#!/bin/sh
set -e

if [ "${PRISMA_SCHEMA_SYNC:-migrate}" = "push" ]; then
  echo "Synchronizing database schema with prisma db push..."
  npx prisma db push --accept-data-loss
else
  echo "Applying database migrations..."
  if ! npx prisma migrate deploy; then
    if [ "${RESET_DATABASE_ON_FAILED_MIGRATION:-false}" = "true" ]; then
      echo "Migration failed. RESET_DATABASE_ON_FAILED_MIGRATION=true, resetting database..."
      npx prisma migrate reset --force --skip-seed
    else
      echo "Migration failed. Set PRISMA_SCHEMA_SYNC=push for first install or RESET_DATABASE_ON_FAILED_MIGRATION=true to reset an empty database."
      exit 1
    fi
  fi
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  npm run db:seed
fi

exec node server.js
