#!/bin/sh
set -e

echo "[!] Waiting for database..."

# simple wait loop (replace with pg_isready if you want)
while ! nc -z $(echo $DATABASE_URL | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1 \2|'); do
  sleep 1
done

echo "[+] Database is up"

echo "[x] Running migrations..."
flask db upgrade

echo "[!] Starting app..."
exec gunicorn -w 4 -b 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  wsgi:app#!/bin/sh
set -e

echo "[!] Waiting for database..."

# simple wait loop (replace with pg_isready if you want)
while ! nc -z $(echo $DATABASE_URL | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1 \2|'); do
  sleep 1
done

echo "[+] Database is up"

echo "[!] Running migrations..."
flask db upgrade

echo "🔥 Starting app..."
exec gunicorn -w 4 -b 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  wsgi:app