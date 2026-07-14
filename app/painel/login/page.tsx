"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="display text-2xl font-semibold">Área do balcão</h1>
      <p className="mt-1 text-sm text-muted">Entre com a senha da equipe.</p>

      <form action={formAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Senha"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-wine"
        />
        {state.error && (
          <p className="text-sm font-medium text-wine">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-wine px-4 py-3 font-bold text-wine-ink disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
