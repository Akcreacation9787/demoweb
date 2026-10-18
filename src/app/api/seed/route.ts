import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json(result);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
export async function GET() {
  try {
    const result = await seedDemoData();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
