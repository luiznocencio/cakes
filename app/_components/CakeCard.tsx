"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { joinWaitlistAction, type JoinState } from "@/app/actions";
import { formatBRL } from "@/lib/money";

type PublicCake = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

const initial: JoinState = { ok: false };

export function CakeCard({ cake }: { cake: PublicCake }) {
  const available = cake.quantity > 0;
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    joinWaitlistAction,
    initial,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {cake.imageUrl && (
        <div className="relative aspect-[4/3] w-full bg-stone-100">
          <Image
            src={cake.imageUrl}
            alt={cake.name}
            fill
            sizes="(max-width: 512px) 100vw, 512px"
            className={`object-cover ${available ? "" : "grayscale-[35%] opacity-90"}`}
          />
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-sm font-semibold shadow ${
              available
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-800/80 text-white"
            }`}
          >
            {available ? `Disponível (${cake.quantity})` : "Esgotado"}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-tight">{cake.name}</h2>
          {cake.price > 0 && (
            <span className="shrink-0 text-lg font-bold text-brand">
              {formatBRL(cake.price)}
            </span>
          )}
        </div>
        {cake.description && (
          <p className="mt-1 text-sm text-muted">{cake.description}</p>
        )}

        {!available && !state.ok && (
          <div className="mt-4">
            {!open ? (
              <button
                onClick={() => setOpen(true)}
                className="w-full rounded-xl bg-brand px-4 py-3 text-center font-semibold text-brand-ink active:scale-[0.99]"
              >
                🔔 Avisar quando chegar
              </button>
            ) : (
              <form action={formAction} className="mt-2 space-y-3">
                <input type="hidden" name="cakeId" value={cake.id} />
                <input
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="Seu WhatsApp com DDD"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand"
                />
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Seu nome (opcional)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-brand"
                />
                <label className="flex items-start gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    className="mt-1"
                  />
                  <span>
                    Concordo em receber uma mensagem no WhatsApp quando este bolo
                    voltar. Meu número será usado só para esse aviso.
                  </span>
                </label>
                {state.error && (
                  <p className="text-sm font-medium text-red-600">
                    {state.error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-xl bg-brand px-4 py-3 font-semibold text-brand-ink disabled:opacity-60"
                  >
                    {pending ? "Salvando…" : "Quero ser avisado"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-border px-4 py-3 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {state.ok && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            ✅ Prontinho! Vamos te avisar no WhatsApp assim que o {cake.name}{" "}
            voltar.
          </p>
        )}
      </div>
    </div>
  );
}
