import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listCakes } from "@/lib/stock";
import { SubmitButton } from "../../_components/SubmitButton";
import { saveCakeDetailsAction, toggleCakeAction } from "../actions";
import { ChangePhotoForm, NewCakeForm } from "./_forms";

export const dynamic = "force-dynamic";

export default async function BolosPage() {
  if (!(await isAuthenticated())) redirect("/painel/login");

  const cakes = await listCakes();

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <h1 className="display text-2xl font-semibold">Bolos</h1>
          <Link href="/painel" className="text-sm text-muted underline hover:text-wine">
            ← Balcão
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <NewCakeForm />

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cakes.map((c) => (
              <li
                key={c.id}
                className="space-y-3 rounded-xl border border-line bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {c.active ? "Aparece no site" : "Escondido do site"} ·{" "}
                      {c.quantity} na vitrine
                    </p>
                  </div>
                  <form action={toggleCakeAction.bind(null, c.id, !c.active)}>
                    <SubmitButton
                      aria-label={`${c.active ? "Esconder" : "Mostrar"} ${c.name} no site`}
                      className="btn-ghost shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-medium"
                    >
                      {c.active ? "Esconder" : "Mostrar"}
                    </SubmitButton>
                  </form>
                </div>

                <ChangePhotoForm
                  cakeId={c.id}
                  imageUrl={c.imageUrl}
                  name={c.name}
                />

                <form
                  action={saveCakeDetailsAction.bind(null, c.id)}
                  className="space-y-2"
                >
                  <input
                    name="description"
                    defaultValue={c.description ?? ""}
                    placeholder="Sabores / descrição"
                    className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">R$</span>
                    <input
                      name="price"
                      inputMode="decimal"
                      defaultValue={(c.price / 100).toFixed(2).replace(".", ",")}
                      aria-label={`Preço de ${c.name}`}
                      className="w-24 rounded-lg border border-line bg-paper px-2 py-2 text-sm tabular-nums"
                    />
                    <SubmitButton
                      aria-label={`Salvar preço e descrição de ${c.name}`}
                      className="btn-ghost rounded-lg border border-line px-3 py-2 text-sm font-semibold"
                    >
                      Salvar
                    </SubmitButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
