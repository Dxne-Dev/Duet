import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "duet. — Le duel vocal & karaoké en direct à 2 joueurs",
    template: "%s | duet.",
  },
  description:
    "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé, alternance des couplets et calcul des scores en temps réel, sans créer de compte.",
  applicationName: "duet.",
  authors: [{ name: "duet. team" }],
  keywords: [
    "karaoké",
    "duel vocal",
    "duet",
    "musique en direct",
    "karaoké en ligne",
    "singing game",
    "karaoke duel",
    "webrtc",
    "gims",
    "karaoké multijoueur",
  ],
  creator: "duet.",
  publisher: "duet.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "duet. — Deux voix. Un duel vocal en direct. 🎤",
    description:
      "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé, alternance des couplets et calcul des scores en temps réel, sans inscription.",
    url: "/",
    siteName: "duet.",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "duet. — Deux voix. Un duel vocal en direct. 🎤",
    description:
      "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé et score en temps réel, sans inscription.",
    creator: "@duet_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "duet.",
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
      <body className="antialiased selection:bg-[#ff3355] selection:text-white">{children}</body>
    </html>
  );
}
