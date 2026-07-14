"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { joinWaitlistAction, type JoinState } from "@/app/actions";
import { formatBRL } from "@/lib/money";

export type PublicCake = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

const initial: JoinState = { ok: false };

export function CakeTile({ cake }: { cake: PublicCake }) {
  const available = cake.quantity > 0;
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-card">
        <div className="relative aspect-[4/3] w-full bg-paper">
          {cake.imageUrl && (
            <Image
              src={cake.imageUrl}
              alt=""
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
              className={
                available ? "object-cover" : "object-cover saturate-50 opacity-70"
              }
            />
          )}
          {available ? (
            <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-xs font-bold tabular-nums text-white shadow-sm">
              {cake.quantity} na vitrine
            </span>
          ) : (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted shadow-sm">
              Esgotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug">
            {cake.name}
          </h2>
          {cake.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
              {cake.description}
            </p>
          )}

          <div className="mt-auto pt-2.5">
            {cake.price > 0 && (
              <p className="display text-base font-semibold tabular-nums">
                {formatBRL(cake.price)}
              </p>
            )}
            {!available && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Avisar quando ${cake.name} chegar`}
                className="mt-2 w-full rounded-lg bg-wine px-3 py-2.5 text-sm font-bold text-wine-ink transition hover:brightness-110 active:scale-[0.99]"
              >
                Avisar quando chegar
              </button>
            )}
          </div>
        </div>
      </div>

      {open && <WaitlistDialog cake={cake} onClose={() => setOpen(false)} />}
    </>
  );
}

function WaitlistDialog({
  cake,
  onClose,
}: {
  cake: PublicCake;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    joinWaitlistAction,
    initial,
  );
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phoneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`t-${cake.id}`}
        className="w-full max-w-sm rounded-t-2xl border border-line bg-card p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3">
          {cake.imageUrl && (
            <Image
              src={cake.imageUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2
              id={`t-${cake.id}`}
              className="display text-lg font-semibold leading-tight"
            >
              {cake.name}
            </h2>
            {cake.price > 0 && (
              <p className="text-sm font-semibold tabular-nums text-wine">
                {formatBRL(cake.price)}
              </p>
            )}
          </div>
        </div>

        {state.ok ? (
          <div className="mt-5">
            <p className="rounded-lg bg-gold-soft px-4 py-3 text-sm font-medium">
              Pronto. Te chamamos no WhatsApp assim que este bolo sair do forno.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-wine px-4 py-3 font-bold text-wine-ink"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form action={formAction} className="mt-5 space-y-3">
            <input type="hidden" name="cakeId" value={cake.id} />
            <p className="text-sm text-muted">
              Deixe seu WhatsApp e avisamos quando voltar. É por ordem de chegada.
            </p>
            <input
              ref={phoneRef}
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="WhatsApp com DDD"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-wine"
            />
            <input
              name="name"
              autoComplete="name"
              placeholder="Seu nome (opcional)"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-wine"
            />
            <label className="flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>
                Concordo em receber uma mensagem no WhatsApp sobre este bolo. Seu
                número é usado só para esse aviso.
              </span>
            </label>
            {state.error && (
              <p className="text-sm font-medium text-wine">{state.error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-wine px-4 py-3 font-bold text-wine-ink disabled:opacity-60"
              >
                {pending ? "Salvando…" : "Quero ser avisado"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line px-4 py-3 text-sm font-medium text-muted"
              >
                Agora não
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
