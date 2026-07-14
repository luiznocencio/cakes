import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { saveCakePhoto } from "@/lib/storage";

const written: string[] = [];

afterAll(() => {
  for (const f of written) fs.rmSync(f, { force: true });
});

/** Foto falsa, como a que sai de um celular: retangular e "torta". */
async function fakePhoto(w = 1600, h = 1200): Promise<File> {
  const png = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 200, g: 120, b: 40 } },
  })
    .png()
    .toBuffer();
  return new File([new Uint8Array(png)], "foto.png", { type: "image/png" });
}

describe("upload de foto do bolo", () => {
  it("normaliza qualquer foto para 4:3 webp e devolve a URL", async () => {
    const res = await saveCakePhoto(await fakePhoto(), "bolo-teste");
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.url).toMatch(/^\/bolos\/bolo-teste-.*\.webp$/);

    const file = path.join(process.cwd(), "public", res.url.replace(/^\//, ""));
    written.push(file);
    expect(fs.existsSync(file)).toBe(true);

    const meta = await sharp(file).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(810); // 4:3, igual aos tiles
  });

  it("recusa arquivo que não é imagem", async () => {
    const bad = new File([new Uint8Array([1, 2, 3])], "x.pdf", {
      type: "application/pdf",
    });
    const res = await saveCakePhoto(bad, "x");
    expect(res.ok).toBe(false);
  });

  it("recusa foto vazia", async () => {
    const empty = new File([], "vazio.png", { type: "image/png" });
    const res = await saveCakePhoto(empty, "x");
    expect(res.ok).toBe(false);
  });
});
