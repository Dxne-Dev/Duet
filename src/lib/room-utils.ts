import type { Room } from "@/db/schema";

export type PlayerRole = "A" | "B";

export type PublicRoom = {
  code: string;
  trackId: string;
  status: string;
  role: PlayerRole | null;
  startTimestamp: number | null;
  createdAt: string;
  abandonedByName?: string | null;
  destroyAt?: number | null;
  playerAScore?: number | null;
  playerBScore?: number | null;
  players: {
    role: PlayerRole;
    name: string | null;
    ready: boolean;
    connected: boolean;
  }[];
};

export function getRole(room: Room, token: string | null): PlayerRole | null {
  if (token && token === room.playerAToken) return "A";
  if (token && token === room.playerBToken) return "B";
  return null;
}

export function toPublicRoom(room: Room, token: string | null): PublicRoom {
  return {
    code: room.code,
    trackId: room.trackId,
    status: room.status,
    role: getRole(room, token),
    startTimestamp: room.startTimestamp,
    createdAt: room.createdAt.toISOString(),
    abandonedByName: room.abandonedByName ?? null,
    destroyAt: room.destroyAt ?? null,
    playerAScore: room.playerAScore ?? null,
    playerBScore: room.playerBScore ?? null,
    players: [
      {
        role: "A",
        name: room.playerAName,
        ready: room.playerAReady,
        connected: true,
      },
      {
        role: "B",
        name: room.playerBName,
        ready: room.playerBReady,
        connected: Boolean(room.playerBName),
      },
    ],
  };
}

export function cleanNickname(value: unknown) {
  if (typeof value !== "string") return null;
  const nickname = value.trim().replace(/\s+/g, " ").slice(0, 24);
  return nickname.length >= 2 ? nickname : null;
}

export function cleanRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
