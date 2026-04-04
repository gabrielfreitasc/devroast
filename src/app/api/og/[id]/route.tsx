/** @jsxImportSource react */
import { ImageResponse } from "@takumi-rs/image-response";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roasts } from "@/db/schema";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const fontPromise = readFile(
  join(process.cwd(), "public/fonts/JetBrainsMono-Regular.woff2")
);

const VERDICT_COLORS: Record<string, string> = {
  needs_serious_help: "#ef4444",
  getting_there: "#f97316",
  surprisingly_decent: "#eab308",
  actually_good: "#22c55e",
  clean_code: "#3b82f6",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [roast] = await db
    .select({
      score: roasts.score,
      roastQuote: roasts.roastQuote,
      language: roasts.language,
      lineCount: roasts.lineCount,
      verdict: roasts.verdict,
    })
    .from(roasts)
    .where(eq(roasts.id, id))
    .limit(1);

  if (!roast) {
    return new Response("Not found", { status: 404 });
  }

  const fontData = await fontPromise;
  const verdictColor = VERDICT_COLORS[roast.verdict] ?? "#f59e0b";
  const score = Number(roast.score).toFixed(1);
  const quote =
    roast.roastQuote.length > 120
      ? `${roast.roastQuote.slice(0, 120)}...`
      : roast.roastQuote;

  const image = new ImageResponse(
    (
      <div
        tw="flex flex-col items-center justify-between w-full h-full"
        style={{
          backgroundColor: "#0a0a0a",
          fontFamily: "JetBrains Mono",
          padding: "48px 64px",
        }}
      >
        {/* Logo */}
        <div tw="flex items-center" style={{ color: "#4ade80", fontSize: 18 }}>
          {">"} devroast
        </div>

        {/* Score */}
        <div tw="flex items-end" style={{ lineHeight: 1 }}>
          <span style={{ color: "#f59e0b", fontSize: 140, fontWeight: 700 }}>
            {score}
          </span>
          <span
            style={{ color: "#9ca3af", fontSize: 48, marginBottom: 20, marginLeft: 8 }}
          >
            /10
          </span>
        </div>

        {/* Badge */}
        <div tw="flex items-center" style={{ gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: verdictColor,
            }}
          />
          <span style={{ color: verdictColor, fontSize: 16 }}>
            {roast.verdict}
          </span>
        </div>

        {/* Meta */}
        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
          lang: {roast.language} · {roast.lineCount} lines
        </div>

        {/* Quote */}
        <div
          style={{
            color: "#d1d5db",
            fontSize: 18,
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: 900,
            marginTop: 24,
          }}
        >
          "{quote}"
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "JetBrains Mono",
          data: fontData.buffer as ArrayBuffer,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  image.headers.set(
    "Cache-Control",
    "public, s-maxage=31536000, immutable"
  );

  return image;
}
