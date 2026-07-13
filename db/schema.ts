import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Catálogo de bolos. `quantity` é denormalizada para leitura rápida do site
 * público; a fonte de verdade auditável são os `stock_events`.
 */
export const cakes = pgTable("cakes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  // Preço em centavos (ex.: 1800 = R$ 18,00). Evita imprecisão de float.
  price: integer("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StockEventType =
  | "fornada"
  | "venda"
  | "reabastecimento"
  | "ajuste";

/** Log append-only de toda mudança de estoque. Habilita "desfazer" e relatórios. */
export const stockEvents = pgTable("stock_events", {
  id: serial("id").primaryKey(),
  cakeId: integer("cake_id")
    .notNull()
    .references(() => cakes.id),
  delta: integer("delta").notNull(),
  type: text("type").notNull().$type<StockEventType>(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type WaitlistStatus = "waiting" | "notified" | "cancelled";

/** Fila de espera capturada no site público (opt-in LGPD via `consent`). */
export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    cakeId: integer("cake_id")
      .notNull()
      .references(() => cakes.id),
    phone: text("phone").notNull(),
    name: text("name"),
    consent: boolean("consent").notNull().default(false),
    status: text("status").notNull().default("waiting").$type<WaitlistStatus>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
  },
  (t) => [
    // Dedup: um telefone só entra uma vez por bolo enquanto ainda aguarda.
    uniqueIndex("waitlist_cake_phone_waiting")
      .on(t.cakeId, t.phone)
      .where(sql`status = 'waiting'`),
  ],
);

export type NotificationStatus =
  | "queued"
  | "sent"
  | "failed"
  | "assisted_pending"
  | "assisted_done";

/** Registro de cada tentativa de aviso, seja assistido ou via WhatsApp Cloud. */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  waitlistId: integer("waitlist_id")
    .notNull()
    .references(() => waitlist.id),
  cakeId: integer("cake_id")
    .notNull()
    .references(() => cakes.id),
  phone: text("phone").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull().$type<NotificationStatus>(),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type Cake = typeof cakes.$inferSelect;
export type Waitlist = typeof waitlist.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
