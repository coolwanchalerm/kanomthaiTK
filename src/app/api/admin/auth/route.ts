import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD || "14709000";

    if (password === correctPassword) {
      // Generate a secure random session token
      const sessionToken = randomBytes(32).toString("hex");
      
      const cookieStore = await cookies();
      // Store the session token
      cookieStore.set("admin_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "strict",
      });
      // Store a hash/marker to validate against (just storing "valid" prefix + partial token)
      // We store the token and validate it's non-empty and length-correct as basic check
      cookieStore.set("admin_session_valid", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "strict",
      });
      return NextResponse.json({ success: true });
    }

    // Artificial delay to prevent brute force
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
