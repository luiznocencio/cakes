import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite carrega assets wasm (.data/.wasm) via caminho no node_modules real.
  // Se o bundler empacotar, o caminho vira virtual (/ROOT/...) e quebra.
  // Mantê-lo (e os drivers) como external resolve o carregamento no servidor.
  serverExternalPackages: [
    "@electric-sql/pglite",
    "@neondatabase/serverless",
  ],
};

export default nextConfig;
