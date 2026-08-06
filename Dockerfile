# syntax=docker/dockerfile:1

FROM php:8.4-fpm

ARG NODE_VERSION=22.12.0

# System packages and PHP extensions required by the application
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        xz-utils \
        unzip \
        libpq-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libicu-dev \
        libonig-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        gd \
        intl \
        mbstring \
        opcache \
        pdo_pgsql \
        pgsql \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Node.js so the Vite build can run inside the container
# (the Laravel Wayfinder plugin runs `php artisan wayfinder:generate` during the build)
RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
        | tar -xJ -C /usr/local --strip-components=1

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install JavaScript dependencies (cached until package.json / lockfile change)
COPY package.json package-lock.json ./
RUN npm ci

# Application source (.env is excluded via .dockerignore)
COPY . .

# Minimal .env so Composer scripts can boot Laravel during the build
RUN cp .env.example .env

# PHP dependencies, including dev (required for seeders and tinker)
RUN composer install --no-interaction --no-progress --prefer-dist

# Build the frontend (generates routes/actions via Wayfinder, then Vite)
RUN npm run build

# Slim the image down now that the build is done
RUN rm -rf node_modules

# PHP runtime configuration
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-hubo.ini

# Entrypoint (key generation, database migration, seeding)
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Framework storage directories
RUN mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache public

EXPOSE 9000

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
