import "server-only";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { normalizePhoneBR } from "./phone";

/**
 * Inscreve alguém na fila de espera de um bolo. Exige consentimento (LGPD) e
 * telefone válido. O índice único parcial (cake_id, phone WHERE waiting) impede
 * duplicidade — inscrição repetida vira no-op.
 */
export async function joinWaitlist(input: {
  cakeId: number;
  phone: string;
  name?: string;
  consent: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.consent) {
    return { ok: false, error: "É preciso concordar em receber o aviso no WhatsApp." };
  }
  const phone = normalizePhoneBR(input.phone);
  if (!phone) {
    return { ok: false, error: "WhatsApp inválido. Digite DDD + número." };
  }
  await db
    .insert(waitlist)
    .values({
      cakeId: input.cakeId,
      phone,
      name: input.name?.trim() || null,
      consent: true,
      status: "waiting",
    })
    .onConflictDoNothing();
  return { ok: true };
}
