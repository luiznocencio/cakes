import Link from "next/link";
import { listCakes } from "@/lib/stock";
import { CakeCard } from "./_components/CakeCard";

// Estoque muda ao longo do dia — sempre renderizar fresco.
export const dynamic = "force-dynamic";

export default async function Home() {
  const cakes = await listCakes({ onlyActive: true });
  const storeName = process.env.STORE_NAME ?? "Nossa Padaria";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <header className="mb-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted">
          {storeName}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Bolos de hoje 🎂</h1>
        <p className="mt-2 text-sm text-muted">
          Veja o que está fresquinho agora. Esgotou? A gente te avisa no
          WhatsApp quando voltar.
        </p>
      </header>

      {cakes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-muted">
          Ainda não temos bolos cadastrados. Volte já já!
        </p>
      ) : (
        <div className="space-y-4">
          {cakes.map((c) => (
            <CakeCard
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

      <footer className="mt-10 text-center text-xs text-muted">
        <Link href="/painel" className="underline">
          Área do balcão
        </Link>
      </footer>
    </main>
  );
}
