import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll } from "vitest";

// Banco PGlite isolado para os testes (fresco a cada execução).
const dir = path.join(os.tmpdir(), "avisa-vitest-pglite");
fs.rmSync(dir, { recursive: true, force: true });
process.env.PGLITE_DIR = dir;
process.env.NOTIFY_PROVIDER = "assisted";
process.env.STORE_NAME = "Padaria Teste";
delete process.env.DATABASE_URL;

beforeAll(async () => {
  const { db } = await import("@/db");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "./drizzle" });
});
