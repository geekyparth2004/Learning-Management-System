import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Hyperdrive connection string is injected into process.env.HYPERDRIVE or DATABASE_URL in production.
const connectionString = process.env.HYPERDRIVE || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Database connection string not found (DATABASE_URL or HYPERDRIVE).");
}

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === "production") {
    // In production, instantiate with pg pool for Cloudflare Hyperdrive connection pooling
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prismaClient = new PrismaClient({ adapter });
} else {
    // In development, cache the instance globally to prevent exhausting connections during hot-reloads
    if (!globalForPrisma.prisma) {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    prismaClient = globalForPrisma.prisma;
}

export const db = prismaClient;

