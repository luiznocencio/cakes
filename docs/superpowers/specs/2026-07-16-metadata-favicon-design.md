# Metadata, Open Graph e favicon — design

**Data:** 2026-07-16
**Escopo:** `app/layout.tsx`, `app/icon.svg`, `app/opengraph-image.tsx`, limpeza de sobras do Create Next App.

## Problema

O site é encontrado de duas maneiras, e hoje não atende bem nenhuma das duas:

1. **Link compartilhado no WhatsApp** — que é o canal central do produto. Não existe nenhuma tag `openGraph`, então o card sai sem imagem e sem texto próprio.
2. **Busca no Google** — a `description` atual não menciona bolo, Maceió nem Benedito Bentes, então compete com padaria do mundo inteiro.

Além disso, o favicon ainda é o `.ico` padrão do Create Next App.

## Decisão central: dois públicos, dois textos

Google e WhatsApp querem coisas opostas. Quem chega pela busca digitou "bolo em Maceió" e precisa ver essas palavras. Quem recebe o link no WhatsApp já sabe o que é — precisa de vontade de tocar.

Por isso `title`/`description` e `og:title`/`og:description` carregam textos **diferentes**, em vez de uma frase só servindo os dois pela metade.

### Google

| Campo | Texto | Tamanho |
|---|---|---|
| `title` | `Bolos caseiros no Benedito Bentes, Maceió \| Primu's Bolos` | 57 caracteres |
| `description` | `Bolos caseiros no Benedito Bentes, Maceió. Veja o que está na vitrine agora e receba um aviso no WhatsApp quando o seu favorito sair do forno.` | 142 caracteres |

Os dois cabem antes do corte do Google (~60 e ~155 caracteres).

### WhatsApp

| Campo | Texto |
|---|---|
| `og:title` | `Primu's Bolos — o que tem na vitrine agora` |
| `og:description` | `Esgotou o seu? A gente te chama no WhatsApp quando voltar.` |

O `og:title` é o texto que já existia, mantido porque é bom e espelha o `<h1>` da home.

## Favicon

`app/icon.svg` com o emoji 🎂 dentro de um elemento `<text>`. A doc da versão instalada (Next 16.2.10, `node_modules/next/dist/docs/.../app-icons.md`) confirma `.svg` como tipo válido para a convenção `icon` em `app/**/*`.

O desenho do emoji vem da fonte de quem está olhando — muda um pouco entre iPhone, Android e Windows. Num ícone de 16px isso é irrelevante, e o resultado parece nativo em cada plataforma.

**`app/favicon.ico` precisa ser deletado no mesmo commit.** Ele não é substituído automaticamente: continua sendo servido em `/favicon.ico`, que é onde o browser bate por padrão, e venceria o `icon.svg`.

## og:image — mosaico gerado no build

`app/opengraph-image.tsx`, 1200×630, via `ImageResponse` do `next/og`. Compõe 4 fotos de `public/bolos` com o nome da loja e o 🎂.

As 4 fotos são fixas no código — `banana-canela`, `cenoura-chocolate`, `goiabada-queijo` e `vulcao` — escolhidas por variedade de cor e textura. A escolha é estética e pode mudar depois de ver o render; o que importa é que seja **determinística**, e não "as 4 primeiras do banco", porque o catálogo muda e o card é cacheado.

Gerado no build, sem APIs de request-time — o que o torna estático e cacheado. Isso combina com o comportamento do WhatsApp, que cacheia o preview por URL de forma agressiva: um og:image "ao vivo" mostrando o estoque atual seria mentira na maior parte do tempo.

`metadataBase` precisa ser definido, senão o Next não consegue montar a URL absoluta do og:image.

### Risco conhecido: webp no satori

As fotos em `public/bolos` são `.webp`, e o satori (motor do `ImageResponse`) tem suporte irregular a esse formato. **Pode não renderizar.**

- **Verificação:** testar o webp primeiro, antes de construir o resto do mosaico.
- **Plano B:** converter as 4 fotos escolhidas para jpeg em tempo de build, num script em `scripts/`, seguindo o padrão do `prebuild-db.ts` que já existe.
- **Não serve como fallback:** os PNGs originais em `fotos/` estão no `.gitignore` e não existem no build da Vercel.

O `ImageResponse` também só suporta flexbox e um subconjunto de CSS — `display: grid` não funciona. O mosaico usa flexbox.

### Risco conhecido: a fonte do site não vale no satori

O satori não enxerga o `next/font`. Usar Fraunces no card exige carregar o **binário** da fonte (`.ttf`) e passá-lo em `options.fonts` — o `next/font/google` do `layout.tsx` não serve.

- **Preferência:** ler o `.ttf` do Fraunces já baixado em `node_modules/next/font/...` em tempo de build, sem rede.
- **Se custar mais do que vale:** usar a fonte padrão do `next/og`. O card perde a voz tipográfica da marca, mas continua com as fotos, que é o que vende. Não vale gastar meia hora numa fonte de um card de WhatsApp.

## Consistência do nome da loja

Hoje o `title` crava "Primu's Bolos" enquanto o `app/page.tsx` respeita a env `STORE_NAME`. Os dois discordam se a loja for renomeada.

O `export const metadata` vira `generateMetadata()`, que lê `process.env.STORE_NAME` com o mesmo fallback usado na home.

**Trade-off aceito:** o nome fica configurável, mas o endereço entra cravado no texto da `description`. Meio-configurável é incoerente, mas criar `STORE_CITY`/`STORE_DISTRICT` para uma padaria só é YAGNI. Se um dia houver uma segunda loja, isso volta à mesa.

## Limpeza de sobras do Create Next App

Removidos junto, por serem lixo do scaffold que nunca foi usado:

- `app/favicon.ico` (já coberto acima)
- `public/next.svg`, `public/vercel.svg`, `public/globe.svg`, `public/file.svg`, `public/window.svg`

## Verificação

Testes unitários não cobrem metadata. A verificação é observar o resultado:

1. `npm run dev` e inspecionar o `<head>` renderizado — conferir que `title`, `description`, `og:title`, `og:description` e `og:image` saem com os textos acima.
2. Conferir o 🎂 na aba do browser e que `/favicon.ico` deixou de existir.
3. Abrir `/opengraph-image` e ver o mosaico renderizado.
4. Depois do deploy: passar a URL no validador de link do Facebook para estourar o cache do WhatsApp e ver o card real.

**Nota de ambiente:** no Windows o `npm test` falha no teardown do `storage.test.ts` (`EPERM` ao apagar um `.webp` temporário em `public/bolos`). Os 13 testes passam; é incompatibilidade de plataforma, anterior a este trabalho, e não bloqueia nada aqui. O arquivo temporário fica para trás não-rastreado e precisa ser removido à mão.
