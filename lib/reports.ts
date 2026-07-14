import "server-only";
import { and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { cakes, stockEvents, waitlist, type Cake } from "@/db/schema";

export type Period = "hoje" | "7d" | "30d";

export const PERIOD_LABEL: Record<Period, string> = {
  hoje: "hoje",
  "7d": "nos últimos 7 dias",
  "30d": "nos últimos 30 dias",
};

export function periodStart(period: Period): Date {
  const now = new Date();
  if (period === "hoje") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = period === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/** Vendas por bolo (delta de `venda` é negativo, então invertemos). */
async function soldByCake(from: Date): Promise<Map<number, number>> {
  const rows = await db
    .select({
      cakeId: stockEvents.cakeId,
      qty: sql<number>`coalesce(sum(-${stockEvents.delta}), 0)::int`,
    })
    .from(stockEvents)
    .where(
      and(sql`${stockEvents.type} = 'venda'`, gte(stockEvents.createdAt, from)),
    )
    .groupBy(stockEvents.cakeId);
  return new Map(rows.map((r) => [r.cakeId, Number(r.qty)]));
}

/**
 * Produção por bolo: tudo que ENTROU na vitrine. Inclui `reabastecimento`
 * porque é o tipo antigo, de quando "repor" e "fornada" eram ações separadas.
 * Ajustes de correção não contam como produção.
 */
async function producedByCake(from: Date): Promise<Map<number, number>> {
  const rows = await db
    .select({
      cakeId: stockEvents.cakeId,
      qty: sql<number>`coalesce(sum(${stockEvents.delta}), 0)::int`,
    })
    .from(stockEvents)
    .where(
      and(
        sql`${stockEvents.type} in ('fornada','reabastecimento')`,
        sql`${stockEvents.delta} > 0`,
        gte(stockEvents.createdAt, from),
      ),
    )
    .groupBy(stockEvents.cakeId);
  return new Map(rows.map((r) => [r.cakeId, Number(r.qty)]));
}

/** Procura reprimida: gente que entrou na fila (ou seja, chegou e não tinha). */
async function demandByCake(from: Date): Promise<Map<number, number>> {
  const rows = await db
    .select({
      cakeId: waitlist.cakeId,
      people: sql<number>`count(*)::int`,
    })
    .from(waitlist)
    .where(gte(waitlist.createdAt, from))
    .groupBy(waitlist.cakeId);
  return new Map(rows.map((r) => [r.cakeId, Number(r.people)]));
}

export type ReportRow = {
  cake: Cake;
  sold: number;
  produced: number;
  /** produced - sold: positivo = sobrou; 0 = vendeu tudo. */
  leftover: number;
  /** Pessoas que pediram aviso — demanda que você não atendeu. */
  waiting: number;
  revenue: number;
};

export type Report = {
  period: Period;
  rows: ReportRow[];
  totalSold: number;
  totalProduced: number;
  totalRevenue: number;
  totalWaiting: number;
};

export async function getReport(period: Period): Promise<Report> {
  const from = periodStart(period);
  const [all, sold, produced, demand] = await Promise.all([
    db.select().from(cakes).orderBy(cakes.sortOrder, cakes.id),
    soldByCake(from),
    producedByCake(from),
    demandByCake(from),
  ]);

  const rows: ReportRow[] = all.map((cake) => {
    const s = sold.get(cake.id) ?? 0;
    const p = produced.get(cake.id) ?? 0;
    return {
      cake,
      sold: s,
      produced: p,
      leftover: p - s,
      waiting: demand.get(cake.id) ?? 0,
      revenue: s * cake.price,
    };
  });

  return {
    period,
    rows,
    totalSold: rows.reduce((a, r) => a + r.sold, 0),
    totalProduced: rows.reduce((a, r) => a + r.produced, 0),
    totalRevenue: rows.reduce((a, r) => a + r.revenue, 0),
    totalWaiting: rows.reduce((a, r) => a + r.waiting, 0),
  };
}

/** Vendidos hoje, por bolo — usado no resumo do painel. */
export async function soldToday(): Promise<Map<number, number>> {
  return soldByCake(periodStart("hoje"));
}
