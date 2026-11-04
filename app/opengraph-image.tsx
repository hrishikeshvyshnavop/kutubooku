import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Default share card (WhatsApp, Facebook, X, LinkedIn…) for every page without its own.
// Book pages use their cover instead (app/books/[id]/page.tsx). Built once at build time.

export const alt = "KutuBooku: books picked for your child";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [logo, mascot] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/kutubooku-logo.png")),
    readFile(join(process.cwd(), "public/brand/mascot/kutu-avatar.png")),
  ]);
  const src = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FDDAA6", padding: 72, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(logo)} alt="" width={300} height={49} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -2, color: "#1d2838" }}>Books picked for your child</div>
            {/* Two set lines: the renderer can drop a word where it wraps text on its own. */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", fontSize: 34, lineHeight: 1.25, color: "#1d2838", opacity: 0.75 }}>
              <span>By age, reading stage and interests.</span>
              <span>Every pick comes with a reason.</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#1d2838", opacity: 0.6 }}>kutubooku.com</div>
        </div>
        <div style={{ position: "absolute", right: 64, bottom: 64, width: 330, height: 330, borderRadius: 999, background: "#ffd0b2", display: "flex", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(mascot)} alt="" width={330} height={330} />
        </div>
      </div>
    ),
    size,
  );
}
