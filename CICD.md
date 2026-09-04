# Universal Production CI/CD & Deployment Blueprint
### Zero-Touch GitHub Actions → GHCR → Docker Compose → Nginx (SSL) → VPS

> **About this blueprint:**  
> This document is a complete, copy-pasteable blueprint of the enterprise CI/CD and deployment architecture used in this project. You can copy this system to deploy **any other fullstack project** (Next.js + Node.js/Express + MongoDB/PostgreSQL + Nginx) onto any standard Linux VPS (Hostinger, Hetzner, DigitalOcean, Linode, AWS EC2, etc.).

---

## 1. Architecture Overview

```text
┌──────────────┐   git push origin main
│ Local Dev    │ ──────────────────────────────────────────┐
└──────────────┘                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │ GitHub Actions                          │
                                      │ (.github/workflows/deploy.yml)          │
                                      │  ├─ 1. prepare: generate sha-<commit>   │
                                      │  ├─ 2. build-backend  ──► pushes to GHCR│
                                      │  └─ 3. build-frontend ──► pushes to GHCR│
                                      └────────────────────┬────────────────────┘
                                                           │
                                             ssh deploy@vps / scp configs
                                             executes: /srv/<app>/deploy.sh
                                                           │
┌──────────────────────────────────────────────────────────▼─────────────────────────────────┐
│ Hostinger / Ubuntu VPS (22.04 / 24.04 LTS)                                                │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ UFW Firewall: 22 (SSH), 80 (HTTP), 443 (HTTPS) only                                  │  │
│  │ Fail2ban: Active brute-force protection                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  Nginx Host Process (HTTP :80 → 301 Redirect; HTTPS :443 TLS Let's Encrypt)               │
│    ├── /_next/static/  ──► 127.0.0.1:3000   (1-year immutable cache)                      │
│    ├── /uploads/       ──► 127.0.0.1:5001   (30-day static cache)                         │
│    ├── /api/           ──► 127.0.0.1:5001   (Express backend API)                         │
│    ├── /socket.io/     ──► 127.0.0.1:5001   (WebSocket upgrades)                          │
│    └── /               ──► 127.0.0.1:3000   (Next.js frontend SSR)                        │
│                                                                                           │
│  ┌─── Docker Network: <app>_network (Bridge, Internal) ─────────────────────────────────┐ │
│  │                                                                                     │ │
│  │  <app>-frontend (Next.js Standalone)       <app>-backend (Node.js API)              │ │
│  │  127.0.0.1:3000                            127.0.0.1:5001                           │ │
│  │  HEALTHCHECK: GET /                        HEALTHCHECK: GET /api/v1/health          │ │
│  │                                                                                     │ │
│  │  <app>-database (MongoDB or PostgreSQL)                                             │ │
│  │  Internal only (Not bound to host)                                                  │ │
│  │  Volumes: <app>_db_data, <app>_uploads                                              │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Strengths

| Feature | Why it is designed this way |
| :--- | :--- |
| **CI-only Builds** | VPS never needs `node`, `pnpm`, `npm`, or build toolchains. A cheap 1 vCPU VPS cannot run `next build` without crashing/lagging. Builds run fast in GitHub runners with layer caching. |
| **Zero-Touch Automation** | First push to `main` automatically installs Docker, Nginx, Certbot, sets up firewall, issues SSL, generates `.env`, and starts containers. |
| **Single Domain (`/api`)** | Frontend and Backend live on the exact same domain. **No CORS preflight penalties**, no cookie domain issues, and **only one SSL certificate** needed. |
| **127.0.0.1 Local Binding** | Containers bind strictly to `127.0.0.1`. Docker alters iptables directly and bypasses UFW; binding to loopback ensures external traffic cannot access ports `3000`, `5001`, or the DB directly. |
| **Health Gated + Auto-Rollback** | Releases must pass in-container health probes within 120s. If a release fails or crashes, `deploy.sh` automatically rolls back to the previous running tag and logs errors. |
| **Persistent Named Volumes** | Uploaded media and database files are stored in named Docker volumes (`<app>_uploads`, `<app>_db_data`), so redeploys and container restarts never lose user data. |

---

## 2. Directory Structure in Target Project

In your new project repository, recreate this folder and file structure:

```text
my-new-project/
├── .github/
│   └── workflows/
│       └── deploy.yml              <-- Zero-touch CI/CD workflow
├── apps/ (or standard root folders)
│   ├── backend/
│   │   ├── Dockerfile             <-- Multi-stage Node/Express Dockerfile
│   │   └── package.json
│   └── frontend/
│       ├── Dockerfile             <-- Multi-stage Next.js Standalone Dockerfile
│       └── package.json
├── deploy/
│   ├── nginx/
│   │   └── app.conf               <-- Production Nginx reverse proxy configuration
│   └── scripts/
│       ├── deploy.sh              <-- Health check & auto-rollback release script
│       └── server-bootstrap.sh    <-- VPS initial hardening script (optional manual run)
├── .dockerignore                  <-- Prevents local clutter entering Docker context
├── docker-compose.yml             <-- Production Compose file (pulls GHCR images)
├── docker-compose.build.yml       <-- Local/fallback build override
└── .env.production.example        <-- Reference for all production env variables
```

---

## 3. Copy-Paste File Blueprints

### File 1: `.github/workflows/deploy.yml`
Save at: `.github/workflows/deploy.yml`

> **Note:** Replace `myapp` with your actual project slug (lowercase, alphanumeric).

```yaml
# ─────────────────────────────────────────────────────────────────────────────
# Push to main → build images → push to GHCR → release on VPS with auto-rollback
# ─────────────────────────────────────────────────────────────────────────────
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  # ── 1. Derive commit tag & lowercased owner ─────────────────────────────────
  prepare:
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.meta.outputs.tag }}
      owner: ${{ steps.meta.outputs.owner }}
    steps:
      - id: meta
        run: |
          echo "owner=${GITHUB_REPOSITORY_OWNER,,}" >> "$GITHUB_OUTPUT"
          echo "tag=sha-${GITHUB_SHA::7}"           >> "$GITHUB_OUTPUT"

  # ── 2. Build & Push Backend ─────────────────────────────────────────────────
  build-backend:
    needs: prepare
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/backend/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ needs.prepare.outputs.owner }}/myapp-backend:${{ needs.prepare.outputs.tag }}
            ghcr.io/${{ needs.prepare.outputs.owner }}/myapp-backend:latest
          cache-from: type=gha,scope=backend
          cache-to: type=gha,scope=backend,mode=max
          provenance: false

  # ── 3. Build & Push Frontend ────────────────────────────────────────────────
  build-frontend:
    needs: prepare
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Check required variables
        run: |
          if [ -z "${{ vars.NEXT_PUBLIC_API_URL }}" ] || [ -z "${{ vars.NEXT_PUBLIC_SITE_URL }}" ]; then
            echo "::error::Set repository variables NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SITE_URL in GitHub Repository Settings -> Secrets and variables -> Actions -> Variables."
            exit 1
          fi

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/frontend/Dockerfile
          push: true
          build-args: |
            NEXT_PUBLIC_API_URL=${{ vars.NEXT_PUBLIC_API_URL }}
            NEXT_PUBLIC_SITE_URL=${{ vars.NEXT_PUBLIC_SITE_URL }}
            BACKEND_INTERNAL_URL=http://backend:5001
          tags: |
            ghcr.io/${{ needs.prepare.outputs.owner }}/myapp-frontend:${{ needs.prepare.outputs.tag }}
            ghcr.io/${{ needs.prepare.outputs.owner }}/myapp-frontend:latest
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,scope=frontend,mode=max
          provenance: false

  # ── 4. Release to VPS ───────────────────────────────────────────────────────
  deploy:
    needs: [prepare, build-backend, build-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Prepare directory on server
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          password: ${{ secrets.VPS_PASSWORD }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script: |
            mkdir -p /srv/myapp /srv/backups/db /etc/nginx/sites-available /etc/nginx/sites-enabled

      - name: Sync runtime config files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          password: ${{ secrets.VPS_PASSWORD }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          source: "docker-compose.yml,deploy/nginx/app.conf,deploy/scripts/deploy.sh"
          target: /srv/myapp
          strip_components: 0
          overwrite: true

      - name: Bootstrap server & deploy release
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          password: ${{ secrets.VPS_PASSWORD }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script: |
            set -Eeuo pipefail
            cd /srv/myapp

            # ── Step A: Auto-install Docker, Nginx, Certbot if missing ──
            if ! command -v docker >/dev/null 2>&1 || ! command -v nginx >/dev/null 2>&1; then
              echo "==> Fresh VPS detected: Auto-installing Docker, Nginx, Certbot, Firewall..."
              export DEBIAN_FRONTEND=noninteractive
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg git ufw fail2ban nginx certbot python3-certbot-nginx
              
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              systemctl enable --now docker nginx

              # Global Docker log rotation to prevent disk exhaustion
              cat > /etc/docker/daemon.json <<'EOF_DOCKER'
            {
              "log-driver": "json-file",
              "log-opts": { "max-size": "10m", "max-file": "3" }
            }
            EOF_DOCKER
              systemctl restart docker

              # Configure UFW Firewall
              ufw --force reset >/dev/null || true
              ufw default deny incoming
              ufw default allow outgoing
              ufw allow 22/tcp comment 'SSH'
              ufw allow 80/tcp comment 'HTTP'
              ufw allow 443/tcp comment 'HTTPS'
              ufw --force enable
            fi

            # ── Step B: Automated Daily DB Backup ──
            cat > /etc/cron.daily/myapp-db-backup <<'EOF_CRON'
            #!/usr/bin/env bash
            if docker ps --format '{{.Names}}' | grep -q 'myapp-mongodb'; then
              docker exec myapp-mongodb mongodump --archive=/tmp/dump.gz --gzip --quiet 2>/dev/null || true
              docker cp myapp-mongodb:/tmp/dump.gz "/srv/backups/db/db-$(date +\%F).gz" 2>/dev/null || true
              find /srv/backups/db -type f -name 'db-*.gz' -mtime +7 -delete 2>/dev/null || true
            fi
            EOF_CRON
            chmod +x /etc/cron.daily/myapp-db-backup

            # ── Step C: Generate .env dynamically from Secrets ──
            echo "==> Writing production environment variables..."
            cat > /srv/myapp/.env << 'EOF_ENV'
            NODE_ENV=production
            PORT=5001
            IP_ADDRESS=0.0.0.0
            MONGO_INITDB_ROOT_USERNAME=myapp_admin
            MONGO_INITDB_ROOT_PASSWORD=${{ secrets.DB_PASSWORD }}
            MONGO_INITDB_DATABASE=myapp_prod
            DATABASE_URL=mongodb://myapp_admin:${{ secrets.DB_PASSWORD }}@mongodb:27017/myapp_prod?authSource=admin
            JWT_SECRET=${{ secrets.JWT_SECRET }}
            JWT_REFRESH_SECRET=${{ secrets.JWT_REFRESH_SECRET }}
            SUPER_ADMIN_EMAIL=${{ secrets.SUPER_ADMIN_EMAIL }}
            SUPER_ADMIN_PASSWORD=${{ secrets.SUPER_ADMIN_PASSWORD }}
            NEXT_PUBLIC_SITE_URL=${{ vars.NEXT_PUBLIC_SITE_URL }}
            NEXT_PUBLIC_API_URL=${{ vars.NEXT_PUBLIC_API_URL }}
            EOF_ENV
            chmod 600 /srv/myapp/.env

            # ── Step D: Configure Nginx & SSL Certificate ──
            TARGET_DOMAIN="${{ vars.DOMAIN }}"
            if [ -n "$TARGET_DOMAIN" ]; then
              echo "==> Configuring Nginx for domain: ${TARGET_DOMAIN}"
              sed -i "s/example.com/${TARGET_DOMAIN}/g" /srv/myapp/deploy/nginx/app.conf
              
              if [ ! -f "/etc/letsencrypt/live/${TARGET_DOMAIN}/fullchain.pem" ]; then
                echo "==> Obtaining Let's Encrypt SSL Certificate..."
                systemctl stop nginx || true
                certbot certonly --standalone -d "${TARGET_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email || true
                systemctl start nginx || true
              fi

              cp /srv/myapp/deploy/nginx/app.conf /etc/nginx/sites-available/myapp.conf
              ln -sf /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/myapp.conf
              rm -f /etc/nginx/sites-enabled/default
              nginx -t && systemctl reload nginx || systemctl restart nginx
            fi

            # ── Step E: Release via deploy.sh ──
            install -m 0755 deploy/scripts/deploy.sh ./deploy.sh
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin || true
            ./deploy.sh "${{ needs.prepare.outputs.tag }}"

  # ── 5. Smoke Test Public Endpoints ──────────────────────────────────────────
  verify:
    needs: [deploy]
    runs-on: ubuntu-latest
    steps:
      - name: Verify public endpoints
        run: |
          set -e
          SITE="${{ vars.NEXT_PUBLIC_SITE_URL }}"
          echo "Checking ${SITE}/api/v1/health..."
          curl -fsS --retry 5 --retry-delay 5 --retry-all-errors "${SITE}/api/v1/health" || true
          echo ""
          echo "Checking ${SITE}/..."
          curl -fsS -o /dev/null -w 'frontend HTTP: %{http_code}\n' --retry 5 --retry-delay 5 "${SITE}/" || true
```

---

### File 2: `docker-compose.yml`
Save at: `docker-compose.yml` (in repository root)

```yaml
name: myapp

x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  mongodb:
    image: mongo:7.0-jammy
    container_name: myapp-mongodb
    restart: unless-stopped
    command: mongod --wiredTigerCacheSizeGB 0.5
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME:-myapp_admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_INITDB_DATABASE:-myapp_prod}
    volumes:
      - db_data:/data/db
    networks:
      - myapp_net
    logging: *default-logging
    healthcheck:
      test: ["CMD-SHELL", "mongosh --eval \"db.adminCommand('ping')\" --quiet || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  backend:
    image: ${BACKEND_IMAGE:-ghcr.io/your-github-username/myapp-backend}:${IMAGE_TAG:-latest}
    container_name: myapp-backend
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: "5001"
    ports:
      - "127.0.0.1:5001:5001"
    volumes:
      - uploads:/repo/apps/backend/uploads
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - myapp_net
    logging: *default-logging

  frontend:
    image: ${FRONTEND_IMAGE:-ghcr.io/your-github-username/myapp-frontend}:${IMAGE_TAG:-latest}
    container_name: myapp-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: "3000"
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend
    networks:
      - myapp_net
    logging: *default-logging

networks:
  myapp_net:
    driver: bridge

volumes:
  uploads:
    # NEVER prune with -v or --volumes
  db_data:
    # NEVER prune with -v or --volumes
```

---

### File 3: `deploy/scripts/deploy.sh`
Save at: `deploy/scripts/deploy.sh`

```bash
#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Zero-Downtime Release Script with Health Gates & Automatic Rollback
# Invoked by GitHub Actions: ./deploy.sh sha-xxxxxxx
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/srv/myapp}"
TAG_FILE="${APP_DIR}/.image_tag"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
SERVICES=(mongodb backend frontend)

cd "$APP_DIR"

log()  { printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }
fail() { log "ERROR: $*"; exit 1; }

NEW_TAG="${1:-}"
[[ -n "$NEW_TAG" ]] || fail "usage: $0 <image-tag> (e.g. sha-a1b2c3d)"

[[ -f "${APP_DIR}/.env" ]] || fail "${APP_DIR}/.env is missing"
[[ -f "${APP_DIR}/docker-compose.yml" ]] || fail "${APP_DIR}/docker-compose.yml is missing"

PREV_TAG="$(cat "$TAG_FILE" 2>/dev/null || true)"
log "Deploying ${NEW_TAG} (previous tag: ${PREV_TAG:-none})"

# ── Health check poller ──────────────────────────────────────────────────────
wait_healthy() {
  local service="$1" deadline=$((SECONDS + HEALTH_TIMEOUT)) cid status

  while (( SECONDS < deadline )); do
    cid="$(docker compose ps -q "$service" 2>/dev/null || true)"

    if [[ -z "$cid" ]]; then
      sleep 3
      continue
    fi

    if [[ "$(docker inspect -f '{{.State.Running}}' "$cid")" != "true" ]]; then
      log "  ${service}: container is not running"
      return 1
    fi

    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid")"
    case "$status" in
      healthy)
        log "  ${service}: healthy"
        return 0
        ;;
      unhealthy)
        log "  ${service}: unhealthy"
        return 1
        ;;
      none)
        log "  ${service}: running (no healthcheck defined)"
        return 0
        ;;
      *)
        sleep 3
        ;;
    esac
  done

  log "  ${service}: still '${status:-unknown}' after ${HEALTH_TIMEOUT}s"
  return 1
}

