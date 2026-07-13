import type { Cake, NotificationStatus } from "@/db/schema";

export type NotifyTarget = {
  waitlistId: number;
  cakeId: number;
  phone: string;
  name: string | null;
};

export type NotifyResult = {
  status: NotificationStatus;
  providerMessageId?: string;
  error?: string;
};

/**
 * Contrato do motor de notificação. Trocável por env `NOTIFY_PROVIDER`:
 * `assisted` (interim, cria pendência para envio manual) ou `whatsapp_cloud`
 * (envio automático via Meta). Testes usam o FakeProvider.
 */
export interface NotificationProvider {
  readonly name: string;
  notifyBackInStock(target: NotifyTarget, cake: Cake): Promise<NotifyResult>;
}
