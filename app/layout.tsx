import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

// Display: serifa old-style "wonky" — artesanal, de forno, não editorial.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

// UI: grotesca amigável, legível em corpo pequeno numa grade densa.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

// O site aparece em dois lugares com intenções opostas: a busca do Google
// (a pessoa digitou "bolo no Benedito Bentes") e o card do WhatsApp (a pessoa
// já sabe o que é e precisa de vontade de tocar). Por isso os textos diferem.
export function generateMetadata(): Metadata {
  const storeName = process.env.STORE_NAME ?? "Primu's Bolos";
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: "Bolos caseiros no Benedito Bentes, Primu's Bolos.",
    description:
      "Bolos caseiros no Benedito Bentes. Veja o que está na vitrine agora e receba um aviso no WhatsApp quando o seu favorito sair do forno.",
    openGraph: {
      title: `${storeName}, veja o que tem na vitrine agora`,
      description: "Esgotou o seu? A gente te chama no WhatsApp quando voltar.",
      type: "website",
      locale: "pt_BR",
      siteName: storeName,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
