# ---------------------------------------------------------------------------
# Dockerfile for: microservice-order  (Prisma-based service)
# Place at: microservice-order/Dockerfile
# Build from repo ROOT:
#   docker build -t $REGISTRY/ecommerce-order:$TAG -f microservice-order/Dockerfile .
# ---------------------------------------------------------------------------

# ---------- Stage 1: install + build ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Root workspace manifests (shared yarn.lock lives here)
COPY package.json yarn.lock ./
COPY microservice-order/package.json ./microservice-order/

RUN yarn install --frozen-lockfile

# Bring in full source (workspaces monorepo) — needed so prisma schema
# and every service source file is present before we switch WORKDIR
COPY . .

# IMPORTANT: switch into the service folder before prisma/build —
# without this, both commands run against /app (root), which has no
# "build" script and no prisma/schema.prisma of its own.
WORKDIR /app/microservice-order

RUN npx prisma generate
RUN yarn build

# ---------- Stage 2: lean runtime image ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Hoisted node_modules from the workspace root — this is where the
# generated Prisma client (.prisma/client) lives in a yarn workspaces setup
COPY --from=builder /app/node_modules ./node_modules

# Built output + manifest + schema for this service only
COPY --from=builder /app/microservice-order/dist ./microservice-order/dist
COPY --from=builder /app/microservice-order/package.json ./microservice-order/package.json
COPY --from=builder /app/microservice-order/prisma ./microservice-order/prisma

WORKDIR /app/microservice-order

EXPOSE 4005

CMD ["node", "dist/main.js"]
