import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "avisa_session";
const MAX_AGE = 60 * 60 * 12; // 12h

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-insecure-secret-troque-em-producao";
}

function sign(value: string): string {
  const mac = crypto
    .createHmac("sha256", secret())
    .update(value)
    .digest("base64url");
  return `${value}.${mac}`;
}

function verify(token?: string): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const expected = sign(token.slice(0, idx));
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Confere a senha única de equipe em tempo constante. */
export function checkPassword(pw: string): boolean {
  const expected = process.env.STAFF_PASSWORD ?? "bolo123";
  const a = Buffer.from(pw ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const token = sign(`staff.${Date.now()}`);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return verify(token);
}
