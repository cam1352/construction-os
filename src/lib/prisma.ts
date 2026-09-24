import { PrismaClient } from "@prisma/client";

/**
 * Global cache interface to preserve PrismaClient singleton across Hot Module Replacement (HMR)
 * and prevent connection exhaustion in development and multi-agent worker pools.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasConfigured?: boolean;
};

/**
 * Configure SQLite engine PRAGMAs for high-concurrency multi-agent environments:
 * 1. journal_mode = WAL: Write-Ahead Logging allows concurrent readers during active writes.
 * 2. busy_timeout = 10000: Queues pending write transactions up to 10,000ms before raising SQLITE_BUSY.
 * 3. synchronous = NORMAL: Maximizes write throughput in WAL mode without sacrificing crash safety.
 * 4. foreign_keys = ON: Enforces relational constraints and cascading rules at the storage engine level.
 *
 * For PostgreSQL in production, PRAGMA statements are gracefully skipped.
 */
export async function configureSqlitePragmas(client: PrismaClient): Promise<void> {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isSqlite = dbUrl.startsWith("file:") || dbUrl.includes(".db") || !dbUrl.startsWith("postgres");

  if (!isSqlite) {
    return;
  }

  try {
    // Note: Use $queryRawUnsafe because PRAGMA statements in SQLite return result rows
    await client.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await client.$queryRawUnsafe("PRAGMA busy_timeout = 10000;");
    await client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    await client.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
    globalForPrisma.sqlitePragmasConfigured = true;
  } catch (error) {
    // Non-fatal notice if executed before database initialization/migration
    console.warn("Notice: SQLite PRAGMA initialization deferred or failed:", error);
  }
}

/**
 * Instantiates and exports the singleton PrismaClient.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Auto-initialize SQLite PRAGMAs on client instantiation in server runtime
if (!globalForPrisma.sqlitePragmasConfigured) {
  configureSqlitePragmas(prisma).catch(() => {});
}

export default prisma;
