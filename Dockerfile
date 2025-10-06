# Multi-stage Dockerfile for Next.js + Prisma
# Uses Debian-based Node image for Prisma compatibility

FROM node:18-bullseye-slim AS deps
WORKDIR /app

# Copy package manifest and Prisma schema before installing so postinstall can run prisma generate
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies (postinstall may run prisma generate)
RUN npm ci --no-audit --no-fund

FROM node:18-bullseye-slim AS builder
WORKDIR /app

# Reuse already-installed node_modules for faster builds
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (requires DATABASE_URL only for migrate, but generate works without DB)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the Next.js app
RUN npm run build

FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules
COPY --from=builder /app .

# Install only production dependencies (safety)
RUN npm ci --production --no-audit --no-fund

EXPOSE 3000

# Ensure the entrypoint script runs migrations (if DATABASE_URL is present) then starts the app
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
