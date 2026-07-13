import { CATALOG } from "./catalog";
import { db } from "./index";
import { cakes, notifications, stockEvents, waitlist } from "./schema";

/** Limpa todas as tabelas e repovoa com o catálogo real. Só para dev. */
async function main() {
  await db.delete(notifications);
  await db.delete(waitlist);
  await db.delete(stockEvents);
  await db.delete(cakes);
  await db.insert(cakes).values(CATALOG);
  console.log(`✓ Reset: ${CATALOG.length} bolos da Primu's (estoque zerado).`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
