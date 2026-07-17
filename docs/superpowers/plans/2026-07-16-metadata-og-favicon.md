# Metadata, Open Graph e favicon — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o link do site funcionar nos dois lugares onde ele aparece — o card do WhatsApp e o resultado do Google — e trocar o favicon do Create Next App por um bolo.

**Architecture:** `app/layout.tsx` passa a exportar `generateMetadata()` com textos distintos para busca (`title`/`description`) e compartilhamento (`og:*`). O favicon vira `app/icon.svg` com o emoji 🎂. O og:image é um mosaico 1200×630 gerado no build por `app/opengraph-image.tsx`, que lê 4 fotos jpeg pré-geradas por um script — mesmo padrão do `scripts/process-photos.ts`, que já gera e commita as imagens de `public/bolos`.

**Tech Stack:** Next 16.2.10 (App Router), `next/og` (satori), sharp (só no script, offline), TypeScript.

## Global Constraints

Estas valem para **todas** as tasks:

- **Branch:** `metadata-og-favicon`. Nunca commitar em `main` — é o que a Vercel faz deploy.
- **AGENTS.md:** este não é o Next.js que você conhece. Antes de escrever código de uma API do Next, leia o guia em `node_modules/next/dist/docs/`. Não confie na memória.
- **Mensagens de commit:** português, descritivas, sem prefixo tipo `feat:`. Siga o histórico existente (`git log --format=%s -9`).
- **`ImageResponse` — limite de 500 KB de bundle.** Inclui JSX, CSS, fontes e **imagens embutidas**. Verificado na doc: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md`. Estourar isso quebra o build na Vercel, não localmente.
- **`ImageResponse` só suporta flexbox.** `display: grid` não funciona.
- **O satori não lê `.webp`.** Verificado por sonda nesta máquina: um `<img>` com data-URI webp falha com `u2 is not iterable`, enquanto o mesmo teste com PNG renderiza. Por isso as fotos do card são jpeg.
- **Nada de emoji dentro do `ImageResponse`.** O default `emoji: 'twemoji'` busca o glifo numa CDN — dependência de rede em tempo de build. O 🎂 vive só no favicon, que é SVG local.
- **Textos são literais.** Copie exatamente as strings das tabelas. Elas foram escritas e revisadas pelo dono; não "melhore" a redação.

---

### Task 1: Favicon de bolo e limpeza do Create Next App

**Files:**
- Create: `E:\CODE\cakes\app\icon.svg`
- Delete: `E:\CODE\cakes\app\favicon.ico`
- Delete: `E:\CODE\cakes\public\next.svg`, `public\vercel.svg`, `public\globe.svg`, `public\file.svg`, `public\window.svg`

**Interfaces:**
- Consumes: nada.
- Produces: nada que outra task importe. Task independente — pode ser revisada e rejeitada sozinha.

**Por que o `.ico` precisa morrer:** ele não é substituído automaticamente. Continua servido em `/favicon.ico`, que é onde o browser bate por padrão, e venceria o `icon.svg`. Fonte: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`.

- [ ] **Step 1: Criar o `app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">🎂</text>
</svg>
```

O glifo vem da fonte de emoji de quem está olhando — muda entre iPhone, Android e Windows. Em 16px isso é irrelevante e o ícone parece nativo em cada plataforma.

- [ ] **Step 2: Apagar o `.ico` e o lixo do scaffold**

```bash
cd /e/CODE/cakes
git rm app/favicon.ico public/next.svg public/vercel.svg public/globe.svg public/file.svg public/window.svg
```

- [ ] **Step 3: Confirmar que nenhum código referenciava os SVGs apagados**

```bash
git grep -n "next.svg\|vercel.svg\|globe.svg\|file.svg\|window.svg"
```

Esperado: **nenhuma saída**. Se aparecer alguma referência, pare e reporte — o arquivo não era lixo.

- [ ] **Step 4: Subir o dev server e verificar**

```bash
npm run dev
```

Depois, noutro terminal:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/favicon.ico
curl -s http://localhost:3000/ | grep -o '<link rel="icon"[^>]*>'
```

Esperado: `404` no primeiro (o `.ico` sumiu) e um `<link rel="icon" href="/icon?...` no segundo. Abra `http://localhost:3000` e confirme o 🎂 na aba.

- [ ] **Step 5: Commit**

