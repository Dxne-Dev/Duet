import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "./index";
import { tracksTable } from "./schema";
import { tracks } from "../lib/tracks";

async function seed() {
  console.log("Seeding tracks to Supabase database...");
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    await db
      .insert(tracksTable)
      .values({
        id: t.id,
        title: t.title,
        artist: t.artist,
        genre: t.genre,
        duration: t.duration,
        durationLabel: t.durationLabel,
        bpm: t.bpm,
        key: t.key,
        coverUrl: t.cover,
        audioUrl: t.audioUrl || "",
        color: t.color,
        accent: t.accent,
        lyrics: t.lyrics,
        isPublished: true,
        orderIndex: i,
      })
      .onConflictDoUpdate({
        target: tracksTable.id,
        set: {
          title: t.title,
          artist: t.artist,
          coverUrl: t.cover,
          audioUrl: t.audioUrl || "",
          lyrics: t.lyrics,
          duration: t.duration,
          durationLabel: t.durationLabel,
          orderIndex: i,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ Successfully seeded ${tracks.length} tracks!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
