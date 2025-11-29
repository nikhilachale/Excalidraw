FROM node:22-alpine3.18

# Set working directory
WORKDIR /app

# Update OS packages and install runtime/build dependencies
RUN apk --no-cache upgrade && \
	apk add --no-cache libc6-compat

# Enable corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy workspace manifests first for caching
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/websocket/package.json ./apps/websocket/
COPY packages/db/package.json ./packages/db/

# Copy full repository
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client (if you use Prisma)
WORKDIR /app/packages/db
RUN pnpm prisma generate || true

# Build websocket app
WORKDIR /app/apps/websocket
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm run build

# Runtime env
ENV NODE_ENV=production
ENV PORT=3003
ENV HOST=0.0.0.0

EXPOSE 3003

# Start the app (runs in apps/websocket)
CMD ["pnpm", "start"]
