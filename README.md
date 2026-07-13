# Avisa Bolo 🎂

MVP para uma padaria: o cliente vê **quais bolos estão disponíveis agora** e pede
para ser **avisado no WhatsApp** quando o favorito voltar. O balcão opera em
pouquíssimos toques e os avisos disparam sozinhos.

- **Site público** (`/`) — lista de bolos com status `Disponível (N)` / `Esgotado` e
  botão “Avisar quando chegar” (captura WhatsApp com opt-in LGPD).
- **Painel do balcão** (`/painel`) — 1 toque por venda (`−1`), nova fornada, repor,
  ajustar, desfazer. Central de avisos quando um bolo volta do zero.
- **Motor de notificação** trocável: `assisted` (envio manual assistido, funciona já)
  ou `whatsapp_cloud` (envio automático via Meta, quando aprovado).

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind v4 · Drizzle ORM · PGlite (dev) /
Neon Postgres (prod) · TypeScript. Testes em Vitest.

## Rodando local

```bash
npm install
npm run db:setup   # migra + popula bolos de exemplo (PGlite local)
npm run dev        # http://localhost:3000
npm test           # testes do núcleo
```

Sem `DATABASE_URL`, o app usa **PGlite** (Postgres embutido) salvo em
`~/.avisa-bolo/pglite` — zero setup. Senha padrão do painel: `bolo123` (veja `.env.local`).

> ⚠️ **Caminho do projeto:** ferramentas Node (PGlite/wasm, alguns bundlers) quebram
> quando o caminho contém `#`, espaços ou fica em volume externo que gera arquivos
> `._*` (AppleDouble). Por isso a cópia de trabalho fica em `~/avisa-bolo`. Para rodar
> a partir de outra pasta com `#`, aponte `PGLITE_DIR` para um caminho absoluto “limpo”
> ou defina `DATABASE_URL` (Neon). Em produção nada disso importa (usa Neon).

## Variáveis de ambiente

Veja `.env.example`. Principais:

| Var | Uso |
|---|---|
| `DATABASE_URL` | Postgres (Neon) em produção. Vazio = PGlite local. |
| `STAFF_PASSWORD` | Senha única do painel. |
| `SESSION_SECRET` | Assina o cookie de sessão do balcão. |
| `STORE_NAME` | Nome da loja (site + mensagens). |
| `NOTIFY_PROVIDER` | `assisted` (padrão) ou `whatsapp_cloud`. |
| `WHATSAPP_*` | Credenciais do Cloud API (só no modo `whatsapp_cloud`). |

## Fluxo de notificação

Quando um bolo passa de **0 → >0** (fornada/repor), o gatilho enfileira um aviso para
cada pessoa na fila:

- **assisted**: cria uma pendência na central do painel com link `wa.me` e mensagem
  pronta — o balcão envia em 1 toque e marca como avisado.
- **whatsapp_cloud**: envia o template automaticamente via Graph API.

Quem já foi avisado sai da fila e não é notificado de novo em reabastecimentos seguintes.

## WhatsApp Business — destravar cedo (é o gargalo)

A verificação Meta leva **semanas** e normalmente exige **CNPJ**. Comece no dia 1;
enquanto isso o modo `assisted` mantém o produto 100% funcional.

1. Criar **Meta Business Account** (dados do negócio / CNPJ).
2. **Verificação de negócio** (envio de documentos) — semanas.
3. Em **WhatsApp Business Platform**: número dedicado (fora do app comum), obter
   `WABA ID`, `phone number ID` e um **token permanente** (system user).
4. Criar e submeter um **template utility** (2 parâmetros: `{{1}}` nome, `{{2}}` bolo).
   Sugestão: *“Oi {{1}}! O bolo {{2}} que você queria já está disponível na [Padaria].
   É por ordem de chegada 🎂”*. A Meta pode reclassificar como Marketing (mais caro).
5. Preencher `WHATSAPP_*`, setar `NOTIFY_PROVIDER=whatsapp_cloud` e reiniciar.

**Custos:** cobrança por mensagem de template **entregue** (utility barato, marketing
mais caro no Brasil). Mensagem não entregue não é cobrada. Opt-in do cliente é obrigatório.

## Deploy (GitHub + Vercel + Neon)

O banco é montado sozinho no deploy: o passo de build (`scripts/prebuild-db.ts`)
aplica as migrações e faz o seed do catálogo **quando existe `DATABASE_URL`**.

1. **GitHub** — crie um repositório vazio e envie o código:
   ```bash
   git remote add origin git@github.com:SEU_USUARIO/avisa-bolo.git
   git push -u origin main
   ```
2. **Vercel** — em vercel.com, *Add New → Project* e importe o repositório.
3. **Banco (Neon)** — no projeto da Vercel: *Storage → Create Database →
   Postgres (Neon)*. A Vercel injeta `DATABASE_URL` automaticamente.
4. **Env vars** (Project → Settings → Environment Variables):
   - `STAFF_PASSWORD` — senha do painel
   - `SESSION_SECRET` — string aleatória longa (`openssl rand -base64 32`)
   - `STORE_NAME` — `Primu's Bolos`
   - `NOTIFY_PROVIDER` — `assisted`
5. **Redeploy** (Deployments → ⋯ → Redeploy). O build migra + popula o Neon.
6. Depois: trocar `NOTIFY_PROVIDER` para `whatsapp_cloud` quando a Meta aprovar.

> Alternativa sem esperar a Vercel: rodar as migrações localmente contra o Neon
> com `DATABASE_URL="postgres://..." npm run db:setup`.

## Estrutura

```
app/                 site público (/) e painel (/painel, /painel/bolos, /painel/login)
lib/stock.ts         ações de estoque (transacionais) + gatilho 0→>0
lib/notifications/   provider trocável (assisted / whatsapp-cloud / fake) + central
lib/waitlist.ts      inscrição na fila (consentimento + dedup)
lib/auth.ts          senha única + sessão por cookie assinado
db/                  schema Drizzle, seleção de driver, migrate, seed
test/                testes do núcleo (Vitest)
```
