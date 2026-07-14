import { beforeEach, describe, expect, it } from "vitest";
import { cakes, db, notifications, stockEvents, waitlist } from "@/db";
import { setProvider } from "@/lib/notifications";
import { AssistedProvider } from "@/lib/notifications/assisted";
import { getReport } from "@/lib/reports";
import { addStock, sellOne, setQuantity } from "@/lib/stock";
import { joinWaitlist } from "@/lib/waitlist";

async function newCake(name: string, price: number) {
  const [c] = await db
    .insert(cakes)
    .values({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), price })
    .returning();
  return c;
}

beforeEach(async () => {
  await db.delete(notifications);
  await db.delete(waitlist);
  await db.delete(stockEvents);
  await db.delete(cakes);
  setProvider(new AssistedProvider());
});

describe("relatórios", () => {
  it("conta produção, vendas, sobra e faturamento", async () => {
    const cenoura = await newCake("Cenoura", 1800);

    await addStock(cenoura.id, 10); // saiu do forno: 10
    await sellOne(cenoura.id);
    await sellOne(cenoura.id);
    await sellOne(cenoura.id); // vendeu 3

    const r = await getReport("hoje");
    const row = r.rows.find((x) => x.cake.id === cenoura.id)!;

    expect(row.produced).toBe(10);
    expect(row.sold).toBe(3);
    expect(row.leftover).toBe(7);
    expect(row.revenue).toBe(3 * 1800);
    expect(r.totalRevenue).toBe(5400);
  });

  it("mede procura reprimida pela fila de espera", async () => {
    const milho = await newCake("Milho", 1600);
    await joinWaitlist({ cakeId: milho.id, phone: "11911112222", consent: true });
    await joinWaitlist({ cakeId: milho.id, phone: "11933334444", consent: true });

    const r = await getReport("hoje");
    const row = r.rows.find((x) => x.cake.id === milho.id)!;

    expect(row.waiting).toBe(2);
    expect(r.totalWaiting).toBe(2);
  });

  it("correção manual (ajuste) não conta como produção", async () => {
    const c = await newCake("Ajuste", 1000);
    await addStock(c.id, 4); // produção real: 4
    await setQuantity(c.id, 9); // correção: +5, mas NÃO é fornada

    const r = await getReport("hoje");
    const row = r.rows.find((x) => x.cake.id === c.id)!;

    expect(row.produced).toBe(4);
  });
});
