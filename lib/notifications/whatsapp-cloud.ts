import type { Cake } from "@/db/schema";
import type { NotificationProvider, NotifyResult, NotifyTarget } from "./types";

type Config = {
  token: string;
  phoneNumberId: string;
  template: string;
  lang: string;
  graphVersion: string;
};

/**
 * Envio automático via WhatsApp Business Cloud API (Graph API).
 * Só é instanciado quando `NOTIFY_PROVIDER=whatsapp_cloud`. Requer as env vars
 * abaixo, disponíveis apenas após a verificação Meta + template aprovado.
 *
 * Template esperado (2 parâmetros no body): {{1}} = nome, {{2}} = nome do bolo.
 */
export class WhatsAppCloudProvider implements NotificationProvider {
  readonly name = "whatsapp_cloud";
  private cfg: Config;

  constructor(cfg?: Partial<Config>) {
    this.cfg = {
      token: process.env.WHATSAPP_TOKEN ?? "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      template: process.env.WHATSAPP_TEMPLATE ?? "bolo_disponivel",
      lang: process.env.WHATSAPP_TEMPLATE_LANG ?? "pt_BR",
      graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0",
      ...cfg,
    };
  }

  async notifyBackInStock(
    target: NotifyTarget,
    cake: Cake,
  ): Promise<NotifyResult> {
    if (!this.cfg.token || !this.cfg.phoneNumberId) {
      return { status: "failed", error: "WhatsApp Cloud não configurado" };
    }
    try {
      const url = `https://graph.facebook.com/${this.cfg.graphVersion}/${this.cfg.phoneNumberId}/messages`;
      const body = {
        messaging_product: "whatsapp",
        to: target.phone,
        type: "template",
        template: {
          name: this.cfg.template,
          language: { code: this.cfg.lang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: target.name ?? "" },
                { type: "text", text: cake.name },
              ],
            },
          ],
        },
      };
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cfg.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: "failed",
          error: JSON.stringify(json?.error ?? json ?? { httpStatus: res.status }),
        };
      }
      return {
        status: "sent",
        providerMessageId: json?.messages?.[0]?.id,
      };
    } catch (e) {
      return { status: "failed", error: (e as Error).message };
    }
  }
}
