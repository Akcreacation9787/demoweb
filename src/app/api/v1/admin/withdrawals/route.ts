import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { withdrawalRequests, ledgerEntries, walletAccounts, notifications, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","finance_operator"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const list = await db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt)).limit(100);
  return NextResponse.json({ withdrawals: list });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","finance_operator"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "Missing" }, { status: 400 });
  const w = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
  if (!w.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const cur = w[0];
  let newStatus: any = cur.status;
  if (action === "review") newStatus = "under_review";
  else if (action === "approve") newStatus = "approved";
  else if (action === "reject") newStatus = "rejected";
  else if (action === "processing") newStatus = "processing";
  else if (action === "complete") newStatus = "completed";
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // concurrency protection: only allow valid transitions
  const allowed: Record<string,string[]> = {
    pending: ["under_review","rejected"],
    under_review: ["approved","rejected"],
    approved: ["processing"],
    processing: ["completed"],
  };
  // allow approve directly from pending for simplicity
  if (cur.status !== newStatus && allowed[cur.status] && !allowed[cur.status].includes(newStatus) && !(cur.status==="pending" && newStatus==="approved")) {
    return NextResponse.json({ error: `Cannot transition from ${cur.status} to ${newStatus}` }, { status: 400 });
  }

  await db.update(withdrawalRequests).set({ status: newStatus, reviewNote: reason || null, reviewedBy: auth.userId, updatedAt: new Date(), completedAt: newStatus==="completed" ? new Date() : null }).where(eq(withdrawalRequests.id, id));

  if (newStatus === "completed") {
    // Deduct balance and update ledger
    const amt = parseFloat(cur.amount);
    const wallet = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, cur.userId)).limit(1);
    if (wallet.length) {
      const newBal = (parseFloat(wallet[0].balance) - amt).toFixed(2);
      const newWithdrawn = (parseFloat(wallet[0].totalWithdrawn || "0") + amt).toFixed(2);
      await db.update(walletAccounts).set({ balance: newBal, totalWithdrawn: newWithdrawn }).where(eq(walletAccounts.userId, cur.userId));
    }
    if (cur.ledgerReference) {
      await db.update(ledgerEntries).set({ status: "completed", completedAt: new Date() }).where(eq(ledgerEntries.referenceId, cur.ledgerReference));
    }
  }
  if (newStatus === "rejected" && cur.ledgerReference) {
    await db.update(ledgerEntries).set({ status: "failed" }).where(eq(ledgerEntries.referenceId, cur.ledgerReference));
  }

  await db.insert(notifications).values({ id: generateId(), userId: cur.userId, type: "withdrawal", title: `Withdrawal ${newStatus}`, message: `Your withdrawal of ₹${cur.amount} is now ${newStatus}. ${reason || ""}`, read: false });
  await db.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: `withdrawal_${action}`, entity: "withdrawal", entityId: id, details: { newStatus, reason } });

  return NextResponse.json({ success: true, status: newStatus });
}
