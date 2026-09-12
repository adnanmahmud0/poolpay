# 🚀 Derival81 / PoolPay Full-Stack Turborepo

A production-ready full-stack monorepo powered by **[Turborepo](https://turbo.build/repo)**, featuring **Next.js 16 (React 19, Tailwind CSS 4, Radix UI)** on the frontend dashboard, **Express.js (TypeScript, MongoDB / Mongoose, Redis / BullMQ, Socket.IO)** on the backend API, shared workspace packages (`@repo/tsconfig`, `@repo/eslint-config`, `@repo/types`, `@repo/validators`, `@repo/ui`), containerized **Docker MongoDB & Mongo-Express**, and an **independent Flutter Mobile App**.

---

## 🏗️ Architecture & Structure

```
derival81/
├── apps/
│   ├── web/                         # Next.js 16 Dashboard Frontend (@repo/web)
│   │   ├── app/                     # App router pages (dashboard, auth, etc.)
│   │   ├── components/              # UI components, tables, charts, dialogs
│   │   ├── context/                 # Auth & state contexts
│   │   ├── lib/                     # Axios instance, API clients & helpers
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── api/                         # Express.js + MongoDB/Mongoose Backend (@repo/api)
│       ├── src/
│       │   ├── app/                 # 21 feature modules, schedulers, queues, socket
│       │   ├── server.ts            # Entry point & socket initialization
│       │   └── app.ts               # Express configuration & routes
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/                        # Shared Workspace Packages
│   ├── tsconfig/                    # @repo/tsconfig (base, nextjs, react-library configs)
│   ├── eslint-config/               # @repo/eslint-config (base & next ESLint configs)
│   ├── types/                       # @repo/types (shared TypeScript interfaces & DTOs)
│   ├── validators/                  # @repo/validators (shared Zod schemas)
│   └── ui/                          # @repo/ui (shared React/Tailwind component library)
│
├── derival81/                       # 📱 Flutter Mobile App (STANDALONE - NOT UNDER TURBOREPO)
│   ├── android/
│   ├── ios/
│   ├── lib/                         # Mobile screens, controllers, services
│   ├── pubspec.yaml
│   └── .git/                        # Preserves remote: https://github.com/sesakilhossen302/derival81.git
│
├── .agent/                          # AI agent rules (Antigravity / Claude Code)
├── .cursor/                         # Cursor IDE agent rules
├── .github/                         # GitHub Copilot & CI instructions
├── .husky/                          # Pre-commit & commit-msg Git hooks
├── .gitignore                       # Monorepo-wide gitignore (ignores derival81/, dist, .next)
├── commitlint.config.js             # Conventional commit rules
├── docker-compose.yml               # MongoDB (27017) + Mongo-Express (8081)
├── package.json                     # Root npm workspaces manifest & scripts
├── prettier.config.js               # Unified Prettier formatting config
└── turbo.json                       # Turborepo task pipeline & caching
```

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js**: `v20.x` or later (v22 recommended)
- **npm**: `v9.x` or later
- **Docker**: Docker Desktop or Docker engine (for local MongoDB & Mongo-Express)
- **Flutter SDK**: `^3.11.1` (for mobile app development only)

### 2. Start Docker Database (MongoDB)

Spin up MongoDB and the Mongo-Express database viewer in the background:

```bash
npm run docker:up
```

- **MongoDB Server**: `mongodb://localhost:27017/poolPay-db`
- **Mongo Express Web UI**: [http://localhost:8081](http://localhost:8081)

### 3. Install Workspace Dependencies

Install dependencies for all monorepo workspaces (`apps/*` and `packages/*`):

```bash
npm install
```

### 4. Configure Environment Variables

- **Frontend**: Copy `apps/web/.env.example` to `apps/web/.env.local`:
  ```bash
  NEXT_PUBLIC_BASE_URL=http://localhost:5000/api/v1
  NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
  ```

- **Backend**: Copy `apps/api/.env.example` to `apps/api/.env` and verify database URL:
  ```bash
  DATABASE_URL=mongodb://localhost:27017/poolPay-db
  PORT=5000
  ```

### 5. Start Development Servers

Run **both** Next.js dashboard and Express API concurrently with live-reloading:

```bash
npm run dev
```

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Database Viewer**: [http://localhost:8081](http://localhost:8081)

---

## 📱 Flutter Mobile App Workflow

The Flutter app in [`derival81/`](derival81) is maintained as an **independent Git clone** connected to its collaborator repository (`https://github.com/sesakilhossen302/derival81.git`).

It is explicitly **isolated** from Turborepo tasks and npm workspaces so that mobile development and collaborator pull/push workflows remain 100% unaffected.

### Running the Mobile App:
```bash
cd derival81
flutter pub get
flutter run
```

Or run via the root convenience shortcut:
```bash
npm run app:run
```

---

## 📜 Available Scripts

| Command                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev`           | Starts **both** Web (Next.js) & API (Express with `tsx`) concurrently |
| `npm run dev:web`       | Starts **only** the Next.js frontend dev server (`:3000`)             |
| `npm run dev:api`       | Starts **only** the Express backend dev server (`:5000`)              |
| `npm run build`         | Builds all packages and apps with Turborepo caching (`dist/`, `.next/`) |
| `npm run build:web`     | Builds **only** the Next.js frontend production bundle                |
| `npm run build:api`     | Compiles **only** the Express.js backend via `tsup` to `dist/`        |
| `npm run typecheck`     | Validates TypeScript across all apps and packages                     |
| `npm run lint`          | Runs ESLint across all workspaces                                     |
| `npm run format`        | Formats all files across the monorepo using Prettier                  |
| `npm run docker:up`     | Starts MongoDB & Mongo-Express via Docker Compose                     |
| `npm run docker:down`   | Stops Docker database containers                                      |
| `npm run docker:logs`   | Streams logs from the MongoDB Docker container                        |
| `npm run clean`         | Cleans build caches, `.next`, `dist`, and Turborepo caches            |

---

## 📦 Shared Workspace Packages

| Package               | Purpose                                        | Import Example                                          |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `@repo/tsconfig`      | Shared base, Next.js, and React tsconfig files | `"extends": "@repo/tsconfig/nextjs.json"`               |
| `@repo/eslint-config` | Shared ESLint configurations                   | `import baseConfig from "@repo/eslint-config/base"`     |
| `@repo/types`         | Shared TypeScript interfaces & DTOs            | `import type { ApiResponse, IUser } from "@repo/types"` |
| `@repo/validators`    | Shared Zod validation schemas                  | `import { loginSchema } from "@repo/validators"`        |
| `@repo/ui`            | Shared React component library                 | `import { Button } from "@repo/ui"`                     |

---

## 🚢 Production Deployment

For complete, step-by-step instructions on deploying the full-stack monorepo (Express API, Next.js Dashboard, MongoDB, Redis, Nginx with SSL) via automated GitHub Actions CI/CD or manual Docker Compose, plus Flutter Mobile app release builds, refer to the [Production Deployment Guide](DEPLOYMENT_GUIDE.md).

