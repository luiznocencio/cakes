import { db, isLocalDb } from "./index";

/**
 * Aplica as migrações geradas em ./drizzle usando o migrator do driver ativo.
 * Rode `npm run db:generate` antes, sempre que o schema mudar.
 */
async function main() {
  const migrationsFolder = "./drizzle";
  if (isLocalDb) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder });
  }
  console.log(`✓ Migrações aplicadas (${isLocalDb ? "PGlite local" : "Neon"})`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
