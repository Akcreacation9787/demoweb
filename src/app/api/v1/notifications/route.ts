import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.select().from(notifications).where(eq(notifications.userId, auth.userId)).orderBy(desc(notifications.createdAt)).limit(50);
  return NextResponse.json({ notifications: list, unread: list.filter(n=>!n.read).length });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (id === "all") {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, auth.userId));
  } else if (id) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
  return NextResponse.json({ success: true });
}
