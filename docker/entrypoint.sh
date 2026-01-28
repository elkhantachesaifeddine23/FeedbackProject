#!/bin/bash
set -e

if [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  export DB_URL="$DATABASE_URL"
fi

if [ -n "$DB_URL" ] && [ -z "$DB_HOST" ]; then
  export DB_CONNECTION="${DB_CONNECTION:-pgsql}"
  export DB_HOST="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); echo $p["host"] ?? "";')"
  export DB_PORT="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); echo $p["port"] ?? "";')"
  export DB_DATABASE="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); $path=$p["path"] ?? ""; echo ltrim($path, "/");')"
  export DB_USERNAME="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); echo $p["user"] ?? "";')"
  export DB_PASSWORD="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); echo $p["pass"] ?? "";')"
  if [ -z "$DB_SSLMODE" ]; then
    export DB_SSLMODE="$(php -r '$u=getenv("DB_URL"); $p=parse_url($u); parse_str($p["query"] ?? "", $q); echo $q["sslmode"] ?? "";')"
  fi
fi

echo "Attendre PostgreSQL..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_DATABASE" -c '\q' 2>/dev/null; then
    echo "PostgreSQL est prêt!"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "PostgreSQL n'est pas prêt... (tentative $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "⚠️  Timeout PostgreSQL atteint, mais on continue quand même..."
fi

if [ ! -f /app/.env ]; then
  if [ -f /app/.env.example ]; then
    cp /app/.env.example /app/.env
  else
    touch /app/.env
  fi
fi

if [ -n "$PORT" ] && [ -f /etc/nginx/conf.d/default.conf ]; then
    echo "Configuration du port ${PORT} pour Render..."
    sed -i "s/listen 80 default_server;/listen ${PORT} default_server;/" /etc/nginx/conf.d/default.conf
fi

if ! grep -q '^APP_KEY=' /app/.env; then
  echo "APP_KEY=" >> /app/.env
fi

echo "Génération de clé..."
php /app/artisan key:generate --force || echo "⚠️  Erreur key:generate"

echo "Exécution des migrations..."
php /app/artisan migrate --force 2>&1 || echo "⚠️  Erreur migrations (retrying next boot)"

php /app/artisan storage:link || true
php /app/artisan config:cache || echo "⚠️  Erreur config:cache"
php /app/artisan route:cache || echo "⚠️  Erreur route:cache"
php /app/artisan view:cache || echo "⚠️  Erreur view:cache"

chown -R www-data:www-data /app
chmod -R 775 /app/storage
chmod -R 775 /app/bootstrap/cache

echo "Démarrage supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
