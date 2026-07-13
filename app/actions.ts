"use server";

import { revalidatePath } from "next/cache";
import { joinWaitlist } from "@/lib/waitlist";

export type JoinState = { ok: boolean; error?: string };

export async function joinWaitlistAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const cakeId = Number(formData.get("cakeId"));
  const phone = String(formData.get("phone") ?? "");
  const name = String(formData.get("name") ?? "");
  const consent = formData.get("consent") === "on";

  if (!cakeId) return { ok: false, error: "Bolo inválido." };

  const res = await joinWaitlist({ cakeId, phone, name, consent });
  if (res.ok) revalidatePath("/");
  return res;
}
