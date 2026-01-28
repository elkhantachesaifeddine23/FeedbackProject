#!/bin/bash
set -e

# S'assurer que les dossiers de logs existent pour Supervisor et PHP
mkdir -p /var/log/supervisor /var/run/php /var/cache/nginx /var/run/nginx
chown -R www-data:www-data /var/log/supervisor /var/run/php /var/cache/nginx /var/run/nginx

# Test de connexion PostgreSQL utilisant l'URL complète (gère le SSL)
echo "Vérification de la connexion Supabase..."
if [ -n "$DATABASE_URL" ]; then
  MAX_ATTEMPTS=5
  ATTEMPT=0
  while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
      echo "✅ PostgreSQL est prêt!"
      break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "PostgreSQL n'est pas prêt... (tentative $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
  done
fi

# Configuration du port Render
if [ -n "$PORT" ] && [ -f /etc/nginx/conf.d/default.conf ]; then
    echo "Configuration du port ${PORT} pour Render..."
    sed -i "s/listen 80 default_server;/listen ${PORT} default_server;/" /etc/nginx/conf.d/default.conf
fi

# Laravel Tasks
echo "Optimisation de Laravel..."
php /app/artisan migrate --force --no-interaction || echo "⚠️ Migrations déjà faites ou erreur"
php /app/artisan storage:link || true
php /app/artisan config:cache
php /app/artisan route:cache

# Fix final des permissions avant le lancement
chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Test php-fpm configuration
echo "Test de la configuration PHP-FPM..."
php-fpm -t || (echo "❌ Erreur de config PHP-FPM" && cat /usr/local/etc/php-fpm.d/*.conf && exit 1)

echo "🚀 Lancement de Supervisord..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf