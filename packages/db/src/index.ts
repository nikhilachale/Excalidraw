import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// @ts-ignore - runtime cache key on globalThis
export const prismaClient = globalForPrisma.__prismaClient__ || new PrismaClient();

// @ts-ignore - runtime cache key on globalThis
if (!globalForPrisma.__prismaClient__) {
	// @ts-ignore - runtime cache key on globalThis
	globalForPrisma.__prismaClient__ = prismaClient;
}

// Export transaction utilities
export * from './transactions.js';