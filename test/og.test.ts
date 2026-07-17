import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OG_PHOTO_SLUGS } from "@/lib/og-photos";

// O ImageResponse tem teto de 500KB de bundle contando as imagens embutidas.
// Ficar em 60% deixa folga para o JSX e o CSS do card.
const BUDGET_BYTES = 500 * 1024;
const MAX_PHOTOS_SHARE = 0.6;

const OG_DIR = path.join(process.cwd(), "public", "og");

describe("fotos do og:image", () => {
  it("tem um jpeg para cada slug do card", () => {
    const faltando = OG_PHOTO_SLUGS.filter(
      (slug) => !fs.existsSync(path.join(OG_DIR, `${slug}.jpg`)),
    );
    // Se isto falhar, o opengraph-image.tsx vai tentar ler um arquivo que
    // não existe e o build quebra — na Vercel, não aqui. Rode: npm run og:photos
    expect(faltando).toEqual([]);
  });

  it("cabe no orçamento de bundle do ImageResponse", () => {
    const total = OG_PHOTO_SLUGS.reduce(
      (soma, slug) => soma + fs.statSync(path.join(OG_DIR, `${slug}.jpg`)).size,
      0,
    );
    expect(total).toBeLessThan(BUDGET_BYTES * MAX_PHOTOS_SHARE);
  });
});
