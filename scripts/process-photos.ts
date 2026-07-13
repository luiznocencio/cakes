import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Recorta/realça as fotos reais dos prints (Primu's Bolos) em imagens de
 * produto limpas (4:3, webp) para servir de "cara" de cada bolo no site.
 *
 * Estratégia: os prints de listagem têm layout idêntico — o logo fica no topo
 * da foto e o BOLO na faixa inferior. Recortamos essa faixa inferior (sem o
 * logo e sem a barra de status), enquadramos em 4:3 e damos um leve realce.
 */

const FOTOS = path.join(process.cwd(), "fotos");
const OUT = path.join(process.cwd(), "public", "bolos");

// Faixa inferior da foto na listagem (px na imagem 1080x2400), onde está o bolo.
const BAND_TOP = 600;
const BAND_HEIGHT = 610;

// Ajuste fino por bolo (deslocamento vertical da faixa), quando o bolo está
// mais alto/baixo que o padrão. 0 = padrão.
const OFFSET: Record<string, number> = {
  fazendeiro: -120, // bolo segurado, mais alto
  "rocambole-chocolate": -160, // vitrine, rolos mais altos
  limao: 80,
  "massa-puba": 60,
  pudim: 60,
};

// slug -> arquivo do print de listagem (contém nome+preço+foto).
const SOURCES: Record<string, string> = {
  "cenoura-chocolate": "Cenoura-chocolate.png",
  "milho-verde-fuba": "Milho-verde-fuba.png",
  "banana-canela": "banana-canela.png",
  fazendeiro: "fazendeiro.png",
  "goiabada-queijo": "goiabada-queijo.png",
  limao: "limao.png",
  "massa-puba": "massa-puba.png",
  negresco: "negresco.png",
  ninho: "ninho.png",
  pudim: "pudim.png",
  "rocambole-chocolate": "rocambole-chocolate.png",
  vulcao: "vulcao.png",
};

const OUT_W = 1080;
const OUT_H = 810; // 4:3

async function processOne(slug: string, source: string) {
  const src = path.join(FOTOS, source);
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 1080;
  const h = meta.height ?? 2400;

  // Fim da faixa da foto na listagem (abaixo disso começa a área branca de
  // nome/preço). Nunca recortar além daqui, senão entra texto branco no rodapé.
  const BAND_BOTTOM = 1205;
  const off = OFFSET[slug] ?? 0;
  const top = Math.max(0, Math.min(BAND_TOP + off, h - 200));
  const height = Math.min(BAND_HEIGHT, BAND_BOTTOM - top, h - top);

  await sharp(src)
    .extract({ left: 0, top, width: w, height })
    .resize(OUT_W, OUT_H, { fit: "cover", position: "centre" })
    .modulate({ brightness: 1.05, saturation: 1.14 })
    .sharpen()
    .webp({ quality: 84 })
    .toFile(path.join(OUT, `${slug}.webp`));

  console.log(`✓ ${slug}.webp`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [slug, source] of Object.entries(SOURCES)) {
    if (!fs.existsSync(path.join(FOTOS, source))) {
      console.warn(`! fonte ausente: ${source}`);
      continue;
    }
    await processOne(slug, source);
  }
  console.log(`\nPronto: ${Object.keys(SOURCES).length} imagens em public/bolos/`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
