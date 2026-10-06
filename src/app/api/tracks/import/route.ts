import { db } from "@/db";
import { tracksTable, type LyricLine } from "@/db/schema";
import { getLrcLibLyrics, parseLrcToLyricLines, searchLrcLib } from "@/lib/lrclib";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      query?: string;
      title?: string;
      artist?: string;
      genre?: string;
      bpm?: number;
      key?: string;
      coverUrl?: string;
      audioUrl?: string;
      duration?: number;
      syncedLyrics?: string;
    };

    // 1. Recherche de paroles synchronisées sur LRCLIB
    if (body.action === "search_lyrics") {
      const query = body.query || `${body.artist || ""} ${body.title || ""}`.trim();
      if (!query) {
        return Response.json({ error: "Recherche vide." }, { status: 400 });
      }
      const results = await searchLrcLib(query);
      return Response.json({ results });
    }

    // 2. Import automatique avec récupération LRCLIB
    if (body.action === "auto_import" || !body.action) {
      const title = (body.title || "").trim();
      const artist = (body.artist || "").trim();
      const audioUrl = (body.audioUrl || "").trim();
      const coverUrl = (body.coverUrl || "/covers/minuit-zero.jpg").trim();
      const duration = Number(body.duration) || 75;

      if (!title || !artist) {
        return Response.json({ error: "Titre et artiste obligatoires." }, { status: 400 });
      }

      // Récupérer les paroles synchronisées
      let lyrics: LyricLine[] = [];
      if (body.syncedLyrics) {
        lyrics = parseLrcToLyricLines(body.syncedLyrics, duration);
      } else {
        const lrcResult = await getLrcLibLyrics(title, artist);
        if (lrcResult?.syncedLyrics) {
          lyrics = parseLrcToLyricLines(lrcResult.syncedLyrics, duration);
        }
      }

      const id = `${artist.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}`
        .replace(/-+/g, "-")
        .slice(0, 60);

      const durationMinutes = Math.floor(duration / 60);
      const durationSecs = String(Math.floor(duration % 60)).padStart(2, "0");
      const durationLabel = `${durationMinutes}:${durationSecs}`;

      const [newTrack] = await db
        .insert(tracksTable)
        .values({
          id,
          title,
          artist,
          genre: body.genre || "Pop",
          duration,
          durationLabel,
          bpm: Number(body.bpm) || 120,
          key: body.key || "C min",
          coverUrl,
          audioUrl,
          lyrics,
          isPublished: true,
        })
        .onConflictDoUpdate({
          target: tracksTable.id,
          set: {
            title,
            artist,
            audioUrl,
            coverUrl,
            lyrics,
            duration,
            durationLabel,
            updatedAt: new Date(),
          },
        })
        .returning();

      return Response.json({ success: true, track: newTrack }, { status: 201 });
    }

    return Response.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'import.";
    return Response.json({ error: message }, { status: 500 });
  }
}
