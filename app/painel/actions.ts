"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  createSession,
  destroySession,
  isAuthenticated,
} from "@/lib/auth";
import { listPendingAssisted, markAssistedDone } from "@/lib/notifications";
import { saveCakePhoto } from "@/lib/storage";
import {
  addOne,
  addStock,
  createCake,
  getCakeById,
  sellOne,
  setQuantity,
  undoLast,
  updateCake,
} from "@/lib/stock";

async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/painel/login");
}

function refresh() {
  revalidatePath("/painel");
  revalidatePath("/painel/bolos");
  revalidatePath("/painel/relatorios");
  revalidatePath("/");
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

/** Converte um preço digitado ("18", "18,00", "R$ 18,50") em centavos. */
function parsePriceToCents(input: string): number {
  const cleaned = (input ?? "")
    .replace(/[^\d,.]/g, "")
    .replace(/\.(?=\d{3})/g, "")
    .replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
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

// --- Contador de estoque ---

export async function sellAction(cakeId: number) {
  await requireAuth();
  await sellOne(cakeId);
  refresh();
}

export async function addOneAction(cakeId: number) {
  await requireAuth();
  await addOne(cakeId);
  refresh();
}

/** Entrou bolo na vitrine (fornada). Uma ação só — antes eram duas. */
export async function addStockAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const qty = Number(formData.get("qty"));
  if (Number.isFinite(qty) && qty > 0) await addStock(cakeId, qty);
  refresh();
}

/** Corrige o contador para um valor exato (não conta como produção). */
export async function setQtyAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const qty = Number(formData.get("qty"));
  if (Number.isFinite(qty) && qty >= 0) await setQuantity(cakeId, qty);
  refresh();
}

export async function undoAction(cakeId: number) {
  await requireAuth();
  await undoLast(cakeId);
  refresh();
}

// --- Central de avisos ---

export async function markDoneAction(notificationId: number) {
  await requireAuth();
  await markAssistedDone(notificationId);
  refresh();
}

export async function markAllDoneAction() {
  await requireAuth();
  for (const p of await listPendingAssisted()) {
    await markAssistedDone(p.notificationId);
  }
  refresh();
}

// --- Catálogo ---

export type CakeFormState = { error?: string; ok?: boolean };

export async function createCakeAction(
  _prev: CakeFormState,
  formData: FormData,
): Promise<CakeFormState> {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Dê um nome ao bolo." };

  const description = String(formData.get("description") ?? "").trim();
  const price = parsePriceToCents(String(formData.get("price") ?? ""));
  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;

  let imageUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const saved = await saveCakePhoto(photo, slug);
    if (!saved.ok) return { error: saved.error };
    imageUrl = saved.url;
  }

  await createCake({
    name,
    slug,
    description: description || null,
    price,
    imageUrl,
  });
  refresh();
  return { ok: true };
}

/** Troca a foto de um bolo existente. */
export async function changePhotoAction(
  cakeId: number,
  _prev: CakeFormState,
  formData: FormData,
): Promise<CakeFormState> {
  await requireAuth();
  const cake = await getCakeById(cakeId);
  if (!cake) return { error: "Bolo não encontrado." };

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Escolha uma foto." };
  }
  const saved = await saveCakePhoto(photo, cake.slug);
  if (!saved.ok) return { error: saved.error };

  await updateCake(cakeId, { imageUrl: saved.url });
  refresh();
  return { ok: true };
}

export async function saveCakeDetailsAction(cakeId: number, formData: FormData) {
  await requireAuth();
  const price = parsePriceToCents(String(formData.get("price") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  await updateCake(cakeId, { price, description: description || null });
  refresh();
}

export async function toggleCakeAction(cakeId: number, active: boolean) {
  await requireAuth();
  await updateCake(cakeId, { active });
  refresh();
}
