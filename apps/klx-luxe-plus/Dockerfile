# Multi-stage build for @repo/klx-luxe-plus (Next.js Application)
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy workspace package manifests
COPY package.json package-lock.json turbo.json ./
COPY apps/admin/package.json ./apps/admin/
COPY apps/backend/package.json ./apps/backend/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/klx-luxe-plus/package.json ./apps/klx-luxe-plus/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/validators/package.json ./packages/validators/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages/ ./packages/
COPY apps/klx-luxe-plus/ ./apps/klx-luxe-plus/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js app
RUN npx turbo build --filter=@repo/klx-luxe-plus

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5002
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
RUN mkdir -p /app/media && chown nextjs:nodejs /app/media

# Copy standalone build and static assets
COPY --from=builder /app/apps/klx-luxe-plus/public ./apps/klx-luxe-plus/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/klx-luxe-plus/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/klx-luxe-plus/.next/static ./apps/klx-luxe-plus/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/klx-luxe-plus/.next/ops ./ops

USER nextjs

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5002/api/health').then(r => (r.status === 200) ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "apps/klx-luxe-plus/server.js"]
