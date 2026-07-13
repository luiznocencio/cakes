"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  createSession,
  destroySession,
  isAuthenticated,
} from "@/lib/auth";
import {
  listPendingAssisted,
  markAssistedDone,
} from "@/lib/notifications";
import {
  addOne,
  bake,
  createCake,
  restock,
  sellOne,
  setQuantity,
  undoLast,
  updateCake,
} from "@/lib/stock";

async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/painel/login");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// --- Auth ---

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const pw = String(formData.get("password") ?? "");
  if (!checkPassword(pw)) return { error: "Senha incorreta." };
  await createSession();
  redirect("/painel");
}

export async function logoutAction() {
  await destroySession();
  redirect("/painel/login");
}

// --- Estoque ---

export async function sellAction(cakeId: number) {
  await requireAuth();
  await sellOne(cakeId);
  revalidatePath("/painel");
}

export async function addOneAction(cakeId: number) {
  await requireAuth();
  await addOne(cakeId);
  revalidatePath("/painel");
}

export async function undoAction(cakeId: number) {
  await requireAuth();
  await undoLast(cakeId);
  revalidatePath("/painel");
}

export async function bakeAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const qty = Number(formData.get("qty"));
  if (Number.isFinite(qty) && qty > 0) await bake(cakeId, qty);
  revalidatePath("/painel");
}

export async function restockAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const qty = Number(formData.get("qty"));
  if (Number.isFinite(qty) && qty > 0) await restock(cakeId, qty);
  revalidatePath("/painel");
}

export async function setQtyAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const qty = Number(formData.get("qty"));
  if (Number.isFinite(qty) && qty >= 0) await setQuantity(cakeId, qty);
  revalidatePath("/painel");
}

// --- Central de avisos assistidos ---

export async function markDoneAction(notificationId: number) {
  await requireAuth();
  await markAssistedDone(notificationId);
  revalidatePath("/painel");
}

export async function markAllDoneAction() {
  await requireAuth();
  const pending = await listPendingAssisted();
  for (const p of pending) await markAssistedDone(p.notificationId);
  revalidatePath("/painel");
}

// --- Catálogo ---

/** Converte um preço digitado ("18", "18,00", "R$ 18,50") em centavos. */
function parsePriceToCents(input: string): number {
  const cleaned = (input ?? "")
    .replace(/[^\d,.]/g, "")
    .replace(/\.(?=\d{3})/g, "")
    .replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export async function createCakeAction(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const description = String(formData.get("description") ?? "").trim();
  const price = parsePriceToCents(String(formData.get("price") ?? ""));
  await createCake({
    name,
    slug: `${slugify(name)}-${Date.now().toString(36).slice(-4)}`,
    description: description || null,
    price,
  });
  revalidatePath("/painel");
  revalidatePath("/painel/bolos");
  revalidatePath("/");
}

export async function setPriceAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const price = parsePriceToCents(String(formData.get("price") ?? ""));
  await updateCake(cakeId, { price });
  revalidatePath("/painel/bolos");
  revalidatePath("/painel");
  revalidatePath("/");
}

export async function toggleCakeAction(cakeId: number, active: boolean) {
  await requireAuth();
  await updateCake(cakeId, { active });
  revalidatePath("/painel/bolos");
  revalidatePath("/painel");
  revalidatePath("/");
}
