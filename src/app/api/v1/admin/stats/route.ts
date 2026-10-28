import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, userProfiles, referralRelationships, withdrawalRequests, ledgerEntries, supportTickets, auditLogs } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","finance_operator","support_agent"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
  const [allUsers, profiles, referrals, allWithdrawals, transactions, totalTx] = await Promise.all([
    db.select().from(users),
    db.select().from(userProfiles),
    db.select().from(referralRelationships),
    db.select().from(withdrawalRequests),
    db.select().from(ledgerEntries).orderBy(desc(ledgerEntries.createdAt)).limit(5000),
    db.select({ c: count() }).from(ledgerEntries),
  ]);
  const openTickets = await db.select().from(supportTickets).where(eq(supportTickets.status, "open"));
  const recentAudits = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
  const pendingWithdrawals = allWithdrawals.filter((w) => w.status === "pending" || w.status === "under_review");
  const completedTransactions = transactions.filter((tx) => tx.status === "completed");
  const verifiedUsers = allUsers.filter((u) => u.emailVerified).length;
  const pendingVerification = allUsers.filter((u) => u.accountStatus === "pending_verification" || !u.emailVerified).length;
  const userNames = new Map(allUsers.map((u) => [u.id, u.name]));
  const now = new Date();
  const activity = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (29 - index));
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const dayTransactions = transactions.filter((tx) => {
      const d = new Date(tx.createdAt);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    });
    return {
      label: index % 3 === 0 || index === 29 ? `${day.getDate()} ${day.toLocaleDateString("en", { month: "short" })}` : "",
      deposits: dayTransactions.filter((tx) => tx.type === "deposit" && tx.status === "completed").reduce((sum, tx) => sum + Number(tx.amount), 0),
      withdrawals: dayTransactions.filter((tx) => tx.type === "withdrawal" && tx.status === "completed").reduce((sum, tx) => sum + Number(tx.amount), 0),
      accounts: allUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
      }).length,
    };
  });
  const referralRewards = completedTransactions.filter((tx) => tx.type === "referral_reward").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const verificationRate = allUsers.length ? Math.round((verifiedUsers / allUsers.length) * 100) : 0;

  return NextResponse.json({
    totalUsers: allUsers.length,
    totalTransactions: totalTx[0]?.c || 0,
    completedTransactions: completedTransactions.length,
    transactionVolume: completedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0),
    pendingWithdrawals: pendingWithdrawals.length,
    pendingWithdrawalAmount: pendingWithdrawals.reduce((sum, request) => sum + Number(request.amount), 0),
    referralRewards,
    referralCount: referrals.length,
    verifiedUsers,
    pendingVerification,
    verificationRate,
    idDocumentsReceived: profiles.filter((profile) => Boolean(profile.idProofPath)).length,
    activity,
    recentTransactions: transactions.slice(0, 8).map((tx) => ({ ...tx, userName: userNames.get(tx.userId) || "Client" })),
    openTickets: openTickets.length,
    recentAudits,
  });
  } catch (error) {
    console.error("Admin dashboard stats query failed", error);
    return NextResponse.json({ error: "Could not load admin dashboard data. Check the PostgreSQL connection and database schema." }, { status: 503 });
  }
}
