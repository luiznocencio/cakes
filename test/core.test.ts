import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { cakes, db, notifications, stockEvents, waitlist } from "@/db";
import {
  listPendingAssisted,
  markAssistedDone,
  setProvider,
} from "@/lib/notifications";
import { AssistedProvider } from "@/lib/notifications/assisted";
import { FakeProvider } from "@/lib/notifications/fake";
import { addStock, sellOne, setQuantity, undoLast } from "@/lib/stock";

// "nova fornada" e "repor" viraram uma ação só: addStock.
const bake = addStock;
const restock = addStock;
import { joinWaitlist } from "@/lib/waitlist";

async function newCake(name = "Bolo Teste") {
  const [c] = await db
    .insert(cakes)
    .values({ name, slug: `${name}-${Math.abs(hash(name))}`, quantity: 0 })
    .returning();
  return c;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

beforeEach(async () => {
  await db.delete(notifications);
  await db.delete(waitlist);
  await db.delete(stockEvents);
  await db.delete(cakes);
  setProvider(new AssistedProvider());
});

describe("estoque", () => {
  it("venda decrementa e nunca fica negativa", async () => {
    const c = await newCake("Venda");
    await setQuantity(c.id, 2);
    await sellOne(c.id);
    await sellOne(c.id);
    const r = await sellOne(c.id); // já em 0
    expect(r.newQty).toBe(0);
    expect(r.delta).toBe(0);
  });

  it("desfazer reverte o último evento", async () => {
    const c = await newCake("Undo");
    await bake(c.id, 4);
    await sellOne(c.id); // 3
    const undo = await undoLast(c.id); // volta pra 4
    expect(undo?.newQty).toBe(4);
  });
});

describe("gatilho 0 → >0", () => {
  it("dispara aviso para quem está na fila quando volta do zero", async () => {
    const c = await newCake("Trigger");
    await joinWaitlist({ cakeId: c.id, phone: "11912345678", consent: true });

    const fake = new FakeProvider({ status: "sent", providerMessageId: "x" });
    setProvider(fake);

    const r = await bake(c.id, 3); // 0 -> 3
    expect(r.triggeredNotifications).toBe(true);
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0].target.phone).toBe("5511912345678");

    // provider "sent" => sai da fila
    const [w] = await db.select().from(waitlist).where(eq(waitlist.cakeId, c.id));
    expect(w.status).toBe("notified");
  });

  it("NÃO dispara quando o estoque muda mas não parte do zero", async () => {
    const c = await newCake("SemZero");
    await bake(c.id, 2); // 0 -> 2 (mas fila vazia)
    await joinWaitlist({ cakeId: c.id, phone: "11999999999", consent: true });

    const fake = new FakeProvider();
    setProvider(fake);
    const r = await restock(c.id, 5); // 2 -> 7, não parte do zero
    expect(r.triggeredNotifications).toBe(false);
    expect(fake.calls).toHaveLength(0);
  });
});

describe("fila de espera", () => {
  it("bloqueia telefone duplicado no mesmo bolo (dedup)", async () => {
    const c = await newCake("Dedup");
    const a = await joinWaitlist({ cakeId: c.id, phone: "(11) 91234-5678", consent: true });
    const b = await joinWaitlist({ cakeId: c.id, phone: "11912345678", consent: true });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true); // no-op, sem erro
    const rows = await db.select().from(waitlist).where(eq(waitlist.cakeId, c.id));
    expect(rows).toHaveLength(1);
  });

  it("exige consentimento e telefone válido", async () => {
    const c = await newCake("Consent");
    expect((await joinWaitlist({ cakeId: c.id, phone: "11912345678", consent: false })).ok).toBe(false);
    expect((await joinWaitlist({ cakeId: c.id, phone: "123", consent: true })).ok).toBe(false);
  });
});

describe("provider assistido", () => {
  it("cria pendência e não re-notifica quem já foi avisado", async () => {
    const c = await newCake("Assist");
    await joinWaitlist({ cakeId: c.id, phone: "11911112222", consent: true });

    await bake(c.id, 2); // 0 -> 2, cria assisted_pending
    let pending = await listPendingAssisted();
    expect(pending).toHaveLength(1);

    // zera sem gatilho e repõe: enquanto pendente, não duplica
    await setQuantity(c.id, 0);
    await restock(c.id, 3); // 0 -> 3
    pending = await listPendingAssisted();
    expect(pending).toHaveLength(1); // ainda 1, não duplicou

    // balcão marca como enviado => sai da fila
    await markAssistedDone(pending[0].notificationId);
    expect(await listPendingAssisted()).toHaveLength(0);
    const [w] = await db.select().from(waitlist).where(eq(waitlist.cakeId, c.id));
    expect(w.status).toBe("notified");

    // novo ciclo não re-notifica o já-notificado
    const fake = new FakeProvider();
    setProvider(fake);
    await setQuantity(c.id, 0);
    await restock(c.id, 1);
    expect(fake.calls).toHaveLength(0);
  });
});
