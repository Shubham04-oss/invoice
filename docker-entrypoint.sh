#!/usr/bin/env bash
set -euo pipefail

# If DATABASE_URL is set and looks like PostgreSQL, run migrations.
# This prevents attempting to run Prisma migrations when an incompatible
# URL (for example a SQLite file path) is passed into a container whose
# Prisma schema uses the PostgreSQL provider.
# Only run migrations when explicitly allowed. This prevents accidental schema changes
# in production when the container is started without an intention to migrate.
# To run migrations in a deployment, set RUN_MIGRATIONS=1 (or 'true') and ensure
# DATABASE_URL points to PostgreSQL.
if [ "${RUN_MIGRATIONS-""}" = "1" ] || [ "${RUN_MIGRATIONS-""}" = "true" ]; then
  if [ -n "${DATABASE_URL-}" ]; then
    case "$DATABASE_URL" in
      postgresql://*|postgres://*)
        echo "RUN_MIGRATIONS enabled and PostgreSQL DATABASE_URL detected — running prisma migrate deploy..."
        npx prisma migrate deploy --schema=./prisma/schema.prisma || true
        ;;
      *)
        echo "RUN_MIGRATIONS set but DATABASE_URL is not PostgreSQL; skipping prisma migrate deploy."
        ;;
    esac
  else
    echo "RUN_MIGRATIONS set but DATABASE_URL is empty; skipping prisma migrate deploy."
  fi
else
  echo "RUN_MIGRATIONS not enabled — skipping prisma migrate deploy. To enable, set RUN_MIGRATIONS=1"
fi

# Start the Next.js server
echo "Starting Next.js..."
exec npm start