```bash
git add app/icon.svg
git commit -m "Favicon de bolo no lugar do ícone do Create Next App

Troca o favicon.ico padrão por app/icon.svg com o emoji. O .ico
precisa sair junto: ele continua sendo servido em /favicon.ico,
onde o browser bate por padrão, e venceria o icon.svg.

Leva junto os SVGs do scaffold que nunca foram usados.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Textos de metadata — Google e WhatsApp

**Files:**
- Modify: `E:\CODE\cakes\app\layout.tsx:20-24` (substitui o `export const metadata`)

**Interfaces:**
- Consumes: `process.env.STORE_NAME` (mesmo fallback do `app/page.tsx:10`: `?? "Primu's Bolos"`).
- Produces: `metadataBase`, que a Task 4 depende para montar a URL absoluta do og:image. Sem ele, o Next não resolve `/opengraph-image` para URL absoluta e o WhatsApp não carrega a imagem.

**A decisão central:** Google e WhatsApp querem coisas opostas. Quem busca digitou "bolo no Benedito Bentes" e precisa ver essas palavras. Quem recebe o link já sabe o que é — precisa de vontade de tocar. Por isso os textos são diferentes.

| Campo | Texto (literal) |
|---|---|
| `title` | `Bolos caseiros no Benedito Bentes, Primu's Bolos.` |
| `description` | `Bolos caseiros no Benedito Bentes. Veja o que está na vitrine agora e receba um aviso no WhatsApp quando o seu favorito sair do forno.` |
| `og:title` | `Primu's Bolos, veja o que tem na vitrine agora` |
| `og:description` | `Esgotou o seu? A gente te chama no WhatsApp quando voltar.` |

- [ ] **Step 1: Substituir o bloco `metadata` em `app/layout.tsx`**

Trocar as linhas 20-24 por:

```tsx
// O site aparece em dois lugares com intenções opostas: a busca do Google
// (a pessoa digitou "bolo no Benedito Bentes") e o card do WhatsApp (a pessoa
// já sabe o que é e precisa de vontade de tocar). Por isso os textos diferem.
export function generateMetadata(): Metadata {
  const storeName = process.env.STORE_NAME ?? "Primu's Bolos";
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: "Bolos caseiros no Benedito Bentes, Primu's Bolos.",
    description:
      "Bolos caseiros no Benedito Bentes. Veja o que está na vitrine agora e receba um aviso no WhatsApp quando o seu favorito sair do forno.",
    openGraph: {
      title: `${storeName}, veja o que tem na vitrine agora`,
      description: "Esgotou o seu? A gente te chama no WhatsApp quando voltar.",
      type: "website",
      locale: "pt_BR",
      siteName: storeName,
    },
  };
}
```

Notas para quem implementa:

- `generateMetadata` (e não `export const metadata`) porque o nome da loja vem de env. Hoje o `title` cravava "Primu's Bolos" enquanto o `app/page.tsx:10` respeitava `STORE_NAME` — os dois discordavam se a loja fosse renomeada.
- `VERCEL_PROJECT_PRODUCTION_URL` é injetada pela Vercel automaticamente. Não precisa configurar nada no painel.
- O `title` e a `description` citam o **bairro, não a cidade**. Foi decisão consciente do dono, registrada no spec. Não adicione "Maceió".
- Não declare `openGraph.images`. A Task 4 cria `app/opengraph-image.tsx`, e a convenção de arquivo preenche isso sozinha.

- [ ] **Step 2: Verificar o `<head>` renderizado**

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/ | grep -oE '<(title|meta)[^>]*(description|og:|title)[^>]*>'
```

Esperado: `<title>` com o texto do Google, `<meta name="description">` com o texto do Google, e `og:title`/`og:description` com os textos do WhatsApp — **diferentes** entre si. Se `og:title` repetir o `title`, o `openGraph` não foi aplicado.

- [ ] **Step 3: Verificar que o lint passa**

```bash
npm run lint
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "Textos separados para a busca e para o card do WhatsApp

O Google e o WhatsApp querem coisas opostas: um precisa casar com
o que a pessoa digitou, o outro precisa dar vontade de tocar. Uma
frase só servia os dois pela metade.

Troca metadata por generateMetadata para o title respeitar STORE_NAME,
como o page.tsx já fazia — os dois discordavam se a loja mudasse de nome.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Fotos jpeg do card

