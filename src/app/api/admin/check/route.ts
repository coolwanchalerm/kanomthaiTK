import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const sessionValid = cookieStore.get("admin_session_valid")?.value;

  // Valid session: token must be a 64-char hex string AND session_valid marker must be "1"
  if (token && token.length === 64 && /^[0-9a-f]+$/.test(token) && sessionValid === "1") {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
