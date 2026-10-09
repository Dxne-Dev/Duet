import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { cleanNickname, cleanRoomCode, getRole, toPublicRoom } from "@/lib/room-utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ code: string }> };

async function findRoom(code: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  if (room && room.destroyAt && Date.now() >= room.destroyAt) {
    try {
      await db.delete(rooms).where(eq(rooms.id, room.id));
    } catch {
      // Ignore
    }
    return null;
  }
  return room;
}

export async function GET(request: Request, context: RouteContext) {
  const { code: rawCode } = await context.params;
  const code = cleanRoomCode(rawCode);
  const token = new URL(request.url).searchParams.get("token");
  const room = await findRoom(code);

  if (!room) {
    return Response.json({ error: "Salon introuvable ou fermé." }, { status: 404 });
  }

  return Response.json({ room: toPublicRoom(room, token) });
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { code: rawCode } = await context.params;
    const code = cleanRoomCode(rawCode);
    const token = new URL(request.url).searchParams.get("token");
    const room = await findRoom(code);

    if (!room) {
      return Response.json({ success: true });
    }

    const role = getRole(room, token);
    if (!role) {
      return Response.json({ error: "Session joueur invalide." }, { status: 401 });
    }

    await db.delete(rooms).where(eq(rooms.id, room.id));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code: rawCode } = await context.params;
    const code = cleanRoomCode(rawCode);
    const body = (await request.json()) as {
      action?: string;
      nickname?: unknown;
      token?: unknown;
      ready?: unknown;
      score?: unknown;
      trackId?: unknown;
      message?: unknown;
    };
    const room = await findRoom(code);

    if (!room) {
      return Response.json({ error: "Ce salon n’existe pas ou a été fermé." }, { status: 404 });
    }

    if (body.action === "join") {
      const nickname = cleanNickname(body.nickname);
      if (!nickname) {
        return Response.json({ error: "Choisis un pseudo de 2 caractères minimum." }, { status: 400 });
      }
      if (room.status !== "WAITING" || room.playerBToken) {
        return Response.json({ error: "Ce salon est déjà complet ou n'est plus accessible." }, { status: 409 });
      }

      const token = randomUUID();
      const [joinedRoom] = await db
        .update(rooms)
        .set({
          playerBName: nickname,
          playerBToken: token,
          status: "READY",
          updatedAt: new Date(),
        })
        .where(and(eq(rooms.code, code), isNull(rooms.playerBToken)))
        .returning();

      if (!joinedRoom) {
        return Response.json({ error: "Quelqu’un vient de rejoindre ce salon." }, { status: 409 });
      }

      return Response.json({ room: toPublicRoom(joinedRoom, token), token });
    }

    const token = typeof body.token === "string" ? body.token : null;
    const role = getRole(room, token);
    if (!role) {
      return Response.json({ error: "Session joueur invalide." }, { status: 401 });
    }

    if (body.action === "leave") {
      // If already finished or already abandoned, return public room
      if (room.status === "FINISHED" || room.status === "ABANDONED") {
        return Response.json({ room: toPublicRoom(room, token) });
      }

      // If room is WAITING and host leaves alone, delete immediately
      if (room.status === "WAITING" && role === "A" && !room.playerBToken) {
        await db.delete(rooms).where(eq(rooms.id, room.id));
        return Response.json({ success: true });
      }

      const leaverName = role === "A" ? room.playerAName : (room.playerBName ?? "Le partenaire");
      const destroyTimestamp = Date.now() + 8000;

      const [abandonedRoom] = await db
        .update(rooms)
        .set({
          status: "ABANDONED",
          abandonedByName: leaverName,
          destroyAt: destroyTimestamp,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();

      // Schedule destruction on the server
      setTimeout(async () => {
        try {
          await db.delete(rooms).where(eq(rooms.id, room.id));
        } catch {
          // Ignore
        }
      }, 8500);

      return Response.json({ room: toPublicRoom(abandonedRoom ?? room, token) });
    }

    if (body.action === "ready") {
      if (room.status !== "READY") {
        return Response.json({ error: "Le salon n’est pas prêt." }, { status: 409 });
      }
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          ...(role === "A"
            ? { playerAReady: body.ready === true }
            : { playerBReady: body.ready === true }),
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      return Response.json({ room: toPublicRoom(updatedRoom, token) });
    }

    if (body.action === "start") {
      if (role !== "A") {
        return Response.json({ error: "Seul l’hôte peut lancer le duel." }, { status: 403 });
      }
      if (room.status !== "READY" || !room.playerAReady || !room.playerBReady) {
        return Response.json({ error: "Les deux joueurs doivent être prêts." }, { status: 409 });
      }
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          status: "PLAYING",
          startTimestamp: Date.now() + 4000,
          updatedAt: new Date(),
        })
        .where(and(eq(rooms.id, room.id), eq(rooms.status, "READY")))
        .returning();
      if (!updatedRoom) {
        return Response.json({ error: "Le duel a déjà démarré." }, { status: 409 });
      }
      return Response.json({ room: toPublicRoom(updatedRoom, token) });
    }

    if (body.action === "finish") {
      if (room.status !== "PLAYING") {
        return Response.json({ room: toPublicRoom(room, token) });
      }
      if (room.startTimestamp && Date.now() < room.startTimestamp) {
        return Response.json({ room: toPublicRoom(room, token) });
      }

      const score = typeof body.score === "number" ? Math.max(0, Math.min(100, Math.round(body.score))) : null;
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          status: "FINISHED",
          ...(role === "A" && score !== null ? { playerAScore: score } : {}),
          ...(role === "B" && score !== null ? { playerBScore: score } : {}),
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      return Response.json({ room: toPublicRoom(updatedRoom ?? room, token) });
    }

    if (body.action === "propose_rematch") {
      if (role !== "A") {
        return Response.json({ error: "Seul l’hôte peut proposer une revanche." }, { status: 403 });
      }
      const nextTrackId = typeof body.trackId === "string" && body.trackId ? body.trackId : room.trackId;
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          status: "REMATCH_PROPOSED",
          trackId: nextTrackId,
          playerAReady: true,
          playerBReady: false,
          startTimestamp: null,
          offer: null,
          answer: null,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      return Response.json({ room: toPublicRoom(updatedRoom ?? room, token) });
    }

    if (body.action === "accept_rematch") {
      if (role !== "B") {
        return Response.json({ error: "Seul l’adversaire peut accepter la revanche." }, { status: 403 });
      }
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          status: "PLAYING",
          startTimestamp: Date.now() + 4000,
          playerAReady: true,
          playerBReady: true,
          playerAScore: null,
          playerBScore: null,
          offer: null,
          answer: null,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      return Response.json({ room: toPublicRoom(updatedRoom ?? room, token) });
    }

    if (body.action === "decline_rematch" || body.action === "cancel_rematch") {
      const declinerName = role === "B" ? (room.playerBName ?? "Le partenaire") : room.playerAName;
      const destroyTimestamp = Date.now() + 8000;
      const [abandonedRoom] = await db
        .update(rooms)
        .set({
          status: "ABANDONED",
          abandonedByName: declinerName,
          destroyAt: destroyTimestamp,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();

      setTimeout(async () => {
        try {
          await db.delete(rooms).where(eq(rooms.id, room.id));
        } catch {
          // Ignore
        }
      }, 8500);

      return Response.json({ room: toPublicRoom(abandonedRoom ?? room, token) });
    }

    if (body.action === "update_message") {
      if (role !== "A") {
        return Response.json({ error: "Seul l’hôte peut personnaliser le message." }, { status: 403 });
      }
      const rawMsg = typeof body.message === "string" ? body.message.trim().slice(0, 160) : null;
      const [updatedRoom] = await db
        .update(rooms)
        .set({
          customMessage: rawMsg || null,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id))
        .returning();
      return Response.json({ room: toPublicRoom(updatedRoom ?? room, token) });
    }

    return Response.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return Response.json({ error: "Le salon n’a pas pu être mis à jour." }, { status: 500 });
  }
}
