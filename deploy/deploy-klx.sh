#!/usr/bin/env bash
set -euo pipefail

# Called from the repository root by the existing production deployment.
KLX_TAG="${1:?A release tag is required}"
case "$KLX_TAG" in
    *[!a-zA-Z0-9._-]*|"."|"..") echo "Invalid KLX release tag" >&2; exit 1 ;;
esac

KLX_SOURCE="$(pwd)/apps/klx-luxe-plus/out"
KLX_ROOT="/var/www/klxluxeplus"
KLX_RELEASE="$KLX_ROOT/releases/$KLX_TAG"
KLX_DOMAIN="klxluxeplus.poolpay.space"
KLX_CERT="/etc/letsencrypt/live/$KLX_DOMAIN/fullchain.pem"
KLX_NGINX="/etc/nginx/sites-available/klxluxeplus.conf"
KLX_NGINX_BACKUP="$KLX_ROOT/previous-nginx-$KLX_TAG.conf"

test -s "$KLX_SOURCE/index.html" || { echo "Missing KLX static export" >&2; exit 1; }
sudo install -d -m 755 "$KLX_RELEASE" "$KLX_ROOT/.well-known/acme-challenge"
sudo cp -a "$KLX_SOURCE/." "$KLX_RELEASE/"
sudo find "$KLX_RELEASE" -type d -exec chmod 755 {} +
sudo find "$KLX_RELEASE" -type f -exec chmod 644 {} +

# Switch the site atomically; keep older releases available for recovery.
KLX_PREVIOUS="$(readlink "$KLX_ROOT/current" || true)"
sudo ln -sfn "$KLX_RELEASE" "$KLX_ROOT/current.next"
sudo mv -Tf "$KLX_ROOT/current.next" "$KLX_ROOT/current"

KLX_CONFIG="nginx/klxluxeplus.conf"
if sudo test -s "$KLX_CERT"; then KLX_CONFIG="nginx/klxluxeplus-ssl.conf"; fi
if sudo test -f "$KLX_NGINX"; then sudo cp "$KLX_NGINX" "$KLX_NGINX_BACKUP"; fi
sudo install -m 644 "$KLX_CONFIG" "$KLX_NGINX"
sudo ln -sfn "$KLX_NGINX" /etc/nginx/sites-enabled/klxluxeplus.conf

if ! sudo nginx -t; then
    if [ -n "$KLX_PREVIOUS" ]; then
        sudo ln -sfn "$KLX_PREVIOUS" "$KLX_ROOT/current.next"
        sudo mv -Tf "$KLX_ROOT/current.next" "$KLX_ROOT/current"
    fi
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
    --non-interactive --agree-tos --email admin@poolpay.space --keep-until-expiring \
    --deploy-hook "systemctl reload nginx"
sudo install -m 644 nginx/klxluxeplus-ssl.conf "$KLX_NGINX"
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable --now certbot.timer

curl --fail --silent --show-error --resolve "$KLX_DOMAIN:443:127.0.0.1" \
    "https://$KLX_DOMAIN/" | grep -F "KLX LUXE PLUS" > /dev/null
echo "KLX Luxe Plus deployed and verified at https://$KLX_DOMAIN"
