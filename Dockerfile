# (c) 2024-2026 Smmplan. All rights reserved.

# STAGE 1: Deps
FROM node:22-slim AS deps
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

# STAGE 2: Builder
FROM node:22-slim AS builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION true
ENV IS_BUILD true

# Patch prisma enums if needed and build
RUN npx prisma generate
RUN npm run build

# STAGE 3: Runner
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd -r -g 1001 nodejs
RUN useradd -r -u 1001 -g 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/generated/client ./src/generated/client
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]

# STAGE 4: Bot Runner
FROM node:22-slim AS bot-runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated/client ./src/generated/client
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma

CMD ["npx", "tsx", "src/bot/index.ts"]