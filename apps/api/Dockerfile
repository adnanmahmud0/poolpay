# Multi-stage build for @repo/api
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy workspace package manifests
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build backend using tsup/turbo
RUN npx turbo build --filter=@repo/api

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy root package.json and packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/public ./apps/api/public
COPY --from=builder /app/apps/api/src/app/views ./apps/api/src/app/views

USER expressjs

EXPOSE 5000

CMD ["node", "apps/api/dist/server.js"]
