import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cakes, stockEvents, type Cake, type StockEventType } from "@/db/schema";
import { enqueueBackInStock } from "@/lib/notifications";

export type StockChange = {
  cakeId: number;
  oldQty: number;
  newQty: number;
  delta: number;
  type: StockEventType;
  triggeredNotifications: boolean;
};

type ApplyOpts = { by?: string; notify?: boolean };

/**
 * Aplica uma mudança de estoque de forma atômica o suficiente para o MVP
 * (um único balcão, baixa concorrência): atualiza a quantidade, registra o
 * evento e, se o bolo voltou do zero, dispara os avisos.
 *
 * Passe `delta` (relativo, ex.: -1 venda, +5 fornada) OU `set` (valor exato).
 * Vendas nunca deixam a quantidade negativa.
 */
async function applyStock(
  cakeId: number,
  change: { delta?: number; set?: number },
  type: StockEventType,
  opts: ApplyOpts = {},
): Promise<StockChange> {
  const [cake] = await db.select().from(cakes).where(eq(cakes.id, cakeId));
  if (!cake) throw new Error("Bolo não encontrado");

  const oldQty = cake.quantity;
  let newQty =
    change.set !== undefined ? change.set : oldQty + (change.delta ?? 0);
  if (newQty < 0) newQty = 0;
  const delta = newQty - oldQty;

  if (delta !== 0) {
    await db
      .update(cakes)
      .set({ quantity: newQty })
      .where(eq(cakes.id, cakeId));
    await db
      .insert(stockEvents)
      .values({ cakeId, delta, type, createdBy: opts.by ?? null });
  }

  const triggered = opts.notify !== false && oldQty === 0 && newQty > 0;
  if (triggered) {
    await enqueueBackInStock(cakeId);
  }

  return { cakeId, oldQty, newQty, delta, type, triggeredNotifications: triggered };
}

/** −1 por venda (o toque mais frequente do dia). */
export const sellOne = (cakeId: number, by?: string) =>
  applyStock(cakeId, { delta: -1 }, "venda", { by });

/** +1 correção rápida. */
export const addOne = (cakeId: number, by?: string) =>
  applyStock(cakeId, { delta: +1 }, "reabastecimento", { by });

/** Nova fornada do dia: adiciona N. */
export const bake = (cakeId: number, qty: number, by?: string) =>
  applyStock(cakeId, { delta: Math.abs(qty) }, "fornada", { by });

/** Reabastecimento durante o dia: adiciona N (dispara avisos se voltou do 0). */
export const restock = (cakeId: number, qty: number, by?: string) =>
  applyStock(cakeId, { delta: Math.abs(qty) }, "reabastecimento", { by });

/** Ajuste manual para um valor exato. */
export const setQuantity = (cakeId: number, target: number, by?: string) =>
  applyStock(cakeId, { set: Math.max(0, target) }, "ajuste", { by });

/**
 * Desfaz o último evento de estoque do bolo, revertendo a quantidade.
 * Correção pura: não dispara avisos.
 */
export async function undoLast(cakeId: number): Promise<StockChange | null> {
  const [last] = await db
    .select()
    .from(stockEvents)
    .where(eq(stockEvents.cakeId, cakeId))
    .orderBy(desc(stockEvents.id))
    .limit(1);
  if (!last) return null;

  const [cake] = await db.select().from(cakes).where(eq(cakes.id, cakeId));
  if (!cake) return null;

  const oldQty = cake.quantity;
  const newQty = Math.max(0, oldQty - last.delta);
  await db.update(cakes).set({ quantity: newQty }).where(eq(cakes.id, cakeId));
  await db.delete(stockEvents).where(eq(stockEvents.id, last.id));

  return {
    cakeId,
    oldQty,
    newQty,
    delta: newQty - oldQty,
    type: last.type,
    triggeredNotifications: false,
  };
}

// --- Leituras ---

export async function listCakes(opts: { onlyActive?: boolean } = {}): Promise<Cake[]> {
  const rows = await db.select().from(cakes).orderBy(cakes.sortOrder, cakes.id);
  return opts.onlyActive ? rows.filter((c) => c.active) : rows;
}

export async function getCakeById(id: number): Promise<Cake | undefined> {
  const [c] = await db.select().from(cakes).where(eq(cakes.id, id));
  return c;
}

// --- Catálogo (painel) ---

export async function createCake(input: {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number;
  sortOrder?: number;
}) {
  await db.insert(cakes).values({
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    price: input.price ?? 0,
    sortOrder: input.sortOrder ?? 0,
  });
}

export async function updateCake(
  id: number,
  patch: Partial<
    Pick<Cake, "name" | "description" | "imageUrl" | "price" | "active" | "sortOrder">
  >,
) {
  await db.update(cakes).set(patch).where(eq(cakes.id, id));
}
