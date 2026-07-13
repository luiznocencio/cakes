import type { NotificationProvider, NotifyResult } from "./types";

/**
 * Fallback assistido: não envia sozinho. Cria uma pendência que aparece na
 * central de avisos do painel, onde o balcão dispara via link wa.me em 1 toque.
 * Mantém o produto 100% funcional enquanto a aprovação Meta não sai.
 */
export class AssistedProvider implements NotificationProvider {
  readonly name = "assisted";

  async notifyBackInStock(): Promise<NotifyResult> {
    return { status: "assisted_pending" };
  }
}
