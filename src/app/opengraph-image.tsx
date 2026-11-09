import { ImageResponse } from "next/og";
import { siteConfig } from "./_config/site-metadata";

export const alt = "Freeman Madudili — From first click. To a job well done.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#020c1b",
        color: "#e6f1ff",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, marginBottom: 38 }}>
        {siteConfig.shortName} · Software Engineer
      </div>
      <div style={{ fontSize: 83, letterSpacing: "-0.05em" }}>From first click.</div>
      <div style={{ color: "#64ffda", fontSize: 83, letterSpacing: "-0.05em" }}>
        To a job well done.
      </div>
      <div style={{ fontSize: 24, marginTop: 38, color: "#a8b7ca" }}>
        Intuitive interfaces and reliable workflows.
      </div>
    </div>,
    size,
  );
}