**Files:**
- Create: `E:\CODE\cakes\lib\og-photos.ts`
- Create: `E:\CODE\cakes\scripts\og-photos.ts`
- Test: `E:\CODE\cakes\test\og.test.ts`
- Modify: `E:\CODE\cakes\package.json` (adiciona o script `og:photos`)
- Create (gerado, commitado): `public/og/banana-canela.jpg`, `cenoura-chocolate.jpg`, `goiabada-queijo.jpg`, `vulcao.jpg`

**TDD:** sim, e ele encaixa naturalmente aqui. O teste afirma que todo slug tem seu jpeg e que a soma cabe no orçamento — falha antes do script existir (RED), passa depois de rodá-lo (GREEN). Ele guarda o modo de falha que motivou o `lib/og-photos.ts`: se as listas divergirem, o build quebra **na Vercel**; o teste pega isso aqui, em segundos.

**Interfaces:**
- Consumes: `public/bolos/{slug}.webp` (já no repo).
- Produces:
  - `lib/og-photos.ts` exporta `OG_PHOTO_SLUGS: readonly string[]` e `OG_PHOTO_SIZE: { width: 300; height: 420 }`. **A Task 4 importa os dois.** A lista vive num lugar só de propósito: se o script gerar um conjunto de fotos e o componente pedir outro, o `opengraph-image.tsx` lê um arquivo que não existe e o build quebra — na Vercel, não aqui.
  - `public/og/{slug}.jpg`, 300×420. Os 4 arquivos **somados** precisam ficar bem abaixo de 500 KB.

**Por que um script e não conversão no build:** o projeto já faz assim. O `scripts/process-photos.ts` gera `public/bolos/*.webp` e commita o resultado. Seguir o padrão evita colocar o sharp no caminho do build da Vercel — ele hoje só existe como dependência transitiva do Next, não está no `package.json`, e apoiar o build nisso seria construir sobre areia.

**Por que jpeg e não png:** orçamento. Uma sonda com os 4 em PNG gerou ~800 KB de assets embutidos — acima do limite de 500 KB do `ImageResponse`. Passaria localmente e quebraria na Vercel.

- [ ] **Step 1: Criar `lib/og-photos.ts` — a fonte única**

