import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, withdrawalRequests, ledgerEntries, supportTickets, auditLogs } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","finance_operator","support_agent"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const totalUsers = await db.select({ c: count() }).from(users);
  const pendingWithdrawals = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending"));
  const totalTx = await db.select({ c: count() }).from(ledgerEntries);
  const openTickets = await db.select().from(supportTickets).where(eq(supportTickets.status, "open"));
  const recentAudits = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
  const pendingWithdrawalsCount = pendingWithdrawals.length;

  return NextResponse.json({
    totalUsers: totalUsers[0]?.c || 0,
    totalTransactions: totalTx[0]?.c || 0,
    pendingWithdrawals: pendingWithdrawalsCount,
    openTickets: openTickets.length,
    recentAudits,
    stats: {
      revenue: "12,84,500.00",
      growth: "+12.5%"
    }
  });
}
