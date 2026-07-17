import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { OG_PHOTO_SLUGS, OG_PHOTO_SIZE } from "../lib/og-photos";

/**
 * Gera as fotos do card de compartilhamento (og:image) a partir das imagens
 * de produto. Jpeg, e não webp, porque o satori — motor do ImageResponse —
 * não lê webp. E não png porque o ImageResponse tem teto de 500KB de bundle,
 * contando as imagens embutidas.
 *
 * Rode à mão quando as fotos de public/bolos mudarem: npm run og:photos
 */

const IN = path.join(process.cwd(), "public", "bolos");
const OUT = path.join(process.cwd(), "public", "og");

const { width: W, height: H } = OG_PHOTO_SIZE;
const BUDGET = 500 * 1024;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;

  for (const slug of OG_PHOTO_SLUGS) {
    const src = path.join(IN, `${slug}.webp`);
    if (!fs.existsSync(src)) throw new Error(`fonte ausente: ${src}`);

    const buf = await sharp(src)
      .resize(W, H, { fit: "cover", position: "centre" })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(path.join(OUT, `${slug}.jpg`), buf);
    total += buf.length;
    console.log(`✓ ${slug}.jpg — ${(buf.length / 1024).toFixed(0)} KB`);
  }

  const pct = ((total / BUDGET) * 100).toFixed(0);
  console.log(`\nTotal: ${(total / 1024).toFixed(0)} KB (${pct}% do teto de 500KB do ImageResponse)`);
  if (total > BUDGET * 0.6) {
    throw new Error(
      `Fotos ocupam ${pct}% do orçamento. Sobra pouco para JSX e CSS — baixe a qualidade ou o tamanho.`,
    );
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
