import { ImageResponse } from "next/og";

export const alt = "Lynx — Run every unit like it's your only one.";
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
          padding: "64px",
          background:
            "radial-gradient(1100px 600px at 10% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(139,92,246,0.16), transparent 60%), #F3F4F6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "white",
            border: "1px solid #f1f5f9",
            borderRadius: "40px",
            padding: "56px 64px",
            boxShadow: "0 30px 80px -30px rgba(0,0,0,0.12)",
          }}
        >
          {/* Top row: brand wordmark only */}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: -0.5,
              color: "#09090B",
            }}
          >
            Lynx
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 80,
                fontWeight: 600,
                letterSpacing: -2.5,
                color: "#09090B",
                lineHeight: 1.02,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>Run every unit like</span>
              <span>it&apos;s your only one.</span>
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#6b7280",
                fontWeight: 500,
                maxWidth: 820,
                lineHeight: 1.4,
              }}
            >
              The operations command center for multi-unit operators. Live
              unit performance, automated payouts, a P&amp;L you can defend.
            </div>
          </div>

          {/* Bottom row: pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                background: "#09090B",
                color: "white",
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              Get Started
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                background: "white",
                color: "#09090B",
                border: "1px solid #e5e7eb",
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              View Platform Demo
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 500,
                color: "#9ca3af",
              }}
            >
              lynx.app
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
