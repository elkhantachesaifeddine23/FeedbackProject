#!/bin/bash
set -e

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
    cp /app/.env.example /app/.env
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
