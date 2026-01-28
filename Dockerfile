# Build stage for Node assets
FROM node:20-alpine AS assets-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# PHP Application stage
FROM php:8.3-fpm-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    zip \
    unzip \
    git \
    postgresql-client \
    nginx \
    supervisor \
    bash \
    libpq-dev \
    oniguruma-dev \
    build-base \
    autoconf

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    bcmath

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application first
COPY . .

# Copy built assets
COPY --from=assets-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader

# Copy config files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /app/docker/entrypoint.sh

# Setup permissions
RUN mkdir -p /var/log/supervisor /var/run/nginx /var/cache/nginx /var/run/php && \
    chown -R www-data:www-data /var/log/supervisor /var/run/nginx /var/cache/nginx /var/run/php

RUN chown -R www-data:www-data /app && \
    chmod -R 755 /app && \
    chmod -R 775 storage bootstrap/cache && \
    chmod +x /app/docker/entrypoint.sh && \
    chmod 666 /etc/nginx/conf.d/default.conf

EXPOSE 80

# Rester en root pour permettre les modifications de configuration au démarrage
# USER www-data

ENTRYPOINT ["/app/docker/entrypoint.sh"]
