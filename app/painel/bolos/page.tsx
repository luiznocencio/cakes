import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listCakes } from "@/lib/stock";
import { createCakeAction, setPriceAction, toggleCakeAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BolosPage() {
  if (!(await isAuthenticated())) redirect("/painel/login");

  const cakes = await listCakes();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bolos</h1>
        <Link href="/painel" className="text-sm text-muted underline">
          ← Balcão
        </Link>
      </div>

      <form
        action={createCakeAction}
        className="mb-6 space-y-2 rounded-2xl border border-border bg-card p-4"
      >
        <p className="font-semibold">Novo bolo</p>
        <input
          name="name"
          required
          placeholder="Nome do bolo"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand"
        />
        <input
          name="description"
          placeholder="Descrição (opcional)"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand"
        />
        <input
          name="price"
          inputMode="decimal"
          placeholder="Preço (ex.: 18,00)"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand"
        />
        <button className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-brand-ink">
          Adicionar
        </button>
      </form>

      <ul className="space-y-2">
        {cakes.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <p className="text-xs text-muted">
                {c.active ? "Ativo no site" : "Oculto"} · {c.quantity} em estoque
              </p>
              <form
                action={setPriceAction.bind(null, c.id)}
                className="mt-1 flex items-center gap-1"
              >
                <span className="text-xs text-muted">R$</span>
                <input
                  name="price"
                  inputMode="decimal"
                  defaultValue={(c.price / 100).toFixed(2).replace(".", ",")}
                  className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
                <button className="rounded-md border border-border px-2 py-1 text-xs">
                  Salvar
                </button>
              </form>
            </div>
            <form action={toggleCakeAction.bind(null, c.id, !c.active)}>
              <button className="rounded-lg border border-border px-3 py-2 text-sm">
                {c.active ? "Ocultar" : "Ativar"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
