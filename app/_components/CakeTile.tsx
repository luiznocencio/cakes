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

  const content = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
        {cake.imageUrl && (
          <Image
            src={cake.imageUrl}
            alt=""
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
            className={
              available
                ? "object-cover"
                : "object-cover saturate-[.35] brightness-[.62]"
            }
          />
        )}

        {/* Etiqueta no vidro: ouro = tem hoje. */}
        {available ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--v-gold)] px-2.5 py-1 text-xs font-bold tabular-nums text-[#22160f] shadow">
            {cake.quantity} na vitrine
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--v-muted)] backdrop-blur-sm">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 text-left">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--v-cream)]">
          {cake.name}
        </h2>
        {cake.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--v-muted)]">
            {cake.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          {cake.price > 0 && (
            <span className="v-display text-base font-semibold tabular-nums text-[var(--v-cream)]">
              {formatBRL(cake.price)}
            </span>
          )}
          {!available && (
            <span className="flex items-center gap-1 text-xs font-bold text-[var(--v-gold)]">
              🔔 Avisar
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {available ? (
        <div className="v-tile flex flex-col overflow-hidden rounded-xl">
          {content}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Avisar quando ${cake.name} voltar`}
          className="v-tile v-trigger flex flex-col overflow-hidden rounded-xl text-left transition hover:border-[var(--v-gold)] active:scale-[0.99]"
        >
          {content}
        </button>
      )}

      {open && (
        <WaitlistDialog cake={cake} onClose={() => setOpen(false)} />
      )}
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
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      // Fecha só quando o clique é no fundo, nunca em algo dentro do diálogo.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`t-${cake.id}`}
        className="v-dialog w-full max-w-sm rounded-t-2xl border border-[var(--v-line)] bg-[var(--v-surface)] p-5 sm:rounded-2xl"
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
              className="v-display text-lg font-semibold leading-tight text-[var(--v-cream)]"
            >
              {cake.name}
            </h2>
            {cake.price > 0 && (
              <p className="text-sm font-semibold tabular-nums text-[var(--v-gold)]">
                {formatBRL(cake.price)}
              </p>
            )}
          </div>
        </div>

        {state.ok ? (
          <div className="mt-5">
            <p className="text-sm text-[var(--v-cream)]">
              ✅ Pronto. Te chamamos no WhatsApp assim que este bolo sair do
              forno.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-[var(--v-gold)] px-4 py-3 font-bold text-[#22160f]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form action={formAction} className="mt-5 space-y-3">
            <input type="hidden" name="cakeId" value={cake.id} />
            <p className="text-sm text-[var(--v-muted)]">
              Deixe seu WhatsApp e avisamos quando voltar. É por ordem de
              chegada.
            </p>
            <input
              ref={phoneRef}
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="WhatsApp com DDD"
              className="w-full rounded-xl border border-[var(--v-line)] bg-[var(--v-bg)] px-4 py-3 text-[var(--v-cream)] outline-none placeholder:text-[var(--v-muted)] focus:border-[var(--v-gold)]"
            />
            <input
              name="name"
              autoComplete="name"
              placeholder="Seu nome (opcional)"
              className="w-full rounded-xl border border-[var(--v-line)] bg-[var(--v-bg)] px-4 py-3 text-[var(--v-cream)] outline-none placeholder:text-[var(--v-muted)] focus:border-[var(--v-gold)]"
            />
            <label className="flex items-start gap-2 text-xs text-[var(--v-muted)]">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>
                Concordo em receber uma mensagem no WhatsApp sobre este bolo. Seu
                número é usado só para esse aviso.
              </span>
            </label>
            {state.error && (
              <p className="text-sm font-medium text-[#ff9c8f]">{state.error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-[var(--v-gold)] px-4 py-3 font-bold text-[#22160f] disabled:opacity-60"
              >
                {pending ? "Salvando…" : "Quero ser avisado"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--v-line)] px-4 py-3 text-sm font-medium text-[var(--v-muted)]"
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
