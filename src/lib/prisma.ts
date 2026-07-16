import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolve } from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || "";

  if (databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("https://")) {
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const adapter = new PrismaLibSql({ url: databaseUrl, authToken });
    return new PrismaClient({ adapter });
  }

  const dbPath = resolve("dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
