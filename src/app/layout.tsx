import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "duet. — Chantez ensemble, en direct",
  description: "Crée un duel vocal en direct, invite un ami et chantez à deux sans créer de compte.",
  applicationName: "duet.",
  openGraph: {
    title: "duet. — Deux voix. Un seul moment.",
    description: "Le duel vocal en direct, sans compte et sans friction.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f1eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
