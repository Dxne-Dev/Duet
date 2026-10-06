import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { cleanNickname, toPublicRoom } from "@/lib/room-utils";
import { getTrack } from "@/lib/tracks";

export const dynamic = "force-dynamic";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createCode(length = 4) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: unknown; trackId?: unknown };
    const nickname = cleanNickname(body.nickname);
    const trackId = typeof body.trackId === "string" ? body.trackId : "";

    if (!nickname) {
      return Response.json({ error: "Choisis un pseudo de 2 caractères minimum." }, { status: 400 });
    }

    if (!getTrack(trackId)) {
      return Response.json({ error: "Ce titre n’existe pas dans le catalogue." }, { status: 400 });
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const token = randomUUID();
      try {
        const [room] = await db
          .insert(rooms)
          .values({
            code: createCode(),
            trackId,
            playerAName: nickname,
            playerAToken: token,
          })
          .returning();

        return Response.json({ room: toPublicRoom(room, token), token }, { status: 201 });
      } catch (error) {
        const postgresError = error as { code?: string };
        if (postgresError.code !== "23505") throw error;
      }
    }

    return Response.json({ error: "Impossible de générer un code. Réessaie." }, { status: 503 });
  } catch {
    return Response.json({ error: "La création du salon a échoué." }, { status: 500 });
  }
}
