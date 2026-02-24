FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./package.json
COPY packages/dashboard/package.json ./packages/dashboard/package.json
RUN mkdir -p packages/agent packages/server packages/cli
RUN echo '{"name":"@closedclaw/agent","version":"1.0.0"}' > packages/agent/package.json
RUN echo '{"name":"@closedclaw/server","version":"1.0.0"}' > packages/server/package.json
RUN echo '{"name":"@closedclaw/cli","version":"0.2.0"}' > packages/cli/package.json
RUN bun install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/dashboard ./packages/dashboard
COPY package.json ./package.json
RUN mkdir -p packages/agent packages/server packages/cli
RUN echo '{"name":"@closedclaw/agent","version":"1.0.0"}' > packages/agent/package.json
RUN echo '{"name":"@closedclaw/server","version":"1.0.0"}' > packages/server/package.json
RUN echo '{"name":"@closedclaw/cli","version":"0.2.0"}' > packages/cli/package.json
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run --filter @closedclaw/dashboard build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/packages/dashboard/public ./packages/dashboard/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/dashboard/.next/static ./packages/dashboard/.next/static
USER nextjs
EXPOSE 3901
ENV PORT=3901
CMD ["node", "packages/dashboard/server.js"]
