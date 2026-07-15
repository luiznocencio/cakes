import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite carrega assets wasm (.data/.wasm) via caminho no node_modules real.
  // Se o bundler empacotar, o caminho vira virtual (/ROOT/...) e quebra.
  serverExternalPackages: [
    "@electric-sql/pglite",
    "@neondatabase/serverless",
  ],
  images: {
    // Fotos enviadas pelo painel ficam no Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    // O padrão é 1 MB e a foto de um celular passa disso. O cliente já
    // encolhe antes de enviar; esta folga cobre casos em que não deu.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
