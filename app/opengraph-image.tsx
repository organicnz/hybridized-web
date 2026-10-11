import { ImageResponse } from "next/og";

export const alt = "Hybridized - Music Archive & Streaming Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #09090b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 900,
              color: "white",
              letterSpacing: -4,
            }}
          >
            H
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            letterSpacing: -2,
            lineHeight: 1.1,
          }}
        >
          Hybridized
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          DJ mixes, radio shows & electronic music from top artists
        </div>
      </div>
    ),
    size,
  );
}