```ts
/**
 * Quais bolos aparecem no card de compartilhamento, e em que tamanho.
 *
 * Fixos e determinísticos: o WhatsApp cacheia o preview por URL, então
 * "os 4 primeiros do banco" daria um card que passa a mentir assim que o
 * catálogo muda. A escolha é estética — variedade de cor e textura.
 *
 * Vive aqui, e não nos dois lugares que usam, porque o script gera os
 * arquivos e o opengraph-image.tsx os lê. Se as listas divergirem, o build
 * quebra procurando um jpeg que ninguém gerou.
 */
export const OG_PHOTO_SLUGS = [
  "banana-canela",
  "cenoura-chocolate",
  "goiabada-queijo",
  "vulcao",
] as const;

// 4 fotos × 300 = 1200, a largura do card.
export const OG_PHOTO_SIZE = { width: 300, height: 420 } as const;
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `test/og.test.ts`:

```ts
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
```

- [ ] **Step 3: Rodar o teste e ver falhar (RED)**

```bash
npx vitest run test/og.test.ts
```

Esperado: **FALHA**. O primeiro teste falha porque `public/og/` ainda não existe — os 4 slugs aparecem em `faltando`. É a falha certa: ela prova que o teste enxerga o que deveria enxergar.

- [ ] **Step 4: Criar `scripts/og-photos.ts`**

```ts
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
```

- [ ] **Step 5: Adicionar o script ao `package.json`**

Na seção `"scripts"`, junto dos outros:

```json
"og:photos": "tsx scripts/og-photos.ts",
```

- [ ] **Step 6: Rodar e conferir o orçamento**

```bash
cd /e/CODE/cakes
npm run og:photos
```

Esperado: 4 linhas `✓ <slug>.jpg — NN KB` e um total **abaixo de 300 KB** (60% do teto). Se o script lançar o erro de orçamento, baixe `quality` para 65 e rode de novo. Se ainda estourar, reduza `W`/`H`.

- [ ] **Step 7: Rodar o teste e ver passar (GREEN)**

```bash
npx vitest run test/og.test.ts
```

Esperado: **2 testes passam**. O mesmo teste que falhava no Step 3 agora passa, sem que você o tenha alterado.

- [ ] **Step 8: Olhar as imagens**

Abra `public/og/*.jpg`. Cada uma deve mostrar um bolo inteiro e reconhecível, não um recorte estranho. As fotos-fonte são 4:3 e o corte aqui é 300×420 (retrato) — **é um corte agressivo**. Se algum bolo ficar decapitado, ajuste `position` para `"top"` naquele caso ou troque o slug por outro dos 12 disponíveis (edite `OG_PHOTO_SLUGS` em `lib/og-photos.ts`, nunca só num dos dois consumidores).

- [ ] **Step 9: Commit**

```bash
git add lib/og-photos.ts scripts/og-photos.ts test/og.test.ts package.json public/og
git commit -m "Fotos jpeg para o card de compartilhamento

O satori não lê webp, então as fotos do og:image precisam de outro
formato. Jpeg e não png por causa do teto de 500KB de bundle do
ImageResponse — em png os mesmos 4 bolos davam ~800KB e teriam
quebrado o build na Vercel.

Gerado por script e commitado, como o process-photos.ts já faz.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: O mosaico do og:image

**Files:**
- Create: `E:\CODE\cakes\app\opengraph-image.tsx`

**Interfaces:**
- Consumes: `public/og/{slug}.jpg` da Task 3; `metadataBase` da Task 2.
- Produces: a rota `/opengraph-image`, que a convenção de arquivo do Next liga sozinha ao `og:image` — sem precisar declarar `openGraph.images` no layout.

- [ ] **Step 1: Ler a doc antes de escrever**

```bash
cat node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md
```

Confirme os nomes dos exports (`size`, `contentType`, `alt`) na versão instalada. O AGENTS.md existe por isso.

- [ ] **Step 2: Criar `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { OG_PHOTO_SLUGS, OG_PHOTO_SIZE } from "@/lib/og-photos";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bolos caseiros da Primu's Bolos";

// Altura da faixa de texto: o que sobra do card abaixo das fotos.
const CAPTION_HEIGHT = size.height - OG_PHOTO_SIZE.height;

function photo(slug: string) {
  const buf = fs.readFileSync(path.join(process.cwd(), "public", "og", `${slug}.jpg`));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export default async function Image() {
  const storeName = process.env.STORE_NAME ?? "Primu's Bolos";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#fdfaf6" }}>
        <div style={{ display: "flex", width: "100%", height: OG_PHOTO_SIZE.height }}>
          {OG_PHOTO_SLUGS.map((slug) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slug}
              src={photo(slug)}
              alt=""
              width={OG_PHOTO_SIZE.width}
              height={OG_PHOTO_SIZE.height}
              style={{ objectFit: "cover" }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: CAPTION_HEIGHT,
            paddingLeft: 56,
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 700, color: "#6b2737" }}>{storeName}</div>
          <div style={{ fontSize: 32, color: "#57534e", marginTop: 8 }}>
            veja o que tem na vitrine agora
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
```

Notas para quem implementa:

- **Sem emoji aqui.** O default `emoji: 'twemoji'` do `ImageResponse` baixa o glifo de uma CDN — dependência de rede no build. O 🎂 fica só no favicon.
- **Sem Fraunces.** O satori não enxerga o `next/font`; usar a fonte da marca exigiria embutir o `.ttf`, que come um quinto do orçamento de 500 KB. Fonte padrão, e o que vende o card são as fotos.
- **Flexbox obrigatório.** `display: grid` não funciona no satori.
- **Use alturas explícitas, não `flex: 1`.** Numa sonda anterior o `flex: 1` não expandiu como esperado e o card saiu com um deserto vazio embaixo — as fotos numa faixa fina no topo e o texto boiando. `CAPTION_HEIGHT` é derivado (630 − 420) justamente para as duas faixas fecharem a altura do card sem sobra.
- **O import é `@/lib/og-photos`** — o alias `@/*` existe no `tsconfig.json` e o código de app já usa (`app/page.tsx` importa `@/lib/stock`). No script da Task 3 o import é relativo (`../lib/og-photos`): nenhum script em `scripts/` importa de `lib/` hoje, então não há precedente de que o alias funcione sob `tsx`, e o caminho relativo funciona nos dois casos. Se preferir o alias lá também, teste antes.

- [ ] **Step 3: Gerar e OLHAR o card**

```bash
npm run dev
curl -s -o /tmp/og.png -w "%{http_code} %{size_download} bytes\n" http://localhost:3000/opengraph-image
```

Esperado: `200` e um PNG de algumas centenas de KB.

**Agora abra `/tmp/og.png` e olhe.** Não pule este passo: uma sonda anterior retornou `200` com um card visivelmente feio — metade dele vazio. "Não deu erro" não é "ficou bom". Confira: as 4 fotos preenchem a faixa de cima sem distorcer, o nome da loja está legível, e não sobra área morta.

- [ ] **Step 4: Verificar que o build passa**

```bash
npm run build
```

Esperado: build verde. É aqui que o teto de 500 KB apareceria — o dev server é mais permissivo que o build.

- [ ] **Step 5: Confirmar que o og:image entrou no `<head>`**

```bash
curl -s http://localhost:3000/ | grep -o '<meta property="og:image[^>]*>'
```

Esperado: uma `og:image` com URL **absoluta** (começando com `http`). Se vier relativa, o `metadataBase` da Task 2 não foi aplicado.

- [ ] **Step 6: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "Card do WhatsApp: mosaico de bolos em vez de link pelado

O link do site circula justamente no WhatsApp e não tinha og:image
nenhuma — o card saía sem imagem. Agora são 4 bolos e o nome da loja.

Estático de propósito: o WhatsApp cacheia o preview por URL, então um
card mostrando o estoque ao vivo seria mentira na maior parte do tempo.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Verificação de ponta a ponta

**Files:** nenhum. Task de observação.

**Interfaces:**
- Consumes: tudo das Tasks 1-4.
- Produces: a decisão de abrir o PR ou voltar atrás.

- [ ] **Step 1: Rodar os testes**

```bash
npm test
```

Esperado: **15 testes passam** — os 13 que já existiam mais os 2 de `test/og.test.ts` da Task 3.

O `test/storage.test.ts` falha no teardown com `EPERM`. **Isso é conhecido e não é regressão:** é específico do Windows, anterior a este trabalho — o teste cria um `.webp` temporário em `public/bolos` e o `afterAll` não consegue apagá-lo. Os testes em si passam; só a limpeza quebra. Não tente consertar: está fora do escopo deste plano.

- [ ] **Step 2: Limpar o artefato que o teste deixa para trás**

```bash
git status --short
```

Se aparecer `?? public/bolos/bolo-teste-*.webp`, apague — é lixo do teardown quebrado, não pode entrar no commit.

```bash
rm public/bolos/bolo-teste-*.webp
```

- [ ] **Step 3: Revisar o diff inteiro com olhos frios**

```bash
git diff main...metadata-og-favicon --stat
git diff main...metadata-og-favicon -- app/ scripts/ package.json
```

Confira que os 4 textos batem **literalmente** com a tabela da Task 2, e que nenhum arquivo entrou sem querer.

- [ ] **Step 4: Parar e reportar ao Luiz**

Não faça push nem abra PR sem falar com ele. O push publica no GitHub e a Vercel faz deploy a partir do merge — isso é decisão dele, não sua.

Reporte: o que foi feito, o print do card, e as duas coisas que só podem ser verificadas depois do deploy:

1. O card real do WhatsApp só aparece depois que a URL passa pelo **validador de links do Facebook**, que estoura o cache. Antes disso, quem já compartilhou o link continua vendo o preview velho.
2. O `title`/`description` no Google levam dias a semanas para reindexar.

---

## Notas de ambiente (Windows, esta máquina)

- **`npm test` sempre "falha"** no teardown do `storage.test.ts` (`EPERM`). Os 13 testes passam. É incompatibilidade de plataforma — o projeto foi escrito no Mac.
- **`npm run db:generate` não roda aqui**: o script usa `find`, comando Unix. Não é necessário para nenhuma task deste plano.
- **O `postinstall` do sharp e do esbuild foi retido pelo npm** (`npm warn allow-scripts`). O esbuild funciona (os testes rodam) e o sharp funciona (validado por sonda: converteu os 4 webp em png). Se o `npm run og:photos` reclamar de binário nativo, rode `npm approve-scripts sharp` e reinstale.
