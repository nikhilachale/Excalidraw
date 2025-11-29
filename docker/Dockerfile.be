FROM node:22-alpine AS base



# Install build dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install both npm (latest) and pnpm globally
RUN npm install -g npm@11.6.2 pnpm@9.12.0




# Install both npm (latest) and pnpm globally
RUN npm install -g npm@11.6.2 pnpm@9.12.0

# Copy full repo
COPY . .

# Install dependencies from root to resolve all workspaces
RUN pnpm install --frozen-lockfile


# Regenerate Prisma Client inside the Linux environment for correct binary
WORKDIR /app/packages/db
RUN pnpm prisma generate
# Move to backend app

WORKDIR /app/apps/backend



# Build the TypeScript app
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 8080

# Start the app
CMD ["pnpm", "start"]
