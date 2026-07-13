import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cakes, notifications, waitlist } from "@/db/schema";
import { AssistedProvider } from "./assisted";
import type { NotificationProvider } from "./types";
import { WhatsAppCloudProvider } from "./whatsapp-cloud";

export * from "./types";

let _provider: NotificationProvider | null = null;

export function getProvider(): NotificationProvider {
  if (_provider) return _provider;
  const kind = process.env.NOTIFY_PROVIDER ?? "assisted";
  _provider =
    kind === "whatsapp_cloud"
      ? new WhatsAppCloudProvider()
      : new AssistedProvider();
  return _provider;
}

/** Injeta um provider (usado nos testes com o FakeProvider). */
export function setProvider(p: NotificationProvider | null) {
  _provider = p;
}

/**
 * Gatilho central: chamado quando um bolo volta do zero (0 → >0).
 * Enfileira aviso para cada pessoa na fila, pulando quem já tem aviso assistido
 * pendente (evita duplicar em reabastecimentos seguidos).
 */
export async function enqueueBackInStock(cakeId: number): Promise<void> {
  const [cake] = await db.select().from(cakes).where(eq(cakes.id, cakeId));
  if (!cake) return;

  const waiting = await db
    .select()
    .from(waitlist)
    .where(and(eq(waitlist.cakeId, cakeId), eq(waitlist.status, "waiting")));

  const provider = getProvider();

  for (const w of waiting) {
    const [openPending] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.waitlistId, w.id),
          eq(notifications.status, "assisted_pending"),
        ),
      )
      .limit(1);
    if (openPending) continue;

    const res = await provider.notifyBackInStock(
      { waitlistId: w.id, cakeId, phone: w.phone, name: w.name },
      cake,
    );

    await db.insert(notifications).values({
      waitlistId: w.id,
      cakeId,
      phone: w.phone,
      provider: provider.name,
      status: res.status,
      providerMessageId: res.providerMessageId ?? null,
      error: res.error ?? null,
      sentAt: res.status === "sent" ? new Date() : null,
    });

    // Envio automático concluído → sai da fila na hora.
    if (res.status === "sent") {
      await db
        .update(waitlist)
        .set({ status: "notified", notifiedAt: new Date() })
        .where(eq(waitlist.id, w.id));
    }
  }
}

export type PendingAssisted = {
  notificationId: number;
  waitlistId: number;
  phone: string;
  cakeId: number;
  cakeName: string;
  name: string | null;
  createdAt: Date;
};

/** Avisos assistidos aguardando o balcão disparar (central de avisos). */
export async function listPendingAssisted(): Promise<PendingAssisted[]> {
  return db
    .select({
      notificationId: notifications.id,
      waitlistId: notifications.waitlistId,
      phone: notifications.phone,
      cakeId: notifications.cakeId,
      cakeName: cakes.name,
      name: waitlist.name,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(cakes, eq(cakes.id, notifications.cakeId))
    .innerJoin(waitlist, eq(waitlist.id, notifications.waitlistId))
    .where(eq(notifications.status, "assisted_pending"))
    .orderBy(desc(notifications.createdAt));
}

/** Marca um aviso assistido como enviado e tira a pessoa da fila. */
export async function markAssistedDone(notificationId: number): Promise<void> {
  const [n] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));
  if (!n) return;
  await db
    .update(notifications)
    .set({ status: "assisted_done", sentAt: new Date() })
    .where(eq(notifications.id, notificationId));
  await db
    .update(waitlist)
    .set({ status: "notified", notifiedAt: new Date() })
    .where(eq(waitlist.id, n.waitlistId));
}

export function buildAssistedMessage(cakeName: string): string {
  const store = process.env.STORE_NAME;
  return `Oi! O ${cakeName} que você queria já está disponível${
    store ? ` na ${store}` : ""
  }. É por ordem de chegada 🎂`;
}

export function waMeLink(phoneE164: string, text: string): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(text)}`;
}
