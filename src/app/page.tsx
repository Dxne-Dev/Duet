import type { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cleanRoomCode } from "@/lib/room-utils";
import { getTrack, tracks } from "@/lib/tracks";
import VocalDuelApp from "@/components/vocal-duel-app";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ room?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { room: rawCode } = await searchParams;
  const code = cleanRoomCode(rawCode);

  let host: string | null = null;
  let proto = "https";
  try {
    const headersList = await headers();
    host = headersList.get("x-forwarded-host") || headersList.get("host");
    proto = headersList.get("x-forwarded-proto") || "https";
  } catch {
    // Fallback
  }

  const baseUrl = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (code) {
    try {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, code),
      });

      if (room) {
        const hostName = room.playerAName || "Un ami";
        const track = getTrack(room.trackId) ?? tracks[0];

        // Impactful YouTube-style title & description optimized for WhatsApp/Telegram/iMessage
        const title = `${track.title} · Duel vocal de ${hostName} 🎤`;
        const description = room.customMessage
          ? `« ${room.customMessage} » — Défi vocal lancé par ${hostName} sur ${track.title} (${track.artist}) ! Prépare ton micro.`
          : `Rejoins ${hostName} pour chanter en direct à deux sur ${track.title} (${track.artist}) ! Karaoké synchronisé, micro en direct, sans inscription.`;

        const ogImageUrl = `${baseUrl}/api/og?room=${code}`;
        const coverDirectUrl = track.cover.startsWith("http") ? track.cover : `${baseUrl}${track.cover}`;
        const roomUrl = `${baseUrl}/?room=${code}`;

        return {
          title,
          description,
          metadataBase: new URL(baseUrl),
          alternates: {
            canonical: roomUrl,
          },
          openGraph: {
            title,
            description,
            url: roomUrl,
            siteName: "duet.",
            locale: "fr_FR",
            type: "website",
            images: [
              {
                url: ogImageUrl,
                secureUrl: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `Duel vocal duet. avec ${hostName} sur ${track.title}`,
                type: "image/png",
              },
              {
                url: coverDirectUrl,
                secureUrl: coverDirectUrl,
                width: 500,
                height: 500,
                alt: `Pochette de ${track.title}`,
                type: "image/jpeg",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl],
            creator: "@duet_app",
            site: "@duet_app",
          },
          other: {
            "theme-color": "#0d0d12",
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  const defaultImageUrl = `${baseUrl}/opengraph-image`;

  return {
    title: "duet. — Duel vocal & karaoké en direct",
    description:
      "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé, alternance des couplets et calcul des scores en temps réel, sans créer de compte.",
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: "duet. — Duel vocal & karaoké en direct",
      description:
        "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé, alternance des couplets et calcul des scores en temps réel, sans inscription.",
      url: baseUrl,
      siteName: "duet.",
      locale: "fr_FR",
      type: "website",
      images: [
        {
          url: defaultImageUrl,
          secureUrl: defaultImageUrl,
          width: 1200,
          height: 630,
          alt: "duet. — Le duel vocal & karaoké en direct",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "duet. — Duel vocal & karaoké en direct",
      description:
        "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé et score en temps réel, sans inscription.",
      images: [defaultImageUrl],
      creator: "@duet_app",
      site: "@duet_app",
    },
    other: {
      "theme-color": "#0d0d12",
    },
  };
}

export default function HomePage() {
  return <VocalDuelApp />;
}
