/**
 * Normalização de telefone BR para E.164 sem símbolos (formato aceito pelo
 * WhatsApp e por links wa.me): país 55 + DDD + número.
 */
export function normalizePhoneBR(input: string): string | null {
  const digits = (input ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let d = digits;
  if (d.startsWith("55")) d = d.slice(2);
  // Sobra DDD (2) + número (8 ou 9) = 10 ou 11 dígitos.
  if (d.length < 10 || d.length > 11) return null;
  return "55" + d;
}

/** Formata um E.164 BR de volta para leitura humana: (11) 91234-5678. */
export function formatPhoneBR(e164: string): string {
  const d = (e164 ?? "").replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return e164;
}
