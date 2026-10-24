import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, walletAccounts, ledgerEntries, investmentRecords, referralRelationships, notifications } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, auth.userId)).limit(1);
  const ledger = await db.select().from(ledgerEntries).where(eq(ledgerEntries.userId, auth.userId)).orderBy(desc(ledgerEntries.createdAt)).limit(5);
  const investments = await db.select().from(investmentRecords).where(eq(investmentRecords.userId, auth.userId)).orderBy(desc(investmentRecords.createdAt));
  const teamCountResult = await db.select({ count: count() }).from(referralRelationships).where(eq(referralRelationships.referrerId, auth.userId));
  const directCount = teamCountResult[0]?.count || 0;

  // Calculate today's activity (ledger today)
  const today = new Date(); today.setHours(0,0,0,0);
  const allLedger = await db.select().from(ledgerEntries).where(eq(ledgerEntries.userId, auth.userId));
  const todayEarnings = allLedger.filter(l => l.createdAt && new Date(l.createdAt) >= today && l.type === "earning").reduce((s, l) => s + parseFloat(l.amount), 0);
  const teamMembers = await db.select().from(referralRelationships).where(eq(referralRelationships.referrerId, auth.userId)).limit(4);

  // notifications unread
  const unreadNotifs = await db.select().from(notifications).where(eq(notifications.userId, auth.userId)).limit(20);

  // Chart data: ledger-verified earnings and investment records for the last 7 days.
  const chartData: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    const next = new Date(d); next.setDate(next.getDate()+1);
    const dayEarnings = allLedger.filter(l => l.type === "earning" && l.createdAt && new Date(l.createdAt) >= d && new Date(l.createdAt) < next).reduce((s,l)=>s+parseFloat(l.amount),0);
    const dayInvestments = investments
      .filter(inv => inv.createdAt && new Date(inv.createdAt) >= d && new Date(inv.createdAt) < next)
      .map(inv => ({ product: inv.planName, amount: Number(inv.amount) || 0 }));
    chartData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      earnings: dayEarnings,
      investments: dayInvestments.reduce((sum, inv) => sum + inv.amount, 0),
      investmentDetails: dayInvestments,
    });
  }

  const user = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);

  return NextResponse.json({
    wallet: wallet[0] || { balance: "0.00", totalInvested: "0.00", totalEarnings: "0.00" },
    totalInvestment: wallet[0]?.totalInvested || "0.00",
    totalEarnings: wallet[0]?.totalEarnings || "0.00",
    todayEarnings: todayEarnings.toFixed(2),
    directCount,
    teamStats: { total: directCount, active: directCount, level1: teamCountResult[0]?.count || 0, level2: 0 },
    recentTransactions: ledger,
    investments,
    chartData,
    notifications: unreadNotifs,
    user: user[0],
    referralLink: `${req.nextUrl.origin}/register?ref=${user[0]?.referralCode || ""}`,
  });
}
