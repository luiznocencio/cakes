"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  changePhotoAction,
  createCakeAction,
  type CakeFormState,
} from "../actions";

const initial: CakeFormState = {};

/**
 * Encolhe a foto no próprio navegador antes de enviar. Foto de celular passa
 * fácil do limite de 1 MB das Server Actions; aqui ela vira um webp pequeno.
 * `imageOrientation: "from-image"` respeita a orientação EXIF e o canvas já
 * remove os metadados — não há risco de girar duas vezes no servidor.
 */
async function shrinkForUpload(file: File, max = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", 0.85),
    );
    if (!blob) return file;
    return new File([blob], "foto.webp", { type: "image/webp" });
  } catch {
    return file; // se algo falhar, manda o original (o limite maior cobre)
  }
}

/** Troca o arquivo do input pelo já-encolhido, para o form enviar esse. */
function replaceInputFile(input: HTMLInputElement, file: File) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}

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
        onChange={async (e) => {
          const input = e.currentTarget;
          const f = input.files?.[0];
          if (!f) return setPreview(null);
          setPreview(URL.createObjectURL(f));
          const small = await shrinkForUpload(f);
          replaceInputFile(input, small);
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
            onChange={async (e) => {
              const input = e.currentTarget;
              const f = input.files?.[0];
              if (!f) return;
              const small = await shrinkForUpload(f);
              replaceInputFile(input, small);
              input.form?.requestSubmit();
            }}
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
