#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PoolPay Zero-Downtime Deployment & Bootstrap Script
# ==============================================================================

IMAGE_TAG="${1:-latest}"
REPO_OWNER="${2:-adnanmahmud0}"
REPO_OWNER_LOWER="$(echo "$REPO_OWNER" | tr '[:upper:]' '[:lower:]')"

export BACKEND_IMAGE="ghcr.io/${REPO_OWNER_LOWER}/poolpay-backend:${IMAGE_TAG}"
export ADMIN_IMAGE="ghcr.io/${REPO_OWNER_LOWER}/poolpay-admin:${IMAGE_TAG}"
export API_IMAGE="$BACKEND_IMAGE"
export WEB_IMAGE="$ADMIN_IMAGE"
export IMAGE_TAG

WORKDIR="/home/ubuntu/poolpay"
cd "$WORKDIR"

echo "=================================================="
echo "🚀 Starting PoolPay Deployment: ${IMAGE_TAG}"
echo "=================================================="

# 1. System Dependency Bootstrap (Idempotent)
echo "📦 Checking system dependencies..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker ubuntu || true
fi

if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update -y
    sudo apt-get install -y nginx
fi

if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Ensure docker service is running and accessible
sudo systemctl enable --now docker
sudo chmod 666 /var/run/docker.sock || true

# Authenticate with GHCR if tokens are provided
if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_ACTOR:-}" ]; then
    echo "🔑 Logging into GitHub Container Registry..."
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_ACTOR" --password-stdin || true
fi

# 2. Configure Nginx
echo "🌐 Configuring Nginx reverse proxy..."
if [ -f "nginx/poolpay.conf" ]; then
    sudo cp nginx/poolpay.conf /etc/nginx/sites-available/poolpay.conf
    sudo ln -sf /etc/nginx/sites-available/poolpay.conf /etc/nginx/sites-enabled/poolpay.conf
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx || {
        echo "⚠️ Nginx reload failed, restarting Nginx..."
        sudo systemctl restart nginx
    }
fi

# 3. Pull new images
echo "📥 Pulling images: ${BACKEND_IMAGE} and ${ADMIN_IMAGE}..."
docker compose -f docker-compose.prod.yml pull backend admin || {
    echo "❌ Failed to pull Docker images from GHCR. Check registry authentication."
    exit 1
}

# 4. Save previous tag for rollback capability
if [ -f ".current_tag" ]; then
    PREV_TAG="$(cat .current_tag)"
    echo "$PREV_TAG" > .previous_tag
fi

# 5. Start containers
echo "🚀 Starting containers with docker compose..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 6. Health Check Loop
echo "⏳ Verifying backend health at http://127.0.0.1:5000/health..."
HEALTHY=false
for i in {1..20}; do
    if curl -s -f http://127.0.0.1:5000/health > /dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    echo "Waiting for API to be healthy... ($i/20)"
    sleep 3
done

if [ "$HEALTHY" = true ]; then
    echo "✅ Backend API is healthy!"
    echo "$IMAGE_TAG" > .current_tag
else
    echo "❌ Health check failed after 60 seconds!"
    echo "📋 Dumping Docker container status:"
    docker compose -f docker-compose.prod.yml ps -a || true
    echo "📋 Dumping Backend API container logs:"
    docker compose -f docker-compose.prod.yml logs --tail=100 backend || true
    echo "📋 Dumping MongoDB container logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 mongodb || true
    echo "📋 Dumping Admin container logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 admin || true
    if [ -f ".previous_tag" ]; then
        ROLLBACK_TAG="$(cat .previous_tag)"
        echo "🔄 Rolling back to previous version: ${ROLLBACK_TAG}..."
        export IMAGE_TAG="$ROLLBACK_TAG"
        export BACKEND_IMAGE="ghcr.io/${REPO_OWNER_LOWER}/poolpay-backend:${ROLLBACK_TAG}"
        export ADMIN_IMAGE="ghcr.io/${REPO_OWNER_LOWER}/poolpay-admin:${ROLLBACK_TAG}"
        export API_IMAGE="$BACKEND_IMAGE"
        export WEB_IMAGE="$ADMIN_IMAGE"
        docker compose -f docker-compose.prod.yml up -d --remove-orphans
    fi
    exit 1
fi

# 7. Check / Issue SSL Certificates if not already present
echo "🔒 Checking SSL certificates for poolpay.space domains..."
if [ ! -d "/etc/letsencrypt/live/poolpay.space" ]; then
    echo "Requesting SSL certificates from Let's Encrypt..."
    sudo certbot --nginx \
        -d poolpay.space \
        -d www.poolpay.space \
        -d api.poolpay.space \
        -d admin.poolpay.space \
        --non-interactive \
        --agree-tos \
        --email admin@poolpay.space \
        --no-eff-email \
        --redirect \
        --expand || {
            echo "⚠️ Certbot SSL certificate issuance will be retried on next deploy."
        }
    sudo nginx -t && sudo systemctl reload nginx || true
fi

# 8. Clean up unused images
echo "🧹 Pruning old Docker images..."
docker image prune -f

echo "=================================================="
echo "🎉 Deployment completed successfully! Tag: ${IMAGE_TAG}"
echo "=================================================="
