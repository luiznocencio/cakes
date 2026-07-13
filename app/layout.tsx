import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolos de hoje",
  description:
    "Veja quais bolos estão disponíveis agora e seja avisado quando o seu favorito voltar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
