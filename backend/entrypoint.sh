#!/usr/bin/env sh
set -eu

if [ -n "${DJANGO_DB_HOST:-}" ] && [ -n "${DJANGO_DB_PORT:-}" ]; then
  echo "Waiting for DB at ${DJANGO_DB_HOST}:${DJANGO_DB_PORT}..."
  until nc -z "${DJANGO_DB_HOST}" "${DJANGO_DB_PORT}"; do
    sleep 1
  done
fi

python manage.py migrate --noinput

if [ "${DJANGO_COLLECTSTATIC:-0}" = "1" ]; then
  python manage.py collectstatic --noinput
fi

if [ "${DJANGO_RUNSERVER:-1}" = "1" ]; then
  exec python manage.py runserver 0.0.0.0:8000
else
  exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers "${GUNICORN_WORKERS:-2}"
fi

