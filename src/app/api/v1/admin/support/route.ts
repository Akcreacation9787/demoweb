import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, supportTickets, users } from "@/db/schema";
import { generateId } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/api-auth";

const allowedRoles = ["admin", "super_admin", "support_agent"];
const validStatuses = new Set(["open", "in_progress", "resolved", "closed"]);

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !allowedRoles.includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [tickets, clients] = await Promise.all([
      db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(300),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users),
    ]);
    const byId = new Map(clients.map((client) => [client.id, client]));
    return NextResponse.json({ tickets: tickets.map((ticket) => ({ ...ticket, user: byId.get(ticket.userId) || null })) });
  } catch (error) {
    console.error("Admin support load failed", error);
    return NextResponse.json({ error: "Could not load support tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !allowedRoles.includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id, status, response } = await req.json();
    if (!id || !validStatuses.has(status)) return NextResponse.json({ error: "Choose a valid ticket status" }, { status: 400 });
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (!ticket) return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    const now = new Date();
    await db.update(supportTickets).set({ status, response: response?.trim() || ticket.response, assignedTo: auth.userId, updatedAt: now }).where(eq(supportTickets.id, id));
    await db.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_support_ticket", entity: "support_ticket", entityId: id, details: { status } });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Admin support update failed", error);
    return NextResponse.json({ error: "Could not update support ticket" }, { status: 500 });
  }
}
