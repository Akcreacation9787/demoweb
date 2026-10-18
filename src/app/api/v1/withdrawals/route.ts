import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { withdrawalRequests, walletAccounts, ledgerEntries, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId, generateReferenceId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, auth.userId)).orderBy(desc(withdrawalRequests.createdAt));
  return NextResponse.json({ withdrawals: list });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { amount, method, destination } = await req.json();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (parseFloat(amount) < 1000) return NextResponse.json({ error: "Minimum withdrawal is ₹1,000" }, { status: 400 });

    const wallet = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, auth.userId)).limit(1);
    const balance = wallet.length ? parseFloat(wallet[0].balance) : 0;
    if (parseFloat(amount) > balance) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    // Prevent duplicate pending
    const existingPending = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, auth.userId));
    const hasPending = existingPending.some(w => w.status === "pending" && parseFloat(w.amount) === parseFloat(amount));
    if (hasPending) return NextResponse.json({ error: "Duplicate withdrawal request already pending" }, { status: 409 });

    const id = generateId();
    const ref = generateReferenceId();
    await db.insert(withdrawalRequests).values({
      id, userId: auth.userId, amount: parseFloat(amount).toFixed(2), method: method || "bank_transfer", destination: destination || "Bank Account", status: "pending", ledgerReference: ref, createdAt: new Date(), updatedAt: new Date()
    });
    await db.insert(ledgerEntries).values({
      id: generateId(), referenceId: ref, userId: auth.userId, type: "withdrawal", amount: parseFloat(amount).toFixed(2), status: "pending", description: `Withdrawal request - ${method || "bank_transfer"}`, relatedReference: ref
    });
    // Hold balance deduction simulation: don't deduct until completed, but we can notify
    await db.insert(notifications).values({ id: generateId(), userId: auth.userId, type: "withdrawal", title: "Withdrawal requested", message: `Your withdrawal of ₹${amount} is pending review.`, read: false });

    return NextResponse.json({ success: true, id, referenceId: ref, status: "pending" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
