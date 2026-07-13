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
import { listCakes } from "@/lib/stock";
import {
  addOneAction,
  bakeAction,
  logoutAction,
  markAllDoneAction,
  markDoneAction,
  restockAction,
  sellAction,
  setQtyAction,
  undoAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  if (!(await isAuthenticated())) redirect("/painel/login");

  const cakes = (await listCakes()).filter((c) => c.active);
  const pending = await listPendingAssisted();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Balcão</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/painel/bolos" className="underline text-muted">
            Bolos
          </Link>
          <form action={logoutAction}>
            <button className="text-muted underline">Sair</button>
          </form>
        </div>
      </div>

      {/* Central de avisos */}
      {pending.length > 0 && (
        <section className="mb-6 rounded-2xl border-2 border-brand bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              🎂 {pending.length} aviso(s) para enviar
            </h2>
            <form action={markAllDoneAction}>
              <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-ink">
                Marcar todos
              </button>
            </form>
          </div>
          <p className="mt-1 text-xs text-muted">
            Toque em “Enviar” para abrir o WhatsApp com a mensagem pronta, depois
            marque como avisado.
          </p>
          <ul className="mt-3 space-y-2">
            {pending.map((p) => (
              <li
                key={p.notificationId}
                className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.name ? p.name : "Cliente"} · {p.cakeName}
                  </p>
                  <p className="text-xs text-muted">{formatPhoneBR(p.phone)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={waMeLink(p.phone, buildAssistedMessage(p.cakeName))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Enviar
                  </a>
                  <form action={markDoneAction.bind(null, p.notificationId)}>
                    <button className="rounded-lg border border-border px-2 py-1.5 text-sm">
                      ✓
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Estoque */}
      <div className="space-y-3">
        {cakes.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">{c.name}</p>
                  <p className="text-sm text-muted">
                    {c.price > 0 && (
                      <span className="font-medium text-foreground">
                        {formatBRL(c.price)}
                      </span>
                    )}
                    {c.price > 0 && " · "}
                    {c.quantity > 0 ? `${c.quantity} em estoque` : "Esgotado"}
                  </p>
                </div>
              </div>
              <form action={sellAction.bind(null, c.id)}>
                <button
                  disabled={c.quantity === 0}
                  className="rounded-xl bg-brand px-5 py-3 text-lg font-bold text-brand-ink disabled:opacity-40"
                >
                  −1 venda
                </button>
              </form>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted">
                Mais ações
              </summary>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <form action={addOneAction.bind(null, c.id)}>
                    <button className="rounded-lg border border-border px-3 py-2 text-sm">
                      +1
                    </button>
                  </form>
                  <form action={undoAction.bind(null, c.id)}>
                    <button className="rounded-lg border border-border px-3 py-2 text-sm">
                      Desfazer último
                    </button>
                  </form>
                </div>
                <QtyForm
                  action={bakeAction.bind(null, c.id)}
                  label="Nova fornada (+)"
                  placeholder="Qtd"
                />
                <QtyForm
                  action={restockAction.bind(null, c.id)}
                  label="Repor (+)"
                  placeholder="Qtd"
                />
                <QtyForm
                  action={setQtyAction.bind(null, c.id)}
                  label="Ajustar para exato"
                  placeholder="Valor"
                />
              </div>
            </details>
          </div>
        ))}
      </div>

      {cakes.length === 0 && (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-muted">
          Nenhum bolo ativo.{" "}
          <Link href="/painel/bolos" className="underline">
            Cadastrar bolos
          </Link>
          .
        </p>
      )}
    </main>
  );
}

function QtyForm({
  action,
  label,
  placeholder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  placeholder: string;
}) {
  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="qty"
        type="number"
        min="0"
        inputMode="numeric"
        required
        placeholder={placeholder}
        className="w-20 rounded-lg border border-border bg-background px-2 py-2 text-sm"
      />
      <button className="rounded-lg border border-border px-3 py-2 text-sm">
        {label}
      </button>
    </form>
  );
}
