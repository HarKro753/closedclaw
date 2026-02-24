FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./packages/server/package.json
COPY packages/server/package.json ./packages/server/package.json
COPY packages/agent/package.json ./packages/agent/package.json
RUN cd /app && npm install --workspace=packages/server --workspace=packages/agent

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=deps /app/packages/agent/node_modules ./packages/agent/node_modules
COPY packages/agent ./packages/agent
COPY packages/server ./packages/server
COPY tsconfig.json ./tsconfig.json
COPY package.json ./package.json
RUN npm run build -w packages/agent && npm run build -w packages/server

FROM base AS runner
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/agent/dist ./packages/agent/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/package.json
COPY --from=builder /app/packages/agent/package.json ./packages/agent/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /app/data/agents
EXPOSE 3900
CMD ["node", "packages/server/dist/index.js"]
