# Stage 1: Install dependencies
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Production
FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
