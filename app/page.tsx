import Link from "next/link";
import { listCakes } from "@/lib/stock";
import { CakeTile } from "./_components/CakeTile";

// Estoque muda ao longo do dia — sempre renderizar fresco.
export const dynamic = "force-dynamic";

export default async function Home() {
  const cakes = await listCakes({ onlyActive: true });
  const storeName = process.env.STORE_NAME ?? "Primu's Bolos";
  const disponiveis = cakes.filter((c) => c.quantity > 0).length;

  return (
    <main className="vitrine flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-7 sm:mb-9">
          <p className="v-display text-2xl font-semibold tracking-tight text-[var(--v-gold)] sm:text-3xl">
            {storeName}
          </p>
          <h1 className="v-display mt-1 text-3xl font-semibold leading-tight text-[var(--v-cream)] sm:text-4xl">
            O que tem na vitrine agora
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--v-muted)]">
            {cakes.length > 0 ? (
              <>
                <strong className="font-bold text-[var(--v-cream)] tabular-nums">
                  {disponiveis} de {cakes.length}
                </strong>{" "}
                saíram do forno. Esgotou o seu? Toque nele e a gente te chama no
                WhatsApp quando voltar.
              </>
            ) : (
              "Ainda não temos bolos cadastrados."
            )}
          </p>
        </header>

        {cakes.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {cakes.map((c) => (
              <CakeTile
                key={c.id}
                cake={{
                  id: c.id,
                  name: c.name,
                  description: c.description,
                  imageUrl: c.imageUrl,
                  price: c.price,
                  quantity: c.quantity,
                }}
              />
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-[var(--v-line)] pt-5 text-xs text-[var(--v-muted)]">
          <Link
            href="/painel"
            className="underline underline-offset-2 hover:text-[var(--v-gold)]"
          >
            Área do balcão
          </Link>
        </footer>
      </div>
    </main>
  );
}
