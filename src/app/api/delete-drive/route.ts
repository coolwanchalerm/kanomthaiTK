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

function extractFileId(input: string): string | null {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{25,}$/.test(input.trim())) {
    return input.trim();
  }
  const pathProxyMatch = input.match(/\/api\/drive-image\/([a-zA-Z0-9_-]+)/);
  if (pathProxyMatch && pathProxyMatch[1]) return pathProxyMatch[1];

  const queryProxyMatch = input.match(/\/api\/drive-image\?id=([a-zA-Z0-9_-]+)/);
  if (queryProxyMatch && queryProxyMatch[1]) return queryProxyMatch[1];

  const lhMatch = input.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch && lhMatch[1]) return lhMatch[1];

  const driveFileMatch = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) return driveFileMatch[1];

  const driveParamMatch = input.match(/drive\.google\.com\/(?:thumbnail|uc|open)\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveParamMatch && driveParamMatch[1]) return driveParamMatch[1];

  return null;
}

async function deleteFromAppsScript(fileId: string): Promise<boolean> {
  try {
    const url = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(fileId)}&action=delete`;
    const res = await fetch(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("[DeleteDrive] Script returned status:", res.status, "for fileId:", fileId);
      return false;
    }

    const text = await res.text();
    const json = JSON.parse(text);
    console.log("[DeleteDrive] Result for fileId", fileId, ":", json);
    return !!json.success;
  } catch (err: any) {
    console.error("[DeleteDrive] Error deleting fileId:", fileId, err.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIds: string[] = [];

    if (body.fileId) rawIds.push(body.fileId);
    if (Array.isArray(body.fileIds)) rawIds.push(...body.fileIds);
    if (body.url) rawIds.push(body.url);
    if (Array.isArray(body.urls)) rawIds.push(...body.urls);

    const fileIds = Array.from(
      new Set(
        rawIds
          .map(extractFileId)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (fileIds.length === 0) {
      return NextResponse.json({ success: true, message: "No valid fileIds to delete" });
    }

    console.log("[DeleteDrive] Deleting files from Drive:", fileIds);

    // Delete all in parallel
    const results = await Promise.allSettled(fileIds.map(deleteFromAppsScript));
    const deletedCount = results.filter((r) => r.status === "fulfilled" && r.value).length;

    return NextResponse.json({
      success: true,
      deletedCount,
      totalRequested: fileIds.length,
    });
  } catch (err: any) {
    console.error("[DeleteDrive] API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
