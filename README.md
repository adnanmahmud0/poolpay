# 🚀 PoolPay Full-Stack Turborepo

A production-grade full-stack monorepo powered by **[Turborepo](https://turbo.build/repo)**, featuring **Next.js 16 (React 19, Tailwind CSS 4, Radix UI)** on the admin dashboard, **Express.js (TypeScript, MongoDB / Mongoose, Redis / BullMQ, Socket.IO)** on the backend API, shared workspace packages (`@repo/tsconfig`, `@repo/eslint-config`, `@repo/types`, `@repo/validators`, `@repo/ui`), containerized **Docker MongoDB & Redis**, and a fully integrated **Flutter Cross-Platform Mobile App**.

---

## 🏗️ Architecture & Structure

```text
derival81/
├── .github/                         # CI/CD workflows (5-stage zero-manual-SSH deploy)
│   └── workflows/
│       └── deploy.yml               # Automated bootstrap, typecheck, builds, deploy & SSL
│
├── apps/                            # Deployable applications
│   ├── admin/                       # Next.js 16 Dashboard Frontend (@repo/admin, port 3000/5001)
│   │   ├── app/                     # App router pages (dashboard, auth, legal, settings)
│   │   ├── components/              # UI components, tables, charts, dialogs
│   │   ├── context/                 # Auth & state contexts
│   │   ├── lib/                     # Axios instance, API clients & helpers
│   │   ├── package.json             # Manifest & scripts (@repo/admin)
│   │   ├── tsconfig.json            # Extends @repo/tsconfig/nextjs.json
│   │   ├── Dockerfile               # Multi-stage standalone Next.js container (~120MB)
│   │   └── .env.example
│   │
│   ├── backend/                     # Express.js + MongoDB/Mongoose Backend (@repo/backend, port 5000)
│   │   ├── src/
│   │   │   ├── app/                 # 21 feature modules, schedulers, workers, socket
│   │   │   ├── server.ts            # Entry point & socket initialization
│   │   │   └── app.ts               # Express configuration & routes
│   │   ├── package.json             # Backend dependencies & tsup compilation
│   │   ├── tsconfig.json            # Extends @repo/tsconfig/base.json
│   │   ├── Dockerfile               # Multi-stage production container
│   │   └── .env.example
│   │
│   └── mobile/                      # 📱 Flutter Cross-Platform Mobile App (@repo/mobile)
│       ├── android/                 # Native Android configuration & Gradle
│       ├── ios/                     # Native iOS configuration & CocoaPods
│       ├── lib/                     # Flutter screens, controllers, services
│       ├── assets/                  # Icons, images, fonts
│       ├── package.json             # Turborepo wrapper scripts (dev, build, lint, clean)
│       ├── pubspec.yaml             # Flutter dependencies & assets
│       └── analysis_options.yaml    # Dart / Flutter linting rules
│
├── packages/                        # Shared Workspace Packages
│   ├── tsconfig/                    # @repo/tsconfig (base, nextjs, react-library)
│   ├── eslint-config/               # @repo/eslint-config (base & next ESLint configs)
│   ├── types/                       # @repo/types (shared TypeScript interfaces & DTOs)
│   ├── validators/                  # @repo/validators (shared Zod schemas)
│   └── ui/                          # @repo/ui (shared React/Tailwind component library)
│
├── deploy/                          # Production deployment scripts
│   └── deploy.sh                    # Zero-downtime deployment & healthcheck script
├── nginx/                           # Reverse proxy configuration
│   └── poolpay.conf                 # Multi-domain Nginx SSL & WebSocket proxy
├── scripts/                         # Database setup & automated backup scripts
│   ├── mongo-init.js                # MongoDB initial user & database script
│   └── backup-mongodb.sh            # Automated daily backup cron script
│
├── .agent/                          # AI agent instructions & rules
├── .cursor/                         # Cursor IDE configuration
├── .husky/                          # Pre-commit & commit-msg Git hooks
├── .gitignore                       # Clean monorepo gitignore rules
├── commitlint.config.js             # Conventional commit rules
├── docker-compose.prod.yml          # Production containers (Mongo with cache cap, Redis, Backend, Admin)
├── docker-compose.yml               # Local development MongoDB & Mongo-Express
├── package.json                     # Root npm workspaces manifest & orchestrator scripts
├── prettier.config.js               # Unified Prettier formatting config
└── turbo.json                       # Turborepo task pipeline & caching
```

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js**: `v20.x` or later (v22 recommended)
- **npm**: `v9.x` or later
- **Docker**: Docker Desktop or Docker engine
- **Flutter SDK**: `^3.24.x` (for mobile app development only)

### 2. Start Docker Database (MongoDB & Redis)

Spin up MongoDB and the Mongo-Express database viewer for local development:

```bash
npm run docker:up
```

- **MongoDB Server**: `mongodb://localhost:27017/poolPay-db`
- **Mongo Express Web UI**: [http://localhost:8081](http://localhost:8081)

### 3. Install Workspace Dependencies

Install dependencies across all workspaces (`apps/*` and `packages/*`):

```bash
npm install
```

### 4. Configure Environment Variables

- **Admin Dashboard**: Copy `apps/admin/.env.example` to `apps/admin/.env.local`:

  ```bash
  NEXT_PUBLIC_BASE_URL=http://localhost:5000/api/v1
  NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
  ```

- **Backend API**: Copy `apps/backend/.env.example` to `apps/backend/.env`:
  ```bash
  DATABASE_URL=mongodb://localhost:27017/poolPay-db
  PORT=5000
  ```

### 5. Start Development Servers

Run **both** Next.js dashboard and Express API concurrently with live-reloading:

```bash
npm run dev
```

Or run individual apps:

```bash
npm run backend   # Starts only Express API (:5000)
npm run admin     # Starts only Next.js Admin (:5001 / :3000)
npm run mobile    # Runs Flutter mobile app
```

- **Admin Dashboard**: [http://localhost:5001](http://localhost:5001)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database Viewer**: [http://localhost:8081](http://localhost:8081)

---

## 📜 Available Scripts

| Command                                   | Description                                                        |
| :---------------------------------------- | :----------------------------------------------------------------- |
| `npm run dev`                             | Starts **both** Admin (Next.js) & Backend (Express) concurrently   |
| `npm run backend` / `npm run dev:backend` | Starts **only** the Express backend API (`:5000`)                  |
| `npm run admin` / `npm run dev:admin`     | Starts **only** the Next.js admin dashboard (`:5001`)              |
| `npm run mobile` / `npm run dev:mobile`   | Launches the Flutter mobile application                            |
| `npm run build`                           | Builds all packages and applications with Turborepo caching        |
| `npm run build:backend`                   | Compiles **only** Express.js backend via `tsup` to `dist/`         |
| `npm run build:admin`                     | Builds **only** Next.js admin production standalone bundle         |
| `npm run build:mobile`                    | Builds Android release APK for the mobile application              |
| `npm run typecheck`                       | Validates TypeScript across all workspaces (`npx turbo typecheck`) |
| `npm run lint`                            | Runs ESLint across all workspaces                                  |
| `npm run format`                          | Formats all files across the monorepo using Prettier               |
| `npm run clean`                           | Cleans `.next`, `dist`, Flutter caches, and Turborepo caches       |
| `npm run docker:up`                       | Starts local MongoDB & Mongo-Express containers                    |
| `npm run docker:down`                     | Stops local Docker containers                                      |

---

## 🚢 Production CI/CD Pipeline

The project features a **5-stage Zero-Manual-SSH deployment pipeline** via GitHub Actions (`.github/workflows/deploy.yml`):

1. **Stage 0: Bootstrap Server** — Idempotently configures 2GB RAM swap, installs Docker, Nginx, Certbot, sets up MongoDB with a 256MB memory cap, and configures daily database backup cron.
2. **Stage 1: Monorepo Type Check** — Validates TypeScript across all apps before any containers are built.
3. **Stage 2: Parallel Builds** — Builds and pushes Docker images to GitHub Container Registry (`ghcr.io`) for backend and admin, and compiles the release Android APK as a downloadable GitHub artifact.
4. **Stage 3: Zero-Downtime Deployment** — Performs health-verified deployment with automatic rollback on failure.
5. **Stage 4: Automated SSL & Health Check** — Automatically issues Let's Encrypt HTTPS certificates for `poolpay.space`, `www.poolpay.space`, `api.poolpay.space`, and `admin.poolpay.space`.

For full deployment documentation, see [CICD.md](CICD.md).