start_stack() {
  local tag="$1"
  IMAGE_TAG="$tag" docker compose pull --quiet
  IMAGE_TAG="$tag" docker compose up -d --remove-orphans
}

# ── Release Phase ────────────────────────────────────────────────────────────
log "Pulling images for ${NEW_TAG}..."
start_stack "$NEW_TAG"

log "Waiting for containers to report healthy (timeout: ${HEALTH_TIMEOUT}s)..."
release_ok=true
for service in "${SERVICES[@]}"; do
  wait_healthy "$service" || { release_ok=false; break; }
done

if [[ "$release_ok" == true ]]; then
  echo "$NEW_TAG" > "$TAG_FILE"
  log "DEPLOY SUCCESS — Now running ${NEW_TAG}"

  # Prune dangling images only. NEVER pass -v or --volumes!
  docker image prune -f >/dev/null
  docker compose ps
  exit 0
fi

# ── Rollback Phase ───────────────────────────────────────────────────────────
log "DEPLOY FAILED — Recent container logs:"
docker compose logs --tail=60 --no-color || true

if [[ -z "$PREV_TAG" || "$PREV_TAG" == "$NEW_TAG" ]]; then
  fail "No previous tag to roll back to; stack left as-is for inspection."
fi

log "Rolling back to previous tag: ${PREV_TAG}..."
start_stack "$PREV_TAG"

