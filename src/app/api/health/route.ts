import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function GET() {
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, app: "ATER KOMPANY", database: "supabase" });
  } catch (e) {
    console.error("Supabase health check failed", e);
    return NextResponse.json({ ok: false, database: "supabase" }, { status: 503 });
  }
}
