import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbyMM8YNFPG_TXxgpI9phdHPce8olh8whvSBfpEIcaBQXpURSqhQk3PBMbFSH49KBWo63g/exec";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f8fafc"/>
  <circle cx="200" cy="170" r="36" fill="#cbd5e1"/>
  <path d="M150 250 L200 200 L250 250 Z" fill="#94a3b8"/>
  <text x="50%" y="295" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#64748b">
    ขนมไทยแทนคุณ
  </text>
  <text x="50%" y="320" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">
    รูปภาพไม่พร้อมใช้งาน
  </text>
</svg>`;

// In-memory image cache to deliver instant <5ms responses
const imageCache = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

async function fetchImageFromAppsScript(fileId: string, maxRetries = 2) {
  const scriptUrl = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(fileId)}`;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const res = await fetch(scriptUrl, {
        redirect: "follow",
        headers: BROWSER_HEADERS,
      });

      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        if (json.data && !json.error) {
          return { data: json.data, mimeType: json.mimeType || "image/webp" };
        }
      }

      console.warn(`[DriveImage] Attempt ${attempt} failed for fileId: ${fileId}, status: ${res.status}`);
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    } catch (err: any) {
      console.warn(`[DriveImage] Attempt ${attempt} error for fileId: ${fileId}:`, err.message);
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("id");
  if (!fileId) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // 1. Check in-memory cache first (instant response)
  const cached = imageCache.get(fileId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "Content-Type": cached.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Fetch from Google Apps Script with retry
  try {
    const result = await fetchImageFromAppsScript(fileId);

    if (!result) {
      console.warn("[DriveImage] Image not found on Drive after retries for fileId:", fileId);
      return new NextResponse(FALLBACK_SVG, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const imageBuffer = Buffer.from(result.data, "base64");

    // Cache in memory
    imageCache.set(fileId, {
      buffer: imageBuffer,
      mimeType: result.mimeType,
      timestamp: Date.now(),
    });

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("[DriveImage] Fatal error:", err.message);
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}
