import { db } from "@/db";
import { tracksTable } from "@/db/schema";
import { tracks as defaultTracks, dbTrackToTrack } from "@/lib/tracks";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbTracks = await db
      .select()
      .from(tracksTable)
      .where(eq(tracksTable.isPublished, true))
      .orderBy(asc(tracksTable.orderIndex), asc(tracksTable.createdAt));

    // If database has tracks, return them
    if (dbTracks.length > 0) {
      return Response.json({ tracks: dbTracks.map(dbTrackToTrack) });
    }

    // Auto-seed default tracks into the database
    try {
      await db.insert(tracksTable).values(
        defaultTracks.map((track, index) => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          duration: track.duration,
          durationLabel: track.durationLabel,
          bpm: track.bpm,
          key: track.key,
          coverUrl: track.cover,
          audioUrl: track.audioUrl || "",
          color: track.color,
          accent: track.accent,
          lyrics: track.lyrics,
          isPublished: true,
          orderIndex: index,
        }))
      );
    } catch {
      // If seeding fails, fallback to in-memory tracks
    }

    return Response.json({ tracks: defaultTracks });
  } catch {
    return Response.json({ tracks: defaultTracks });
  }
}
