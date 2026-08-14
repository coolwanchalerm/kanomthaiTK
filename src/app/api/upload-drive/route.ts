import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL!;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function postToAppsScript(url: string, body: string): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...BROWSER_HEADERS },
    body,
    redirect: "manual",
  });

  console.log("[Drive] Initial POST status:", res.status, "type:", res.type);

  // Follow 302 redirect with GET using browser headers
  if (res.status === 0 || (res.status >= 300 && res.status < 400)) {
    const location = res.headers.get("location");
    console.log("[Drive] Redirect Location:", location);
    if (!location) {
      const res2 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...BROWSER_HEADERS },
        body,
        redirect: "follow",
      });
      return res2;
    }
    const res2 = await fetch(location, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });
    console.log("[Drive] GET redirect status:", res2.status, "content-type:", res2.headers.get("content-type"));
    return res2;
  }

  return res;
}

async function postToAppsScriptWithRetry(url: string, body: string, maxRetries = 2): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const res = await postToAppsScript(url, body);
      if (res.ok) {
        return res;
      }
      lastRes = res;
      console.warn(`[Drive] Upload attempt ${attempt} returned status ${res.status}`);
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    } catch (err: any) {
      console.warn(`[Drive] Upload attempt ${attempt} threw error:`, err.message);
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      } else {
        throw err;
      }
    }
  }
  return lastRes!;
}

export async function POST(req: NextRequest) {
  try {
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_APPS_SCRIPT_URL is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/webp";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

    const requestBody = JSON.stringify({ base64, mimeType, fileName });

    // Send to Google Apps Script with auto-retry
    const scriptRes = await postToAppsScriptWithRetry(APPS_SCRIPT_URL, requestBody);

    const responseText = await scriptRes.text();

    if (!scriptRes.ok) {
      console.error("Apps Script error response:", responseText.slice(0, 200));
      return NextResponse.json(
        { success: false, error: `Apps Script returned error: ${scriptRes.status}` },
        { status: 500 }
      );
    }

    let result: { success: boolean; fileId?: string; error?: string; sharingOk?: boolean; sharingError?: string };
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Apps Script non-JSON response:", responseText.slice(0, 200));
      return NextResponse.json(
        { success: false, error: "Apps Script returned non-JSON response" },
        { status: 500 }
      );
    }

    if (!result.success || !result.fileId) {
      return NextResponse.json(
        { success: false, error: result.error || "No fileId returned" },
        { status: 500 }
      );
    }

    const fileId = result.fileId;
    console.log("[Drive] sharingOk:", result.sharingOk, "sharingError:", result.sharingError || "none");

    // Serve image via same-domain proxy — no Drive sharing settings needed
    const url = `/api/drive-image/${fileId}`;

    return NextResponse.json({ success: true, fileId, url });
  } catch (err: any) {
    console.error("Upload Drive API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