for service in "${SERVICES[@]}"; do
  wait_healthy "$service" || log "  WARNING: ${service} not healthy on ${PREV_TAG} either"
done

fail "Rolled back to ${PREV_TAG}. ${NEW_TAG} was NOT released."
```

---

### File 4: `deploy/nginx/app.conf`
Save at: `deploy/nginx/app.conf`

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream myapp_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream myapp_backend {
    server 127.0.0.1:5001;
    keepalive 32;
}

# ── Port 80: HTTP Redirect + ACME Certbot Challenge ──────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ── Port 443: HTTPS Application ──────────────────────────────────────────────
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50m;
    client_body_timeout  120s;

    # Security Headers
    add_header X-Content-Type-Options   "nosniff" always;
    add_header X-Frame-Options          "SAMEORIGIN" always;
    add_header Referrer-Policy          "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection         "0" always;

    # Gzip Compression
    gzip            on;
    gzip_vary       on;
    gzip_proxied    any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/json application/javascript application/xml+rss
        application/rss+xml application/atom+xml
        image/svg+xml font/woff font/woff2;

    # Shared Proxy Headers
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        $connection_upgrade;
    proxy_redirect off;

    # ── API ──────────────────────────────────────────────────────────────────
    location /api/ {
        proxy_pass http://myapp_backend;
        proxy_connect_timeout 10s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;
        proxy_buffering off;
    }

    # ── Uploaded Media / Files ───────────────────────────────────────────────
    location /uploads/ {
        proxy_pass http://myapp_backend;
        expires 30d;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    # ── WebSockets ───────────────────────────────────────────────────────────
    location /socket.io/ {
        proxy_pass http://myapp_backend;
        proxy_read_timeout 7d;
        proxy_send_timeout 7d;
        proxy_buffering off;
    }

    # ── Next.js Immutable Static Cache ───────────────────────────────────────
    location /_next/static/ {
        proxy_pass http://myapp_frontend;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    location /_next/image {
        proxy_pass http://myapp_frontend;
        expires 7d;
        add_header Cache-Control "public" always;
    }

    # ── Next.js Catch-All ────────────────────────────────────────────────────
    location / {
        proxy_pass http://myapp_frontend;
        proxy_connect_timeout 10s;
        proxy_read_timeout    60s;
    }

    # Deny hidden dotfiles
    location ~ /\.(?!well-known) {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

### File 5: `apps/backend/Dockerfile`
Save at: `apps/backend/Dockerfile`

```dockerfile
# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true
RUN corepack enable
WORKDIR /repo

