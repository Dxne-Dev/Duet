import { db } from "@/db";
import { rooms, type SignalDescription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cleanRoomCode, getRole } from "@/lib/room-utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ code: string }> };

async function getSignalRoom(code: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  return room;
}

function isDescription(value: unknown): value is SignalDescription {
  if (!value || typeof value !== "object") return false;
  const description = value as { type?: unknown; sdp?: unknown };
  return (
    (description.type === "offer" || description.type === "answer") &&
    typeof description.sdp === "string" &&
    description.sdp.length < 100_000
  );
}

export async function GET(request: Request, context: RouteContext) {
  const { code: rawCode } = await context.params;
  const code = cleanRoomCode(rawCode);
  const token = new URL(request.url).searchParams.get("token");
  const room = await getSignalRoom(code);

  if (!room || !getRole(room, token)) {
    return Response.json({ error: "Session invalide." }, { status: 401 });
  }

  return Response.json({ offer: room.offer, answer: room.answer });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code: rawCode } = await context.params;
    const code = cleanRoomCode(rawCode);
    const body = (await request.json()) as { token?: unknown; description?: unknown };
    const token = typeof body.token === "string" ? body.token : null;
    const room = await getSignalRoom(code);
    const role = room ? getRole(room, token) : null;

    if (!room || !role) {
      return Response.json({ error: "Session invalide." }, { status: 401 });
    }
    if (!isDescription(body.description)) {
      return Response.json({ error: "Description audio invalide." }, { status: 400 });
    }
    if (role === "A" && body.description.type !== "offer") {
      return Response.json({ error: "L’hôte doit publier une offre." }, { status: 400 });
    }
    if (role === "B" && body.description.type !== "answer") {
      return Response.json({ error: "L’invité doit publier une réponse." }, { status: 400 });
    }

    await db
      .update(rooms)
      .set({
        ...(role === "A" ? { offer: body.description } : { answer: body.description }),
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id));

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Signalisation indisponible." }, { status: 500 });
  }
}
