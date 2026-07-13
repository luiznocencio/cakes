import type { Cake } from "@/db/schema";
import type { NotificationProvider, NotifyResult, NotifyTarget } from "./types";

/** Provider de teste: registra chamadas e devolve um resultado configurável. */
export class FakeProvider implements NotificationProvider {
  readonly name = "fake";
  public calls: { target: NotifyTarget; cake: Cake }[] = [];

  constructor(
    private result: NotifyResult = { status: "sent", providerMessageId: "fake-1" },
  ) {}

  async notifyBackInStock(
    target: NotifyTarget,
    cake: Cake,
  ): Promise<NotifyResult> {
    this.calls.push({ target, cake });
    return this.result;
  }
}
