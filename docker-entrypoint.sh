#!/bin/sh
set -e

run_migrations() {
  npx prisma migrate deploy
}

baseline_existing_database() {
  migrations="$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)"
  latest="$(printf '%s\n' "$migrations" | tail -n 1)"

  if [ -z "$latest" ]; then
    echo "No migration directories found for baseline."
    return 1
  fi

  echo "Existing database has no Prisma migration history. Baselining previous migrations, latest migration will still be applied: $latest"
  for migration in $migrations; do
    if [ "$migration" = "$latest" ]; then
      continue
    fi
    echo "Marking migration as already applied: $migration"
    npx prisma migrate resolve --applied "$migration"
  done
}

if [ "${PRISMA_SCHEMA_SYNC:-migrate}" = "push" ]; then
  echo "Synchronizing database schema with prisma db push..."
  npx prisma db push --accept-data-loss
else
  echo "Applying database migrations..."
  if ! run_migrations; then
    if [ "${BASELINE_EXISTING_DATABASE:-true}" = "true" ]; then
      echo "Migration deploy failed. Trying Prisma baseline for existing database..."
      baseline_existing_database
      run_migrations
    elif [ "${RESET_DATABASE_ON_FAILED_MIGRATION:-false}" = "true" ]; then
      echo "Migration failed. RESET_DATABASE_ON_FAILED_MIGRATION=true, resetting database..."
      npx prisma migrate reset --force --skip-seed
    else
      echo "Migration failed. Set BASELINE_EXISTING_DATABASE=true for an existing database without migration history, PRISMA_SCHEMA_SYNC=push for first install, or RESET_DATABASE_ON_FAILED_MIGRATION=true to reset an empty database."
      exit 1
    fi
  fi
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  npm run db:seed
fi

exec node server.js
