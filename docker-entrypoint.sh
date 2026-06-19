#!/bin/sh
set -e

npx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  npm run db:seed
fi

exec node server.js
