#!/bin/sh
set -e

echo "[!] Waiting for database..."

while ! nc -z $(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1 \2|'); do
  sleep 1
done

echo "[+] Database is up"

case "${FORCE_MIGRATE:-false}" in
  true|TRUE|1|yes|YES)
    echo "[!] FORCE_MIGRATE is enabled"
    echo "[!] Resetting database schema..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

    echo "[!] Running migrations..."
    flask db upgrade

    if [ -f /app/seed.sql ]; then
      echo "[!] Running seed.sql..."
      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /app/seed.sql
    fi
    ;;
  *)
    echo "[!] FORCE_MIGRATE is disabled; skipping migrations and seed"
    ;;
esac

echo "[!] Starting app..."
exec gunicorn -w 4 -b 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  wsgi:app
