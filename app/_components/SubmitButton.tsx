"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botão de submit que conhece o estado do próprio form.
 *
 * No balcão isso evita um erro real: sem retorno visível, o lojista toca de
 * novo no "−1" e registra uma venda que não aconteceu. Enquanto a action roda,
 * o botão fica desabilitado e apagado.
 */
export function SubmitButton({
  children,
  className = "",
  disabled,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      data-pending={pending ? "" : undefined}
      className={`btn ${className}`}
    >
      {children}
    </button>
  );
}
