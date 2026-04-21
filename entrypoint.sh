#!/bin/sh
set -e

echo "Cleaning /app except atlas.ini, ./ssl, and ./internal_data..."
find /app -mindepth 1 ! -name 'atlas.ini' ! -path '/app/ssl' ! -path '/app/ssl/*' ! -path '/app/internal_data' ! -path '/app/internal_data/*' -exec rm -rf {} +

echo "Copying fresh contents from /app_defaults..."
cp -r /app_defaults/* /app/

echo "Ensuring internal_data directories exist with proper permissions..."
mkdir -p /app/internal_data/p2p /app/internal_data/logs
chown -R $(id -u):$(id -g) /app/internal_data

find /app -mindepth 1 ! -path '/app/ssl' ! -path '/app/ssl/*' ! -path '/app/internal_data' ! -path '/app/internal_data/*' -exec chown $(id -u):$(id -g) {} +

exec "$@"
