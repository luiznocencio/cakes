/**
 * Roda antes do `next build`. Em produção (Vercel, com DATABASE_URL do Neon)
 * aplica as migrações e faz o seed idempotente do catálogo. Em dev (sem
 * DATABASE_URL) não faz nada — o app usa PGlite local.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("prebuild-db: sem DATABASE_URL — pulando (dev usa PGlite).");
    return;
  }
  const { db } = await import("../db/index");
  const { cakes } = await import("../db/schema");
  const { CATALOG } = await import("../db/catalog");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "./drizzle" });
  console.log("prebuild-db: migrações aplicadas (Neon).");

  const existing = await db.select().from(cakes);
  if (existing.length === 0) {
    await db.insert(cakes).values(CATALOG);
    console.log(`prebuild-db: seed de ${CATALOG.length} bolos.`);
  } else {
    console.log(`prebuild-db: ${existing.length} bolos já existem — seed pulado.`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("prebuild-db falhou:", err);
    process.exit(1);
  },
);
