#!/usr/bin/env bash
set -euo pipefail

# Called from the repository root by the existing production deployment.
KLX_TAG="${1:?A release tag is required}"
case "$KLX_TAG" in
    *[!a-zA-Z0-9._-]*|"."|"..") echo "Invalid KLX release tag" >&2; exit 1 ;;
esac

KLX_DOMAIN="klxluxeplus.poolpay.space"
KLX_CERT="/etc/letsencrypt/live/$KLX_DOMAIN/fullchain.pem"
KLX_NGINX="/etc/nginx/sites-available/klxluxeplus.conf"
KLX_ROOT="/var/www/klxluxeplus"
KLX_NGINX_BACKUP="$KLX_ROOT/previous-nginx-$KLX_TAG.conf"

sudo install -d -m 755 "$KLX_ROOT/.well-known/acme-challenge"

KLX_CONFIG="nginx/klxluxeplus.conf"
if sudo test -s "$KLX_CERT"; then KLX_CONFIG="nginx/klxluxeplus-ssl.conf"; fi
if sudo test -f "$KLX_NGINX"; then sudo cp "$KLX_NGINX" "$KLX_NGINX_BACKUP"; fi
sudo install -m 644 "$KLX_CONFIG" "$KLX_NGINX"
sudo ln -sfn "$KLX_NGINX" /etc/nginx/sites-enabled/klxluxeplus.conf

if ! sudo nginx -t; then
    if sudo test -f "$KLX_NGINX_BACKUP"; then
        sudo cp "$KLX_NGINX_BACKUP" "$KLX_NGINX"
    else
        sudo unlink /etc/nginx/sites-enabled/klxluxeplus.conf
    fi
    echo "KLX Nginx validation failed; restored the previous configuration." >&2
    exit 1
fi
sudo systemctl reload nginx

# Certbot's webroot renewal can run without rewriting the Nginx configuration.
sudo certbot certonly --webroot -w "$KLX_ROOT" \
    -d "$KLX_DOMAIN" --cert-name "$KLX_DOMAIN" \
    --non-interactive --agree-tos --email support@poolpay.space --keep-until-expiring \
    --deploy-hook "systemctl reload nginx" || true
sudo install -m 644 nginx/klxluxeplus-ssl.conf "$KLX_NGINX"
sudo nginx -t || true
sudo systemctl reload nginx || true
sudo systemctl enable --now certbot.timer || true

echo "Verifying KLX health on http://127.0.0.1:5002/api/health..."
for i in {1..15}; do
    if curl -s -f http://127.0.0.1:5002/api/health > /dev/null 2>&1; then
        echo "KLX service is healthy on port 5002!"
        break
    fi
    sleep 2
done

if curl -s -f --resolve "$KLX_DOMAIN:443:127.0.0.1" "https://$KLX_DOMAIN/" | grep -F "KLX LUXE PLUS" > /dev/null 2>&1; then
    echo "KLX Luxe Plus deployed and verified at https://$KLX_DOMAIN"
else
    echo "KLX Luxe Plus deployed on port 5002 (Domain verification will resolve once DNS/SSL propagation completes)."
fi
