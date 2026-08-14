import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL!;

function extractFileId(input: string): string | null {
  if (!input) return null;
  // If it's already just an ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(input.trim())) {
    return input.trim();
  }
  // If it's /api/drive-image/FILE_ID
  const pathProxyMatch = input.match(/\/api\/drive-image\/([a-zA-Z0-9_-]+)/);
  if (pathProxyMatch && pathProxyMatch[1]) return pathProxyMatch[1];

  // If it's /api/drive-image?id=FILE_ID
  const queryProxyMatch = input.match(/\/api\/drive-image\?id=([a-zA-Z0-9_-]+)/);
  if (queryProxyMatch && queryProxyMatch[1]) return queryProxyMatch[1];

  // If it's lh5/lh3 googleusercontent URL
  const lhMatch = input.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch && lhMatch[1]) return lhMatch[1];

  // If it's drive.google.com/file/d/FILE_ID or /thumbnail?id=FILE_ID
  const driveFileMatch = input.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) return driveFileMatch[1];

  const driveParamMatch = input.match(/drive\.google\.com\/(?:thumbnail|uc|open)\?.*id=([a-zA-Z0-9_-]+)/);
  if (driveParamMatch && driveParamMatch[1]) return driveParamMatch[1];

  return null;
}

import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

async function deleteFromAppsScript(fileId: string): Promise<boolean> {
  try {
    const url = `${APPS_SCRIPT_URL}?id=${encodeURIComponent(fileId)}&action=delete`;
    const { stdout } = await exec("curl", [
      "-s",
      "-L",
      "-A",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      url,
    ]);

    const json = JSON.parse(stdout);
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