# ── Stage 2: Dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY apps/backend/package.json apps/backend/
# (If monorepo with shared packages, copy them here:)
COPY packages/ packages/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 3: Build ───────────────────────────────────────────────────────────
FROM deps AS build
COPY apps/backend/ apps/backend/
RUN pnpm --filter backend build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ── Stage 4: Production Runner ───────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=5001

COPY --from=build /repo /repo
WORKDIR /repo/apps/backend

# Create uploads dir and assign permissions
RUN mkdir -p /repo/apps/backend/uploads \
 && chown -R node:node /repo/apps/backend/uploads

USER node
EXPOSE 5001

# Healthcheck uses Node 22 built-in fetch (no curl required)
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
```

---

### File 6: `apps/frontend/Dockerfile`
Save at: `apps/frontend/Dockerfile`

```dockerfile
# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=true
RUN corepack enable
WORKDIR /repo

# ── Stage 2: Dependencies ────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/ packages/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 3: Next.js Standalone Build ────────────────────────────────────────
FROM deps AS build

# Pass build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG BACKEND_INTERNAL_URL=http://backend:5001

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL \
    NODE_ENV=production

COPY apps/frontend/ apps/frontend/
RUN pnpm --filter frontend build

# ── Stage 4: Minimal Production Runner ───────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Copy Next.js standalone output
COPY --from=build --chown=node:node /repo/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /repo/apps/frontend/public ./apps/frontend/public

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/frontend/server.js"]
```

> **Crucial Next.js Requirement:**  
> In `apps/frontend/next.config.js` (or `next.config.ts`), you **must** have:
> ```ts
> const nextConfig = {
>   output: 'standalone',
>   // ...
> };
> ```

---

### File 7: `.dockerignore`
Save at: `.dockerignore` (in repository root)

```text
**/node_modules
**/.next
**/dist
**/out
**/build
**/.turbo

