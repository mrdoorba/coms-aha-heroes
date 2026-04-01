# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun --bun run build

# Stage 3: Production runner (minimal image)
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
EXPOSE 8080
CMD ["bun", "run", ".output/server/index.mjs"]
