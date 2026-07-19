import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  // Clear both session cookies
  cookieStore.delete("admin_token");
  cookieStore.delete("admin_session_valid");
  return NextResponse.json({ success: true });
}
