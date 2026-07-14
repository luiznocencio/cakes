import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { formatBRL } from "@/lib/money";
import {
  buildAssistedMessage,
  listPendingAssisted,
  waMeLink,
} from "@/lib/notifications";
import { formatPhoneBR } from "@/lib/phone";
import { soldToday } from "@/lib/reports";
import { listCakes } from "@/lib/stock";
import { SubmitButton } from "../_components/SubmitButton";
import {
  addOneAction,
  addStockAction,
  logoutAction,
  markAllDoneAction,
  markDoneAction,
  sellAction,
  setQtyAction,
  undoAction,
} from "./actions";

export const dynamic = "force-dynamic";

// Tamanhos de fornada mais comuns — evita digitar no meio do movimento.
const QUICK_ADD = [5, 10, 20];

export default async function PainelPage() {
  if (!(await isAuthenticated())) redirect("/painel/login");

  const cakes = (await listCakes()).filter((c) => c.active);
  const pending = await listPendingAssisted();
  const sold = await soldToday();

  const vendidosHoje = [...sold.values()].reduce((a, b) => a + b, 0);
  const naVitrine = cakes.reduce((a, c) => a + c.quantity, 0);
  const esgotados = cakes.filter((c) => c.quantity === 0).length;

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-2xl font-semibold">Balcão</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/painel/relatorios" className="underline text-muted hover:text-wine">
              Relatórios
            </Link>
            <Link href="/painel/bolos" className="underline text-muted hover:text-wine">
              Bolos
            </Link>
            <form action={logoutAction}>
              <button className="btn text-muted underline hover:text-wine">
                Sair
              </button>
            </form>
          </nav>
        </header>

        {/* Como está o dia, em uma linha. */}
        <dl className="mb-5 grid grid-cols-3 gap-3 rounded-xl border border-line bg-card p-4">
          <Stat label="Vendidos hoje" value={vendidosHoje} />
          <Stat label="Na vitrine" value={naVitrine} />
          <Stat label="Esgotados" value={esgotados} tone={esgotados > 0 ? "alert" : "normal"} />
        </dl>

        {pending.length > 0 && (
          <section className="mb-6 rounded-xl border-2 border-wine bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                {pending.length === 1
                  ? "1 pessoa esperando aviso"
                  : `${pending.length} pessoas esperando aviso`}
              </h2>
              <form action={markAllDoneAction}>
                <SubmitButton className="rounded-lg bg-wine px-3 py-1.5 text-sm font-semibold text-wine-ink">
                  Marcar todos como avisados
                </SubmitButton>
              </form>
            </div>
            <p className="mt-1 text-xs text-muted">
              Toque em Enviar: abre o WhatsApp com a mensagem pronta. Depois marque
              como avisado.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {pending.map((p) => (
                <li
                  key={p.notificationId}
                  // min-w-0: item de grid não encolhe sozinho, e o truncate do
                  // nome não funcionaria — os botões vazavam do card.
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.name ?? "Cliente"} · {p.cakeName}
                    </p>
                    <p className="text-xs text-muted">{formatPhoneBR(p.phone)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={waMeLink(p.phone, buildAssistedMessage(p.cakeName))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Enviar
                    </a>
                    <form action={markDoneAction.bind(null, p.notificationId)}>
                      <SubmitButton
                        aria-label={`Marcar ${p.name ?? "cliente"} como avisado`}
                        className="btn-ghost rounded-lg border border-line px-2.5 py-1.5 text-sm"
                      >
                        ✓
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Os contadores. Um por bolo. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cakes.map((c) => (
            <div key={c.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-center gap-3">
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">{c.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatBRL(c.price)} · {sold.get(c.id) ?? 0} vendidos hoje
                  </p>
                </div>
              </div>

              {/* O contador: o gesto principal do dia. */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <form action={sellAction.bind(null, c.id)} className="contents">
                  <SubmitButton
                    disabled={c.quantity === 0}
                    aria-label={`Vendi um ${c.name}`}
                    className="h-16 w-20 rounded-xl bg-wine text-3xl font-bold text-wine-ink"
                  >
                    −
                  </SubmitButton>
                </form>

                <div className="text-center">
                  <p
                    className={`display text-4xl font-bold tabular-nums ${
                      c.quantity === 0 ? "text-muted" : ""
                    }`}
                  >
                    {c.quantity}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    {c.quantity === 0 ? "esgotado" : "na vitrine"}
                  </p>
                </div>

                <form action={addOneAction.bind(null, c.id)} className="contents">
                  <SubmitButton
                    aria-label={`Entrou um ${c.name}`}
                    className="btn-ghost h-16 w-20 rounded-xl border-2 border-wine text-3xl font-bold text-wine"
                  >
                    +
                  </SubmitButton>
                </form>
              </div>

              {/* Entrou fornada. Uma ação só (antes eram "fornada" e "repor"). */}
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-medium text-muted">Saiu do forno</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {QUICK_ADD.map((n) => (
                    <form key={n} action={addStockAction.bind(null, c.id)}>
                      <input type="hidden" name="qty" value={n} />
                      <SubmitButton
                        aria-label={`Entraram ${n} ${c.name}`}
                        className="rounded-lg bg-gold-soft px-3 py-2 text-sm font-bold text-ink"
                      >
                        +{n}
                      </SubmitButton>
                    </form>
                  ))}
                  <form
                    action={addStockAction.bind(null, c.id)}
                    className="flex items-center gap-1"
                  >
                    <input
                      name="qty"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      required
                      aria-label={`Quantos ${c.name} entraram`}
                      placeholder="outro"
                      className="w-20 rounded-lg border border-line bg-paper px-2 py-2 text-sm"
                    />
                    <SubmitButton className="btn-ghost rounded-lg border border-line px-2.5 py-2 text-sm font-semibold">
                      OK
                    </SubmitButton>
                  </form>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted">
                    Errei alguma coisa
                  </summary>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={undoAction.bind(null, c.id)}>
                      <SubmitButton className="btn-ghost rounded-lg border border-line px-3 py-2 text-sm">
                        Desfazer último
                      </SubmitButton>
                    </form>
                    <form
                      action={setQtyAction.bind(null, c.id)}
                      className="flex items-center gap-1"
                    >
                      <input
                        name="qty"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        required
                        aria-label="Contagem correta"
                        placeholder="tem N"
                        className="w-20 rounded-lg border border-line bg-paper px-2 py-2 text-sm"
                      />
                      <SubmitButton className="btn-ghost rounded-lg border border-line px-2.5 py-2 text-sm">
                        Corrigir
                      </SubmitButton>
                    </form>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>

        {cakes.length === 0 && (
          <p className="rounded-xl border border-line bg-card p-6 text-center text-muted">
            Nenhum bolo ativo.{" "}
            <Link href="/painel/bolos" className="underline text-wine">
              Cadastrar o primeiro
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: number;
  tone?: "normal" | "alert";
}) {
  return (
    <div>
      <dd
        className={`display text-2xl font-bold tabular-nums ${
          tone === "alert" ? "text-wine" : ""
        }`}
      >
        {value}
      </dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}
