FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./package.json
COPY packages/server/package.json ./packages/server/package.json
RUN bun install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/server ./packages/server
COPY tsconfig.json ./tsconfig.json
COPY package.json ./package.json
RUN bun run --filter @closedclaw/server build

FROM base AS runner
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /app/data/agents
EXPOSE 3900
CMD ["bun", "packages/server/dist/index.js"]
