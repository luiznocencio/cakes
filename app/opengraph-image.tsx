import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { OG_PHOTO_SLUGS, OG_PHOTO_SIZE } from "@/lib/og-photos";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bolos caseiros da Primu's Bolos";

// Altura da faixa de texto: o que sobra do card abaixo das fotos.
const CAPTION_HEIGHT = size.height - OG_PHOTO_SIZE.height;

function photo(slug: string) {
  const buf = fs.readFileSync(path.join(process.cwd(), "public", "og", `${slug}.jpg`));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

export default async function Image() {
  const storeName = process.env.STORE_NAME ?? "Primu's Bolos";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#fdfaf6" }}>
        <div style={{ display: "flex", width: "100%", height: OG_PHOTO_SIZE.height }}>
          {OG_PHOTO_SLUGS.map((slug) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slug}
              src={photo(slug)}
              alt=""
              width={OG_PHOTO_SIZE.width}
              height={OG_PHOTO_SIZE.height}
              style={{ objectFit: "cover" }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: CAPTION_HEIGHT,
            paddingLeft: 56,
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 700, color: "#6b2737" }}>{storeName}</div>
          <div style={{ fontSize: 32, color: "#57534e", marginTop: 8 }}>
            veja o que tem na vitrine agora
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
