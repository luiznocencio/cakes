import "server-only";
import sharp from "sharp";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export type SaveResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Salva a foto de um bolo e devolve a URL pública.
 *
 * - Produção (Vercel): Vercel Blob, quando `BLOB_READ_WRITE_TOKEN` existe.
 * - Dev/local: grava em `public/bolos/` (a pasta do projeto é somente leitura
 *   na Vercel, por isso o Blob lá).
 *
 * Normaliza toda foto para 4:3 / webp, para os tiles ficarem consistentes.
 */
export async function saveCakePhoto(
  file: File,
  slug: string,
): Promise<SaveResult> {
  if (!file || file.size === 0) return { ok: false, error: "Escolha uma foto." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "A foto passa de 8 MB. Use uma menor." };
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return { ok: false, error: "Formato não aceito. Use JPG, PNG ou WEBP." };
  }

  let webp: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    webp = await sharp(input)
      .rotate() // respeita a orientação EXIF da foto do celular
      .resize(1080, 810, { fit: "cover", position: "attention" })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return { ok: false, error: "Não consegui ler essa imagem." };
  }

  // Nome novo a cada upload — evita cache velho do navegador/CDN.
  const key = `bolos/${slug}-${Date.now().toString(36)}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, webp, {
      access: "public",
      contentType: "image/webp",
    });
    return { ok: true, url: blob.url };
  }

  // Dev: grava no próprio /public.
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "public", "bolos");
  mkdirSync(dir, { recursive: true });
  const filename = path.basename(key);
  writeFileSync(path.join(dir, filename), webp);
  return { ok: true, url: `/bolos/${filename}` };
}
