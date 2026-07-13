import { CATALOG } from "./catalog";
import { db } from "./index";
import { cakes } from "./schema";

async function main() {
  const existing = await db.select().from(cakes);
  if (existing.length > 0) {
    console.log(
      `Seed ignorado: já existem ${existing.length} bolos. Use "npm run db:reset" para repovoar.`,
    );
    return;
  }
  await db.insert(cakes).values(CATALOG);
  console.log(`✓ Seed: ${CATALOG.length} bolos da Primu's inseridos.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
