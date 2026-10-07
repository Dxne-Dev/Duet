import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111113",
          borderRadius: "36px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: "#222228",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 10v3" />
            <path d="M6 6v11" />
            <path d="M10 3v18" stroke="#f13d8f" strokeWidth="2.8" />
            <path d="M14 8v7" />
            <path d="M18 5v13" />
            <path d="M22 10v3" />
          </svg>
        </div>
        <span
          style={{
            marginTop: "12px",
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
          }}
        >
          duet<span style={{ color: "#f13d8f" }}>.</span>
        </span>
      </div>
    ),
    {
      ...size,
    },
  );
}
