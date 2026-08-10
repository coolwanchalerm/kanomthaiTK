import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Lightweight query — just fetch 1 row to wake up Supabase
    const { error } = await supabase
      .from("categories")
      .select("id")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase is alive 🟢",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
