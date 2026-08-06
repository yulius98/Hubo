#!/bin/sh
set -e

cd /var/www/html

# Remove a stale Vite dev-server pointer if it leaked into the image
rm -f public/hot

# Ensure a .env exists (compose environment variables take precedence over it)
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Generate an application key when it was not provided through the environment
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
    php artisan key:generate --force
fi

# Keep the framework storage writable for the web server and workers
chown -R www-data:www-data storage bootstrap/cache public 2>/dev/null || true

if [ "${RUN_SETUP:-true}" = "true" ]; then
    echo "Menunggu database ${DB_HOST:-db}:${DB_PORT:-5432} ..."
    until php -r 'pg_connect("host=".getenv("DB_HOST")." port=".(getenv("DB_PORT") ?: 5432)." dbname=".getenv("DB_DATABASE")." user=".getenv("DB_USERNAME")." password=".getenv("DB_PASSWORD")) or exit(1);' 2>/dev/null; do
        sleep 2
    done

    php artisan migrate --force

    if [ "$(php artisan tinker --execute='echo App\Models\Role::count();' 2>/dev/null)" = "0" ]; then
        php artisan db:seed --force
    fi

    php artisan storage:link || true
fi

exec "$@"
