# Excalidraw Monorepo

Collaborative drawing application built with Turborepo, Next.js, Express, WebSocket, and Prisma.

## Stack

- Frontend: Next.js 15, React 19, Tailwind CSS 4
- Backend API: Express + TypeScript
- Realtime: ws WebSocket server
- Database: PostgreSQL + Prisma
- Tooling: pnpm workspaces + Turborepo

## Monorepo Structure

### Apps

- apps/ui: Next.js application (default local port 4002)
- apps/backend: REST API server (port 3001)
- apps/websocket: realtime collaboration server (port 8080 by default)

### Shared packages

- packages/db: Prisma client and schema
- packages/common: shared Zod/types
- packages/common-backend: backend shared constants/config
- packages/eslint-config: ESLint config package
- packages/typescript-config: TypeScript config package
- packages/ui: shared UI primitives

## Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database

## Environment Variables

This repo includes .env.example at the root.

1. Copy .env.example to .env.local for UI-focused local env.
2. Ensure DATABASE_URL is set for Prisma-backed services.
3. Set JWT_SECRET for backend and websocket auth.

Common values used by this project:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace-with-a-strong-secret
PORT=8080
```

## Install

```bash
pnpm install
```

## Database Setup

Run Prisma migrations before starting backend/websocket services.

```bash
pnpm --filter @repo/db exec prisma migrate deploy
pnpm --filter @repo/db exec prisma generate
```

For local development with schema changes:

```bash
pnpm --filter @repo/db exec prisma migrate dev
```

## Build and Run

### 1. Build all packages/apps

```bash
pnpm build
```

### 2. Start all apps

```bash
pnpm dev
```

Important: apps/backend and apps/websocket dev scripts run compiled output from dist. If dist is missing, run pnpm build first.

## Useful Workspace Commands

```bash
pnpm build
pnpm dev
pnpm lint
pnpm check-types
pnpm format
```

Target a specific workspace:

```bash
pnpm --filter ui dev
pnpm --filter backend build
pnpm --filter websocket build
```

## API and Realtime Notes

- UI connects to backend using NEXT_PUBLIC_BACKEND_URL.
- UI connects to websocket URL based on NODE_ENV:
	- development: ws://localhost:8080
	- production: wss://canvas-ws.onrender.com
- Backend default port is 3001.

## Troubleshooting

### UI cannot connect to backend

- Verify NEXT_PUBLIC_BACKEND_URL points to http://localhost:3001 for local runs.
- Check backend is running and CORS origin includes your UI origin.

### WebSocket connection fails

- Ensure websocket server is running on port 8080 (or PORT value).
- Confirm JWT token is present and valid.

### Runtime errors for missing dist

- Run pnpm build before pnpm dev.

## Deployment

Dockerfiles are available in docker/:

- docker/Dockerfile.ui
- docker/Dockerfile.be
- docker/Dockerfile.ws
