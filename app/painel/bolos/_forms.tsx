"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  changePhotoAction,
  createCakeAction,
  type CakeFormState,
} from "../actions";

const initial: CakeFormState = {};

/** Escolher arquivo + prévia. O input nativo não mostra a foto; este mostra. */
function PhotoPicker({ label }: { label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="btn btn-ghost rounded-lg border border-line px-3 py-2 text-sm font-medium"
        >
          {label}
        </button>
        <p className="mt-1 text-xs text-muted">JPG, PNG ou WEBP, até 8 MB.</p>
      </div>
      <input
        ref={ref}
        type="file"
        name="photo"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setPreview(f ? URL.createObjectURL(f) : null);
        }}
      />
    </div>
  );
}

export function NewCakeForm() {
  const [state, action, pending] = useActionState(createCakeAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="space-y-3 rounded-xl border border-line bg-card p-4"
    >
      <p className="font-semibold">Novo bolo</p>
      <input
        name="name"
        required
        placeholder="Nome do bolo"
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-wine"
      />
      <input
        name="description"
        placeholder="Sabores / descrição (opcional)"
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-wine"
      />
      <input
        name="price"
        inputMode="decimal"
        placeholder="Preço (ex.: 18,00)"
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-wine"
      />
      <PhotoPicker label="Escolher foto" />
      {state.error && (
        <p className="text-sm font-medium text-wine">{state.error}</p>
      )}
      <button
        disabled={pending}
        data-pending={pending ? "" : undefined}
        className="btn w-full rounded-xl bg-wine px-4 py-3 font-bold text-wine-ink"
      >
        {pending ? "Salvando…" : "Adicionar bolo"}
      </button>
    </form>
  );
}

export function ChangePhotoForm({
  cakeId,
  imageUrl,
  name,
}: {
  cakeId: number;
  imageUrl: string | null;
  name: string;
}) {
  const bound = changePhotoAction.bind(null, cakeId);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-paper">
        {imageUrl && (
          <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <label className="btn btn-ghost cursor-pointer inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-medium">
          {imageUrl ? "Trocar foto" : "Colocar foto"}
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="sr-only"
            aria-label={`Foto de ${name}`}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </label>
        {pending && <p className="mt-1 text-xs text-muted">Enviando…</p>}
        {state.error && (
          <p className="mt-1 text-xs font-medium text-wine">{state.error}</p>
        )}
      </div>
    </form>
  );
}
