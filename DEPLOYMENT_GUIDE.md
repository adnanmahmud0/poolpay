# 🚀 PoolPay / Derival81 — Production Deployment Guide

A comprehensive, production-tested manual for deploying the **PoolPay** full-stack monorepo (`apps/api` Express backend, `apps/web` Next.js 16 dashboard, MongoDB, Redis) and the standalone **Flutter Mobile App** (`derival81`).

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Domain & DNS Configuration](#2-domain--dns-configuration)
3. [Server Hardware & OS Requirements](#3-server-hardware--os-requirements)
4. [Method 1: Automated CI/CD via GitHub Actions (Recommended)](#4-method-1-automated-cicd-via-github-actions-recommended)
   - [Required GitHub Secrets](#required-github-secrets)
   - [Server Bootstrap for CI/CD](#server-bootstrap-for-cicd)
   - [Triggering the Deployment](#triggering-the-deployment)
   - [Health Check & Automatic Rollback](#health-check--automatic-rollback)
5. [Method 2: Manual VPS Deployment (Docker Compose)](#5-method-2-manual-vps-deployment-docker-compose)
   - [Step 1: Install System Dependencies](#step-1-install-system-dependencies)
   - [Step 2: Clone Repository & Setup Working Directory](#step-2-clone-repository--setup-working-directory)
   - [Step 3: Setup Production Environment (.env)](#step-3-setup-production-environment-env)
   - [Step 4: Configure Nginx Reverse Proxy](#step-4-configure-nginx-reverse-proxy)
   - [Step 5: Obtain SSL Certificates (Certbot)](#step-5-obtain-ssl-certificates-certbot)
   - [Step 6: Launch Containers](#step-6-launch-containers)
6. [Method 3: Native Host / PM2 Deployment (Alternative without Docker)](#6-method-3-native-host--pm2-deployment-alternative-without-docker)
7. [Mobile App Deployment (Flutter — `derival81`)](#7-mobile-app-deployment-flutter--derival81)
   - [Android Release (Google Play AAB)](#android-release-google-play-aab)
   - [iOS Release (App Store / TestFlight IPA)](#ios-release-app-store--testflight-ipa)
8. [Database Backups & Maintenance](#8-database-backups--maintenance)
9. [Operational Monitoring, Logs & Troubleshooting](#9-operational-monitoring-logs--troubleshooting)
10. [Production Environment Variables Reference](#10-production-environment-variables-reference)

---

## 1. Architecture Overview

PoolPay uses a containerized micro-service topology orchestrated via Docker Compose and secured behind an Nginx reverse proxy with automated Let's Encrypt TLS:

```text
                                Internet (Users & Mobile Apps)
                                              │
                                   Ports 80 / 443 (TLS)
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Ubuntu Host (22.04 / 24.04 LTS)                                                        │
│                                                                                        │
│  Nginx Reverse Proxy (/etc/nginx/sites-available/poolpay.conf)                         │
│  ├── poolpay.space / www.poolpay.space ──► http://127.0.0.1:5000 (Landing / Legal)    │
│  ├── api.poolpay.space                 ──► http://127.0.0.1:5000 (Express Backend)    │
│  │    └── /socket.io/                  ──► http://127.0.0.1:5000 (WebSocket Upgrades) │
│  └── admin.poolpay.space               ──► http://127.0.0.1:5001 (Next.js Dashboard)  │
│                                                                                        │
│  Docker Bridge Network (poolpay-prod-network)                                          │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐             │
│  │ poolpay_api_prod (Port 5000)    │   │ poolpay_web_prod (Port 5001)    │             │
│  │ Node.js 20 / Express + BullMQ   │   │ Next.js 16 Standalone (Port 3000)│            │
│  └────────────────┬────────────────┘   └─────────────────────────────────┘             │
│                   │                                                                    │
│                   ├──► poolpay_mongodb_prod (:27017) (Persistent volume: mongodb_data) │
│                   └──► poolpay_redis_prod   (:6379)  (Persistent volume: redis_data)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Details:
- **`apps/api`**: Express.js + Mongoose + BullMQ + Socket.IO server running on port `5000`.
- **`apps/web`**: Next.js 16 Standalone build listening on port `3000` (mapped to host port `5001`).
- **`mongodb`**: MongoDB 7.0 engine with persistent Docker volume `mongodb_data_prod`.
- **`redis`**: Redis 7 Alpine caching and task queue engine with persistent volume `redis_data_prod`.
- **`derival81`**: Flutter Mobile App connecting via HTTPS to `https://api.poolpay.space`.

---

## 2. Domain & DNS Configuration

Before setting up SSL or starting the deployment, add the following **DNS A records** in your domain registrar / DNS provider (Cloudflare, Namecheap, Route53, etc.) pointing to your server's public IP:

| Type | Name / Host | Target IP | Description |
| :--- | :--- | :--- | :--- |
| **A** | `@` (`poolpay.space`) | `YOUR_SERVER_IP` | Main domain (Landing & Legal pages) |
| **A** | `www` | `YOUR_SERVER_IP` | Canonical WWW redirect |
| **A** | `api` | `YOUR_SERVER_IP` | Backend REST API & WebSockets |
| **A** | `admin` | `YOUR_SERVER_IP` | Next.js Super-Admin & Staff Dashboard |

> **Note for Cloudflare Users:** During initial SSL certificate generation, set SSL/TLS mode to **DNS Only (Grey Cloud)**. After Certbot has issued the certificates, you may switch to **Proxied (Orange Cloud)** with SSL mode set to **Full (Strict)**.

---

## 3. Server Hardware & OS Requirements

### Recommended Hardware:
- **Provider**: AWS EC2, DigitalOcean, Hetzner, Hostinger, Linode, or any Ubuntu VPS
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (64-bit)
- **CPU**: 2 vCPUs minimum
- **RAM**: 4 GB RAM recommended (or 2 GB RAM + 2 GB Swap file)
- **Disk**: 30+ GB NVMe / SSD
- **Firewall (UFW / Security Group)**:
  - Port `22` (SSH)
  - Port `80` (HTTP for Let's Encrypt challenge & redirects)
  - Port `443` (HTTPS for production traffic)
  - *Internal ports `5000`, `5001`, `27017`, `6379` MUST NOT be exposed to the public.*

---

## 4. Method 1: Automated CI/CD via GitHub Actions (Recommended)

The repository includes a production-ready workflow in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) and a zero-downtime release script in [`deploy/deploy.sh`](file:///deploy/deploy.sh).

Every push to the `main` branch:
1. Builds optimized Docker images for `@repo/api` and `@repo/web` with build cache.
2. Pushes images to GitHub Container Registry (`ghcr.io`).
3. Generates `.env.production` from GitHub Repository Secrets.
4. SCPs configuration files (`.env`, `docker-compose.prod.yml`, `nginx/poolpay.conf`, `deploy/deploy.sh`) to `/home/ubuntu/poolpay`.
5. Executes `deploy/deploy.sh` on the server over SSH.
6. Runs in-container health probes against `http://127.0.0.1:5000/health`.
7. Issues or renews SSL certificates via Certbot automatically.
8. Automatically rolls back to the previous stable release if health checks fail.

---

### Required GitHub Secrets

Navigate to your GitHub repository: **Settings → Secrets and variables → Actions → Repository secrets** and add the following:

#### 1. Server Access Secrets:
| Secret Name | Example / Description |
| :--- | :--- |
| `EC2_HOST` | Public IP address or domain of the VPS (e.g., `195.35.xx.xx`) |
| `EC2_USER` | SSH user (typically `ubuntu` or `root`) |
| `EC2_SSH_KEY` | Private SSH key (PEM / OpenSSH format) with access to `EC2_HOST` |
| `EC2_PORT` | SSH port (defaults to `22`) |

#### 2. Database & Core Security Secrets:
| Secret Name | Example / Description |
| :--- | :--- |
| `MONGO_PASSWORD` | Strong password for MongoDB `admin` user |
| `JWT_ACCESS_SECRET` | 64+ char random string (e.g., `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | 64+ char random string (e.g., `openssl rand -hex 32`) |
| `EXPRESS_SESSION_SECRET` | 32+ char random string |
| `ENCRYPTION_KEY` | 32-byte hexadecimal encryption key for secure fields |
| `SUPER_ADMIN_NAME` | Initial super admin display name (e.g., `Super Admin`) |
| `SUPER_ADMIN_EMAIL` | Admin login email (e.g., `admin@poolpay.space`) |
| `SUPER_ADMIN_PASSWORD` | Initial admin password (must meet complexity requirements) |

#### 3. Third-Party Integration Secrets:
| Secret Name | Description |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key for S3 file storage |
| `AWS_REGION` | AWS S3 Region (e.g., `eu-north-1` or `us-east-1`) |
| `AWS_BUCKET_NAME` | AWS S3 Bucket Name (e.g., `poolpay-production`) |
| `RESEND_API_KEY` | API key from Resend (`re_...`) for transactional emails |
| `STRIPE_LIVE_SECRET_KEY` | Stripe live secret key (`sk_live_...`) |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Stripe live publishable key (`pk_live_...`) |
| `STRIPE_LIVE_WEBHOOK_SECRET` | Stripe live endpoint webhook secret (`whsec_...`) |
| `STRIPE_LIVE_CONNECT_WEBHOOK_SECRET` | Stripe Connect webhook secret (`whsec_...`) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS OTP |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64-encoded `service-account.json` for Push Notifications |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64` | Base64-encoded Google Play credentials for Android In-App Purchases |
| `APPLE_ISSUER_ID` | App Store Connect Issuer ID |
| `APPLE_KEY_ID` | App Store Connect In-App Purchase Key ID |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `APPLE_PRIVATE_KEY_BASE64` | Base64-encoded `.p8` private key for StoreKit 2 verification |

---

### Server Bootstrap for CI/CD

On a fresh Ubuntu VPS, run the following commands once via SSH to prepare the deployment directory and permissions:

```bash
# 1. Update system packages
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Create the deploy directory
sudo mkdir -p /home/ubuntu/poolpay
sudo chown -R ubuntu:ubuntu /home/ubuntu/poolpay

# 3. Enable UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. (Optional) Create 2GB swap if RAM is 2GB or less
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Triggering the Deployment

Once your secrets and server directory are prepared:

1. **Automatic Trigger**: Push any commit to `main`:
   ```bash
   git add .
   git commit -m "feat: release v1.0.0"
   git push origin main
   ```
2. **Manual Trigger**: Navigate to your GitHub repo → **Actions** → **Production CI/CD Deployment** → Click **Run workflow** on `main`.

---

### Health Check & Automatic Rollback

The deployment script executes a 20-step poll (up to 60 seconds) checking:
```bash
curl -s -f http://127.0.0.1:5000/health
```
- **If HTTP 200 is received**: The release is marked healthy, and `.current_tag` is updated.
- **If health checks fail**: The script captures logs from MongoDB, API, and Web containers, rolls back to `.previous_tag`, and exits with code `1` to notify you on GitHub Actions.

---

## 5. Method 2: Manual VPS Deployment (Docker Compose)

If you prefer deploying manually directly on your server without GitHub Actions:

### Step 1: Install System Dependencies

SSH into your VPS and install Docker, Nginx, and Certbot:

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx git

# Install Docker Engine & Compose plugin
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

---

### Step 2: Clone Repository & Setup Working Directory

```bash
mkdir -p /home/ubuntu/poolpay
cd /home/ubuntu/poolpay

git clone https://github.com/adnanmahmud0/poolpay.git .
```

---

### Step 3: Setup Production Environment (.env)

Create `.env` inside `/home/ubuntu/poolpay/.env`:

```bash
cat << 'EOF' > /home/ubuntu/poolpay/.env
NODE_ENV=production
PORT=5000
IP=0.0.0.0
AUTH_SYSTEM=custom

# Domains & URLs
FRONTEND_URL=https://poolpay.space
BACKEND_URL=https://api.poolpay.space
NEXT_PUBLIC_BASE_URL=https://api.poolpay.space
NEXT_PUBLIC_API_URL=https://api.poolpay.space/api/v1

# Security & Secrets (Replace with real values)
JWT_ACCESS_SECRET=your_super_strong_jwt_access_secret_here_64_chars
JWT_REFRESH_SECRET=your_super_strong_jwt_refresh_secret_here_64_chars
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_TIMEOUT_MINUTES=20
RESET_PASS_EXPIRES=10m
OTP_EXPIRES=2m
BCRYPT_SALT_ROUND=10
EXPRESS_SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Initial Super Admin Seed
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@poolpay.space
SUPER_ADMIN_PASSWORD=PoolPayAdminPass2026!

# Database (Internal Docker Network)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=YourSecureMongoPassword2026!
MONGO_INITDB_DATABASE=poolPay-db
DATABASE_URL=mongodb://admin:YourSecureMongoPassword2026!@mongodb:27017/poolPay-db?authSource=admin

# Redis (Internal Docker Network)
REDIS_HOST=redis
REDIS_PORT=6379
DISABLE_REDIS_WORKERS_IN_DEV=false

# Storage Provider (AWS S3)
STORAGE_PROVIDER=aws
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=poolpay-production

# Email (Resend)
EMAIL_PROVIDER=resend
SMTP_FORM=no-reply@poolpay.space
RESEND_API_KEY=re_...

# Payments (Stripe)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_...
STRIPE_LIVE_CONNECT_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# SMS (Twilio)
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_MESSAGING_SERVICE_SID=MG...

# Rate Limiting
RATE_LIMITER_ENABLED=true
SELF_PING_ENABLED=true
EOF

# Lock down file permissions
chmod 600 /home/ubuntu/poolpay/.env
```

---

### Step 4: Configure Nginx Reverse Proxy

Copy the pre-configured Nginx profile into Nginx configuration directory:

```bash
sudo cp nginx/poolpay.conf /etc/nginx/sites-available/poolpay.conf
sudo ln -sf /etc/nginx/sites-available/poolpay.conf /etc/nginx/sites-enabled/poolpay.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 5: Obtain SSL Certificates (Certbot)

Run Certbot to generate trusted SSL certificates for all 4 subdomains:

```bash
sudo certbot --nginx \
    -d poolpay.space \
    -d www.poolpay.space \
    -d api.poolpay.space \
    -d admin.poolpay.space \
    --agree-tos \
    --email admin@poolpay.space \
    --no-eff-email \
    --redirect
```

Certbot will automatically install auto-renewal hooks (`certbot.timer`).

---

### Step 6: Launch Containers

#### Option A: Build and Run Locally from Source
```bash
# Build containers locally on the VPS
docker compose -f docker-compose.prod.yml build

# Start services in the background
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

#### Option B: Pull Pre-built Images from GHCR
```bash
export API_IMAGE="ghcr.io/adnanmahmud0/poolpay-api:latest"
export WEB_IMAGE="ghcr.io/adnanmahmud0/poolpay-web:latest"

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

Verify that all 4 containers are running and healthy:
```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```text
NAME                     IMAGE                                  COMMAND                  SERVICE    STATUS
poolpay_api_prod         ghcr.io/adnanmahmud0/poolpay-api...   "docker-entrypoint.s…"   api        Up (healthy)
poolpay_mongodb_prod     mongo:7.0                              "docker-entrypoint.s…"   mongodb    Up (healthy)
poolpay_redis_prod       redis:7-alpine                         "docker-entrypoint.s…"   redis      Up (healthy)
poolpay_web_prod         ghcr.io/adnanmahmud0/poolpay-web...   "docker-entrypoint.s…"   web        Up (healthy)
```

---

## 6. Method 3: Native Host / PM2 Deployment (Alternative without Docker)

If deploying on a bare-metal server or managed VPS without Docker:

### 1. Prerequisites:
```bash
# Install Node.js 20 LTS and build tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb redis-server
sudo npm install -g pm2 turbo
```

### 2. Install & Build Monorepo:
```bash
cd /home/ubuntu/poolpay
npm ci
npm run build
```

### 3. Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'poolpay-api',
      cwd: './apps/api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_file: '../../.env',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'poolpay-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5001',
      instances: 1,
      env_file: '../../.env',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
  ],
};
```

### 4. Start & Persist PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 7. Mobile App Deployment (Flutter — `derival81`)

The Flutter mobile app located in [`derival81/`](file:///derival81) is maintained independently from the web monorepo.

### Configuration Checklist Before Building:
1. Ensure the API base URL in Flutter points to production:
   `https://api.poolpay.space/api/v1`
2. Place production `google-services.json` inside `derival81/android/app/`.
3. Place production `GoogleService-Info.plist` inside `derival81/ios/Runner/`.

---

### Android Release (Google Play AAB)

#### 1. Setup Keystore:
Create or place your release keystore `key.jks` in `derival81/android/app/key.jks` and configure `derival81/android/key.properties`:
```properties
storePassword=YourKeystorePassword
keyPassword=YourKeyPassword
keyAlias=poolpay
storeFile=key.jks
```

#### 2. Build Android App Bundle:
```bash
cd derival81
flutter clean
flutter pub get
flutter build appbundle --release
```
The output file will be generated at:
`derival81/build/app/outputs/bundle/release/app-release.aab`

Upload this `.aab` file to **Google Play Console → Production / Internal Testing**.

---

### iOS Release (App Store / TestFlight IPA)

#### 1. Requirements:
- macOS with Xcode 15+ installed.
- Apple Developer Account with distribution certificates and provisioning profiles for `com.poolpay.app`.

#### 2. Build iOS Archive:
```bash
cd derival81
flutter clean
flutter pub get
cd ios && pod install && cd ..
flutter build ipa --release
```

#### 3. Upload to App Store Connect:
Use Xcode Organizer or `xcrun altool`:
```bash
xcrun altool --upload-app --type ios \
  -f build/ios/ipa/*.ipa \
  --apiKey YOUR_API_KEY_ID \
  --apiIssuer YOUR_ISSUER_UUID
```

---

## 8. Database Backups & Maintenance

The repository contains an automated backup utility in [`scripts/backup-mongodb.sh`](file:///scripts/backup-mongodb.sh).

### 1. Test Backup Manually:
```bash
cd /home/ubuntu/poolpay
chmod +x scripts/backup-mongodb.sh
./scripts/backup-mongodb.sh
```
This performs a compressed `mongodump` from `poolpay_mongodb_prod` into `/home/ubuntu/poolpay/backups/` and removes backups older than 7 days.

### 2. Setup Daily Automated Cron Job:
Open the crontab editor:
```bash
crontab -e
```
Add the following line to run every day at 02:00 AM:
```cron
0 2 * * * /bin/bash /home/ubuntu/poolpay/scripts/backup-mongodb.sh >> /var/log/poolpay-backup.log 2>&1
```

### 3. Restoring a Backup:
To restore from a backup archive:
```bash
docker exec -i poolpay_mongodb_prod mongorestore \
  --username admin \
  --password "YourMongoPassword" \
  --authenticationDatabase admin \
  --archive --gzip < /home/ubuntu/poolpay/backups/poolpay_db_2026-09-05_020000.gz
```

---

## 9. Operational Monitoring, Logs & Troubleshooting

### Essential Docker Commands:

| Task | Command |
| :--- | :--- |
| **Check container status** | `docker compose -f docker-compose.prod.yml ps` |
| **Stream Backend API logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=100 api` |
| **Stream Frontend Web logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=100 web` |
| **Stream MongoDB logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=50 mongodb` |
| **Stream Redis logs** | `docker compose -f docker-compose.prod.yml logs -f --tail=50 redis` |
| **Restart Backend API** | `docker compose -f docker-compose.prod.yml restart api` |
| **Stop entire stack** | `docker compose -f docker-compose.prod.yml down` |
| **Start entire stack** | `docker compose -f docker-compose.prod.yml up -d` |

### Inspecting Nginx & SSL:
```bash
# View real-time Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Certbot automatic renewal
sudo certbot renew --dry-run
```

---

### Common Troubleshooting Scenarios:

#### 1. Backend container exits with `code 1`:
- **Cause**: Missing mandatory environment variables (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `SUPER_ADMIN_PASSWORD`).
- **Fix**: Check `docker compose -f docker-compose.prod.yml logs api`. Ensure all required keys in `.env` are filled and contain no placeholder values.

#### 2. Nginx returns `502 Bad Gateway`:
- **Cause**: Upstream container on port 5000 or 5001 is still starting or crashed.
- **Fix**: Run `docker compose -f docker-compose.prod.yml ps`. Verify whether `poolpay_api_prod` is `healthy`. If it shows `restarting`, check `docker compose -f docker-compose.prod.yml logs api`.

#### 3. WebSocket / Socket.IO connection drops:
- **Cause**: Proxy timeout or missing HTTP 1.1 upgrade headers.
- **Fix**: Ensure `/etc/nginx/sites-available/poolpay.conf` has `proxy_set_header Upgrade $http_upgrade;` and `proxy_read_timeout 86400s;` in the `location /socket.io/` block.

#### 4. Disk space full from old Docker images:
- **Fix**: Prune unused images and containers:
  ```bash
  docker system prune -af --volumes
  ```
  *(Note: This preserves named volumes like `mongodb_data_prod` and `redis_data_prod`)*.

---

## 10. Production Environment Variables Reference

| Variable | Required | Default / Description |
| :--- | :---: | :--- |
| `NODE_ENV` | Yes | Must be `production` |
| `PORT` | Yes | `5000` (Backend container listening port) |
| `IP` | Yes | `0.0.0.0` |
| `DATABASE_URL` | Yes | `mongodb://admin:<pass>@mongodb:27017/poolPay-db?authSource=admin` |
| `JWT_ACCESS_SECRET` | Yes | 64+ char random string for JWT access tokens |
| `JWT_REFRESH_SECRET` | Yes | 64+ char random string for JWT refresh tokens |
| `JWT_ACCESS_EXPIRES_IN`| No | `1d` |
| `JWT_REFRESH_EXPIRES_IN`| No | `30d` |
| `SUPER_ADMIN_EMAIL` | Yes | Initial Super-Admin email |
| `SUPER_ADMIN_PASSWORD` | Yes | Initial Super-Admin password |
| `FRONTEND_URL` | Yes | `https://poolpay.space` |
| `BACKEND_URL` | Yes | `https://api.poolpay.space` |
| `NEXT_PUBLIC_BASE_URL`| Yes | `https://api.poolpay.space` |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.poolpay.space/api/v1` |
| `STORAGE_PROVIDER` | Yes | `aws` (or `local`, `cloudinary`, `digitalOcean`) |
| `AWS_ACCESS_KEY_ID` | Conditional | Required if `STORAGE_PROVIDER=aws` |
| `AWS_SECRET_ACCESS_KEY`| Conditional| Required if `STORAGE_PROVIDER=aws` |
| `AWS_REGION` | Conditional | S3 bucket region (e.g., `eu-north-1`) |
| `AWS_BUCKET_NAME` | Conditional | S3 bucket name |
| `EMAIL_PROVIDER` | Yes | `resend` (or `smtp`, `ses`) |
| `RESEND_API_KEY` | Conditional | Required if `EMAIL_PROVIDER=resend` |
| `SMTP_FORM` | Yes | Sender email (e.g., `no-reply@poolpay.space`) |
| `REDIS_HOST` | Yes | `redis` (Docker service name) |
| `REDIS_PORT` | Yes | `6379` |
| `STRIPE_LIVE_SECRET_KEY` | Yes | Live Stripe Secret Key (`sk_live_...`) |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Yes | Live Stripe Publishable Key (`pk_live_...`) |
| `STRIPE_LIVE_WEBHOOK_SECRET` | Yes | Live Stripe Webhook Signing Secret |
| `STRIPE_LIVE_CONNECT_WEBHOOK_SECRET` | Yes | Live Stripe Connect Webhook Secret |
| `SMS_ENABLED` | No | `true` to enable Twilio SMS OTP |
| `TWILIO_ACCOUNT_SID`| Conditional | Required if `SMS_ENABLED=true` |
| `TWILIO_AUTH_TOKEN` | Conditional | Required if `SMS_ENABLED=true` |
| `TWILIO_PHONE_NUMBER`| Conditional| Required if `SMS_ENABLED=true` |
| `RATE_LIMITER_ENABLED`| No | `true` (enables Redis rate limiting) |
| `SELF_PING_ENABLED` | No | `true` |

---

## 🎯 Verification Checklist After Deployment

Run these validation commands from your local machine to confirm all services are live:

- [ ] **Backend Health Endpoint**:
  ```bash
  curl -I https://api.poolpay.space/health
  # Must return: HTTP/2 200 OK
  ```
- [ ] **Next.js Web Admin Dashboard**:
  ```bash
  curl -I https://admin.poolpay.space
  # Must return: HTTP/2 200 OK
  ```
- [ ] **Landing / Legal Pages**:
  ```bash
  curl -I https://poolpay.space
  # Must return: HTTP/2 200 OK
  ```
- [ ] **SSL / TLS Certificate Validation**:
  ```bash
  curl -vI https://api.poolpay.space 2>&1 | grep "SSL certificate verify ok"
  ```
- [ ] **Database Connection**:
  Verify in API logs:
  `docker compose -f docker-compose.prod.yml logs api | grep "Database connected"`
- [ ] **Redis Connection**:
  Verify in API logs:
  `docker compose -f docker-compose.prod.yml logs api | grep "Redis connected"`
