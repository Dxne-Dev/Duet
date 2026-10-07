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

  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || "https";
    if (host) {
      baseUrl = `${proto}://${host}`;
    }
  } catch {
    // Fallback
  }

  if (!baseUrl || baseUrl.includes("localhost")) {
    baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : baseUrl || "http://localhost:3000";
  }

  if (code) {
    try {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, code),
      });

      if (room) {
        const hostName = room.playerAName || "Un ami";
        const track = getTrack(room.trackId) ?? tracks[0];
        
        // Shortened title to stay under 58 chars (Google & social truncation safe)
        const title = `Défi de ${hostName} · ${track.title} 🎤`;
        const description = `Rejoins ${hostName} pour un duel vocal en direct sur ${track.title} (${track.artist}). Prépare ton micro !`;
        
        // Exact 1.91:1 ratio (1200x630) social card with album cover & CTA
        const ogImageUrl = `${baseUrl}/api/og?room=${code}`;
        const roomUrl = `${baseUrl}/?room=${code}`;

        return {
          title,
          description,
          metadataBase: new URL(baseUrl),
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
                alt: `Duel vocal avec ${hostName} sur ${track.title}`,
                type: "image/png",
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl],
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
    },
  };
}

export default function HomePage() {
  return <VocalDuelApp />;
}
