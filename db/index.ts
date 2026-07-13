import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * Seleção de driver por ambiente, mantendo o mesmo dialeto Postgres:
 * - Produção (Vercel): Neon serverless HTTP quando `DATABASE_URL` existe.
 * - Dev/local: PGlite (Postgres embutido), persistido no home do usuário.
 *   Zero dependência externa para desenvolver e testar.
 *
 * Ambos os drivers expõem a mesma API de query do drizzle-pg-core, então
 * tipamos como PgliteDatabase e fazemos cast do driver Neon.
 */
export type DrizzleDb = PgliteDatabase<typeof schema>;

function buildDb(): DrizzleDb {
  const url = process.env.DATABASE_URL;

  if (url) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-http");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    return drizzle(neon(url), { schema }) as unknown as DrizzleDb;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mkdirSync } = require("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const os = require("node:os");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path");
  // Caminho ABSOLUTO e sem caracteres especiais: o PGlite resolve dir relativo
  // contra o cwd, e um cwd com '#'/espaços quebra o parsing de path dele.
  const dataDir =
    process.env.PGLITE_DIR ?? path.join(os.homedir(), ".avisa-bolo", "pglite");
  mkdirSync(dataDir, { recursive: true });
  return drizzle(new PGlite(dataDir), { schema }) as unknown as DrizzleDb;
}

// Singleton entre hot-reloads do Next e entre imports em scripts.
const globalForDb = globalThis as unknown as { __db?: DrizzleDb };

function getDb(): DrizzleDb {
  if (globalForDb.__db) return globalForDb.__db;
  const built = buildDb();
  // Em produção (Neon) o cliente é barato; ainda assim reaproveitamos.
  globalForDb.__db = built;
  return built;
}

/**
 * Proxy lazy: o driver só é construído no primeiro uso real (uma query),
 * não no import. Assim páginas estáticas que apenas importam módulos com `db`
 * não instanciam o PGlite durante o build.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const real = getDb() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const isLocalDb = !process.env.DATABASE_URL;
export * from "./schema";
