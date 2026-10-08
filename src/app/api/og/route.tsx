import { ImageResponse } from "next/og";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cleanRoomCode } from "@/lib/room-utils";
import { getTrack, tracks } from "@/lib/tracks";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = cleanRoomCode(searchParams.get("room"));

    let hostName = "Un ami";
    let track = tracks[0];

    if (code) {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.code, code),
      });

      if (room) {
        hostName = room.playerAName || "Un ami";
        track = getTrack(room.trackId) ?? tracks[0];
      }
    }

    // Load cover directly from filesystem as base64 Data URI for instant Satori render with zero network latency
    let coverSrc = track.cover;
    try {
      if (track.cover.startsWith("/")) {
        const localPath = path.join(process.cwd(), "public", track.cover);
        if (fs.existsSync(localPath)) {
          const buffer = fs.readFileSync(localPath);
          const ext = path.extname(localPath).replace(".", "") || "jpeg";
          const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
          coverSrc = `data:${mime};base64,${buffer.toString("base64")}`;
        }
      }
    } catch {
      // Fallback to absolute URL if fs read fails
      const baseUrl = new URL(request.url).origin;
      coverSrc = track.cover.startsWith("http") ? track.cover : `${baseUrl}${track.cover}`;
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0d0d12",
            padding: "50px 70px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            position: "relative",
          }}
        >
          {/* Background Ambient Glows */}
          <div
            style={{
              position: "absolute",
              top: "-100px",
              left: "-100px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(184, 231, 53, 0.22) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "-100px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(241, 61, 143, 0.28) 0%, rgba(0,0,0,0) 70%)",
            }}
          />

          {/* Left: Text & Call to action */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              maxWidth: "640px",
              zIndex: 2,
            }}
          >
            {/* Brand Logo & Live Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.04em",
                }}
              >
                duet<span style={{ color: "#f13d8f" }}>.</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(241, 61, 143, 0.18)",
                  border: "1px solid rgba(241, 61, 143, 0.4)",
                  padding: "6px 14px",
                  borderRadius: "999px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#f13d8f",
                  }}
                />
                <span
                  style={{
                    color: "#ff5c9a",
                    fontSize: "13px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Duel en direct
                </span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p
                style={{
                  margin: 0,
                  color: "#b8e735",
                  fontSize: "20px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Défi vocal lancé par {hostName} 🎤
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "48px",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                }}
              >
                {track.title}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                {track.artist} · {track.durationLabel}
              </p>
            </div>

            {/* Call to Action Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: "14px 28px",
                  borderRadius: "16px",
                  fontSize: "18px",
                  fontWeight: 900,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
              >
                🎙️ Rejoindre le duel
              </div>
              <span
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Sans inscription · Gratuit
              </span>
            </div>
          </div>

          {/* Right: Album Cover Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "360px",
              height: "360px",
              borderRadius: "28px",
              overflow: "hidden",
              border: "3px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8)",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt={track.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return new Response("Erreur lors de la génération de l'image", { status: 500 });
  }
}
