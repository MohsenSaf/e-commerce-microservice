# ---------------------------------------------------------------------------
# Dockerfile for: gateway  (no Prisma)
# Place at: gateway/Dockerfile
# Build from repo ROOT:
#   docker build -t $REGISTRY/ecommerce-gateway:$TAG -f gateway/Dockerfile .
# ---------------------------------------------------------------------------

# ---------- Stage 1: install + build ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Root workspace manifests (shared yarn.lock lives here)
COPY package.json yarn.lock ./
COPY gateway/package.json ./gateway/

RUN yarn install --frozen-lockfile

# Bring in full source (workspaces monorepo)
COPY . .

# IMPORTANT: switch into the service folder before build —
# without this, yarn build runs against the ROOT package.json (no "build" script there)
WORKDIR /app/gateway
RUN yarn build

# ---------- Stage 2: lean runtime image ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Hoisted node_modules from the workspace root
COPY --from=builder /app/node_modules ./node_modules

# Built output + manifest for this service only
COPY --from=builder /app/gateway/dist ./gateway/dist
COPY --from=builder /app/gateway/package.json ./gateway/package.json

WORKDIR /app/gateway

EXPOSE 3000

CMD ["node", "dist/main.js"]
