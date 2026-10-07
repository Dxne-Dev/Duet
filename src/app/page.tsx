import type { Metadata } from "next";
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

  if (code) {
    try {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, code),
      });

      if (room) {
        const hostName = room.playerAName || "Un ami";
        const track = getTrack(room.trackId) ?? tracks[0];
        const title = `${hostName} vous a lancé un défi sur ${track.title} ! 🎤`;
        const description = `Rejoins ${hostName} pour un duel vocal en direct sur ${track.title} (${track.artist}). Prépare ton micro !`;
        const coverUrl = track.cover;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            type: "website",
            images: [
              {
                url: coverUrl,
                width: 800,
                height: 800,
                alt: `Pochette ${track.title}`,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [coverUrl],
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  return {
    title: "duet. — Le duel vocal & karaoké en direct",
    description:
      "Défie un ami dans un duel vocal en direct ! Karaoké synchronisé, alternance des couplets et calcul des scores en temps réel, sans créer de compte.",
  };
}

export default function HomePage() {
  return <VocalDuelApp />;
}
