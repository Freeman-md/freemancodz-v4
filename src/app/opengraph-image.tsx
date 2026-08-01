import { ImageResponse } from "next/og";
import { profile } from "../../prisma/seed-data/profile";
import { siteConfig } from "@/shared/config/site-metadata";

export const alt = `${siteConfig.shortName} portfolio hero section`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#fbf9f9",
        color: "#050505",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "58px 64px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 78% 18%, rgba(89, 70, 255, 0.14), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(251,249,249,1))",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              color: "#635bff",
              fontSize: 18,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              height: 1,
              flex: 1,
              background: "rgba(5, 5, 5, 0.12)",
            }}
          />
          <div
            style={{
              border: "1px solid rgba(5, 5, 5, 0.14)",
              borderRadius: 999,
              padding: "10px 14px",
              fontSize: 18,
              color: "rgba(5, 5, 5, 0.64)",
            }}
          >
            Portfolio
          </div>
        </div>

        <div style={{ display: "flex", gap: 42, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                fontSize: 86,
                lineHeight: 0.94,
                letterSpacing: "-0.07em",
                fontWeight: 700,
                maxWidth: 820,
              }}
            >
              {profile.headline}
            </div>
            <div
              style={{
                marginTop: 28,
                maxWidth: 760,
                color: "rgba(5, 5, 5, 0.62)",
                fontSize: 28,
                lineHeight: 1.35,
              }}
            >
              {siteConfig.description}
            </div>
          </div>

          <div
            style={{
              width: 250,
              height: 320,
              borderRadius: 24,
              background: "#050505",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 24,
              color: "#ffffff",
              boxShadow: "0 30px 90px rgba(5, 5, 5, 0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "rgba(255,255,255,0.62)",
              }}
            >
              Systems / AI / Reliability
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Reliable software", "AI workflows", "Scalable systems"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 18,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#635bff",
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
