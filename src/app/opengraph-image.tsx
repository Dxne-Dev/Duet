import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "duet. — Le duel vocal & karaoké en direct";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d0d11",
          padding: "64px 80px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow ambient background elements */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(184, 231, 53, 0.22) 0%, rgba(184, 231, 53, 0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-100px",
            width: "550px",
            height: "550px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 51, 85, 0.25) 0%, rgba(255, 51, 85, 0) 70%)",
          }}
        />

        {/* Header with brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#b8e735",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                fontWeight: 900,
                color: "#000",
              }}
            >
              🎤
            </div>
            <span
              style={{
                fontSize: "44px",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: "#ffffff",
              }}
            >
              duet<span style={{ color: "#ff3355" }}>.</span>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              padding: "10px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#b8e735",
              }}
            />
            <span
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Duel en direct
            </span>
          </div>
        </div>

        {/* Main hero headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "950px" }}>
          <h1
            style={{
              fontSize: "68px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            Deux voix. <br />
            Un duel vocal <span style={{ color: "#b8e735" }}>en direct</span>.
          </h1>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.65)",
              margin: 0,
            }}
          >
            Karaoké synchronisé, prompteur interactif et calcul des scores en temps réel · Sans inscription.
          </p>
        </div>

        {/* Feature Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(184, 231, 53, 0.12)",
              border: "1px solid rgba(184, 231, 53, 0.35)",
              padding: "12px 24px",
              borderRadius: "16px",
              color: "#b8e735",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            🎙️ Alternance des couplets
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(255, 51, 85, 0.12)",
              border: "1px solid rgba(255, 51, 85, 0.35)",
              padding: "12px 24px",
              borderRadius: "16px",
              color: "#ff5c77",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            ⚡ WebRTC ultra-rapide
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "12px 24px",
              borderRadius: "16px",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            👑 Vainqueur en direct
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