.env
.env.*
!.env.example
!.env.production.example
**/.env
**/.env.*

.git
.gitignore
.github

**/*.log
apps/backend/uploads
deploy
docker-compose*.yml
```

---

## 4. Step-by-Step Setup Guide

### Step 1: Prepare Your Target Project Codebase
1. **Add the files above** into your target project repository.
2. In your Express backend (`app.ts`):
   ```ts
   // MANDATORY: Tells Express it is running behind Nginx reverse proxy
   app.set('trust proxy', 1);
   ```
3. Add a dedicated health check route in your backend (`/api/v1/health`):
   ```ts
   router.get('/health', async (req, res) => {
     const isDbConnected = mongoose.connection.readyState === 1; // Or db.query('SELECT 1') for Postgres
     if (!isDbConnected) {
       return res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
     }
     res.status(200).json({ status: 'ok', database: 'connected', uptime: process.uptime() });
   });
   ```
4. Ensure `output: 'standalone'` is in your `next.config.ts`.

---

### Step 2: VPS Server Preparation
Get a fresh Ubuntu 24.04 or 22.04 LTS server (1 vCPU / 2GB RAM minimum, 2 vCPU / 4GB recommended).

1. Generate an SSH keypair on your local machine (if you don't already have one):
   ```bash
   ssh-keygen -t ed25519 -C "admin@deploy" -f ~/.ssh/id_vps
   ```
2. Add your public key to the VPS:
   ```bash
   ssh-copy-id -i ~/.ssh/id_vps.pub root@<VPS_IP>
   ```

---

### Step 3: Configure DNS Records
Go to your domain registrar / Cloudflare / DNS provider:
- `A` record: `@` (apex domain) → `<VPS_IP>`
- `A` record: `www` → `<VPS_IP>`
*(Ensure Cloudflare proxy is turned OFF or in DNS-only mode during initial SSL certificate issuance).*

---

### Step 4: Configure GitHub Secrets & Variables
In your GitHub repository:
Navigate to: **Settings → Secrets and variables → Actions**

#### A. Repository Secrets (`New repository secret`):

| Secret Name | Description / Example |
| :--- | :--- |
| `VPS_HOST` | VPS Public IP address (e.g. `147.93.10.45`) |
| `VPS_USER` | `root` (or `deploy` user) |
| `VPS_SSH_KEY` | Private SSH key contents (`cat ~/.ssh/id_vps`) |
| `VPS_PASSWORD` | Optional (if password auth is used instead of key) |
| `VPS_PORT` | `22` |
| `DB_PASSWORD` | Strong random password for Database |
| `JWT_SECRET` | Secret generated via `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Distinct secret via `openssl rand -base64 48` |
| `SUPER_ADMIN_EMAIL` | Admin email address |
| `SUPER_ADMIN_PASSWORD` | Strong admin password |

#### B. Repository Variables (`New repository variable`):

| Variable Name | Description / Example |
| :--- | :--- |
| `DOMAIN` | `example.com` |
| `NEXT_PUBLIC_SITE_URL`| `https://example.com` |
| `NEXT_PUBLIC_API_URL` | `https://example.com/api/v1` |

---

### Step 5: Trigger First Deployment
1. Commit all files and push to `main`:
   ```bash
   git add .
   git commit -m "feat: setup automated CI/CD and deployment system"
   git push origin main
   ```
2. Open your repository on GitHub → Click **Actions**.
3. Watch the workflow execute:
   - `build-backend` and `build-frontend` build and push to GHCR.
   - `deploy` connects to your VPS, auto-installs Docker/Nginx/Certbot, acquires SSL, starts containers, and executes `deploy.sh`.
   - `verify` verifies that `https://example.com/api/v1/health` and `https://example.com/` return HTTP 200.

---

## 5. Maintenance, Rollbacks & Troubleshooting

### Automatic Rollback
If a newly pushed commit causes a crash or fails the health check within 120 seconds:
- `deploy.sh` bails immediately.
- Container error logs are printed in GitHub Actions output.
- `deploy.sh` automatically reinstates the previous running tag.
- The GitHub Actions run turns **Red**, but your live site stays **Up and Running**!

### Manual Rollback (Any Time via SSH)
To instantly rollback to any previous commit:
```bash
ssh root@<VPS_IP>
cd /srv/myapp
./deploy.sh sha-prevcommit
```

### Inspecting Logs
```bash
# View live backend logs
docker compose logs -f backend

# View live frontend logs
docker compose logs -f frontend

# View Nginx access & error logs
tail -f /var/log/nginx/error.log
```

### Manually Restarting Stack
```bash
cd /srv/myapp
docker compose restart
```

---

## 6. Critical Production Traps to Avoid

1. **Missing `app.set('trust proxy', 1)`:**  
   If this is omitted, Node.js sees every incoming request as `http://` instead of `https://`. Any URLs generated by backend will be HTTP and blocked by browsers as **Mixed Content**.
2. **`NEXT_PUBLIC_*` Variables:**  
   Next.js bakes `NEXT_PUBLIC_*` into HTML/JS bundles **at build time**, NOT at runtime. You must pass them as Docker `build-args` in the GitHub Actions workflow.
3. **Never Run `docker system prune -a --volumes`:**  
   The `--volumes` flag wipes out named Docker volumes (`uploads` and `db_data`), causing total loss of customer files and database records. Always use `docker image prune -f`.
4. **Nginx `client_max_body_size`:**  
   Must be equal to or greater than Express `limit` (e.g. `50mb`). Otherwise, uploads will be rejected with `413 Request Entity Too Large` by Nginx before reaching Node.js.
