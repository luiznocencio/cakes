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

export const metadata: Metadata = {
  title: "Primu's Bolos — o que tem na vitrine agora",
  description:
    "Veja quais bolos estão na vitrine agora. Esgotou o seu? A gente avisa no WhatsApp quando sair do forno.",
};

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
