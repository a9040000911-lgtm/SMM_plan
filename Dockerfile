# syntax=docker/dockerfile:1

FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl libc6 && rm -rf /var/lib/apt/lists/*
ENV PRISMA_CLIENT_ENGINE_TYPE=library

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Use cache mount for npm and install with legacy-peer-deps to handle conflicts
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --legacy-peer-deps

# Stage 2: Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Arguments for Next.js (Client-side envs)
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Optimized heap size for build
ENV NODE_OPTIONS="--max-old-space-size=6144"
# Dummy envs to prevent next build crash (Static Generation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV REDIS_URL="redis://localhost:6379"
ENV IS_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_LOCAL_WEBPACK_WORKERS=1

# Generate Prisma Client (uses cached node_modules)
RUN npx prisma generate
RUN npm run prisma:patch

# Build Next.js with resource limits and disable Turbopack for stability in Docker
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_LOCAL_WEBPACK_WORKERS=1
ENV IS_BUILD=true
ENV NO_REDIS_CONNECTION=true
# Disable Turbopack for production build to avoid Tailwind 4 / Linux crashes
RUN npm run build -- --no-turbo

# Stage 3: Bot production runner (Optimized)
FROM base AS bot-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/package.json ./
CMD ["npx", "tsx", "src/bot/index.ts"]

# Stage 4: App production runner (Slim standalone)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Ensure static files are accessible for volume mounting in Nginx
# We explicitly copy them to a known path that will be used for volumes
RUN mkdir -p /app/static-out/_next && \
    cp -r ./.next/static /app/static-out/_next/static && \
    cp -r ./public /app/static-out/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]