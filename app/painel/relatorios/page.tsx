import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { formatBRL } from "@/lib/money";
import { getReport, PERIOD_LABEL, type Period } from "@/lib/reports";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["hoje", "7d", "30d"];
const TAB_LABEL: Record<Period, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/painel/login");

  const sp = await searchParams;
  const period: Period = PERIODS.includes(sp.p as Period)
    ? (sp.p as Period)
    : "hoje";
  const report = await getReport(period);

  // O veredito: o que mudar na próxima fornada.
  const assarMais = report.rows
    .filter((r) => r.waiting > 0)
    .sort((a, b) => b.waiting - a.waiting);
  const assarMenos = report.rows
    .filter((r) => r.leftover > 0 && r.produced > 0)
    .sort((a, b) => b.leftover - a.leftover);

  const maxWaiting = Math.max(1, ...report.rows.map((r) => r.waiting));
  const ranking = report.rows
    .filter((r) => r.sold > 0)
    .sort((a, b) => b.sold - a.sold);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-2xl font-semibold">Relatórios</h1>
          <Link href="/painel" className="text-sm text-muted underline hover:text-wine">
            ← Balcão
          </Link>
        </header>

        <nav className="mb-5 flex gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/painel/relatorios?p=${p}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                p === period
                  ? "bg-wine text-wine-ink"
                  : "border border-line text-muted"
              }`}
            >
              {TAB_LABEL[p]}
            </Link>
          ))}
        </nav>

        <dl className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-4">
          <Stat label="Vendidos" value={String(report.totalSold)} />
          <Stat label="Saíram do forno" value={String(report.totalProduced)} />
          <Stat label="Faturamento" value={formatBRL(report.totalRevenue)} />
          <Stat
            label="Ficaram na fila"
            value={String(report.totalWaiting)}
            tone={report.totalWaiting > 0 ? "alert" : "normal"}
          />
        </dl>

        {/* O veredito — a razão de existir deste relatório. */}
        <section className="mb-6 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border-2 border-gold bg-card p-4">
            <h2 className="display text-lg font-semibold">Assar mais</h2>
            <p className="mt-0.5 text-xs text-muted">
              Gente que chegou {PERIOD_LABEL[period]} e não encontrou.
            </p>
            {assarMais.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Ninguém ficou na fila. Você deu conta da procura.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {assarMais.map((r) => (
                  <li key={r.cake.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{r.cake.name}</span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {r.waiting === 1
                          ? "1 pessoa"
                          : `${r.waiting} pessoas`}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-gold-soft">
                      <div
                        className="h-2 rounded-full bg-gold"
                        style={{ width: `${(r.waiting / maxWaiting) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-line bg-card p-4">
            <h2 className="display text-lg font-semibold">Assar menos</h2>
            <p className="mt-0.5 text-xs text-muted">
              Saiu do forno e não vendeu {PERIOD_LABEL[period]}.
            </p>
            {assarMenos.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Nada sobrando. Tudo que assou, vendeu.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {assarMenos.map((r) => (
                  <li
                    key={r.cake.id}
                    className="flex items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="truncate font-medium">{r.cake.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      sobraram {r.leftover} de {r.produced}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Os números que sustentam o veredito. */}
        <section className="rounded-xl border border-line bg-card">
          <h2 className="display border-b border-line p-4 text-lg font-semibold">
            Bolo a bolo
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3 font-medium">Bolo</th>
                  <th className="p-3 text-right font-medium">Forno</th>
                  <th className="p-3 text-right font-medium">Vendidos</th>
                  <th className="p-3 text-right font-medium">Sobrou</th>
                  <th className="p-3 text-right font-medium">Na fila</th>
                  <th className="p-3 text-right font-medium">Faturou</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 && report.totalProduced === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted">
                      Sem movimento {PERIOD_LABEL[period]}. Registre as fornadas e
                      as vendas no balcão para o relatório encher.
                    </td>
                  </tr>
                ) : (
                  report.rows
                    .filter((r) => r.produced > 0 || r.sold > 0 || r.waiting > 0)
                    .sort((a, b) => b.sold - a.sold)
                    .map((r) => (
                      <tr key={r.cake.id} className="border-b border-line last:border-0">
                        <td className="p-3 font-medium">{r.cake.name}</td>
                        <td className="p-3 text-right tabular-nums">{r.produced}</td>
                        <td className="p-3 text-right font-semibold tabular-nums">
                          {r.sold}
                        </td>
                        <td className="p-3 text-right tabular-nums text-muted">
                          {r.leftover > 0 ? r.leftover : "—"}
                        </td>
                        <td
                          className={`p-3 text-right tabular-nums ${
                            r.waiting > 0 ? "font-semibold text-wine" : "text-muted"
                          }`}
                        >
                          {r.waiting > 0 ? r.waiting : "—"}
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          {formatBRL(r.revenue)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-3 text-xs text-muted">
          Faturamento usa o preço atual do bolo.
        </p>
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
  value: string;
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
