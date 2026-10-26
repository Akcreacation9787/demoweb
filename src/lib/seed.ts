import { db } from "@/db";
import { users, walletAccounts, userProfiles, ledgerEntries, investmentRecords, referralRelationships, notifications, supportTickets, withdrawalRequests, calculationConfigs, calculationHistory, auditLogs, systemSettings, sessions, paymentOrders } from "@/db/schema";
import { hashPassword, generateId, generateReferenceId, signToken } from "@/lib/auth";

export async function seedDemoData() {
  return db.transaction(async (tx) => {
  const db = tx;
  // Check if already seeded
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return { seeded: false, reason: "already seeded" };

  const adminId = generateId();
  const adminHash = await hashPassword("Admin@123");
  await db.insert(users).values({
    id: adminId,
    email: "admin@aterkompany.com",
    passwordHash: adminHash,
    name: "Ater Admin",
    phone: "+91 98765 43210",
    role: "super_admin",
    accountStatus: "active",
    referralCode: "ATERADM",
    emailVerified: true,
  });
  await db.insert(walletAccounts).values({ id: generateId(), userId: adminId, balance: "1250000.00", totalInvested: "0.00", totalEarnings: "0.00", currency: "INR" });
  await db.insert(userProfiles).values({ id: generateId(), userId: adminId, city: "Mumbai", country: "India", bankName: "HDFC Bank", bankAccount: "XXXX-1234" });

  const financeId = generateId();
  await db.insert(users).values({ id: financeId, email: "finance@aterkompany.com", passwordHash: await hashPassword("Finance@123"), name: "Ater Finance Operator", role: "finance_operator", accountStatus: "active", referralCode: "ATERFIN", emailVerified: true });
  await db.insert(walletAccounts).values({ id: generateId(), userId: financeId, balance: "0.00", totalInvested: "0.00", totalEarnings: "0.00" });
  await db.insert(userProfiles).values({ id: generateId(), userId: financeId, city: "Mumbai", country: "India" });

  const supportId = generateId();
  await db.insert(users).values({ id: supportId, email: "support@aterkompany.com", passwordHash: await hashPassword("Support@123"), name: "Ater Support Agent", role: "support_agent", accountStatus: "active", referralCode: "ATERSUP", emailVerified: true });
  await db.insert(walletAccounts).values({ id: generateId(), userId: supportId, balance: "0.00", totalInvested: "0.00", totalEarnings: "0.00" });
  await db.insert(userProfiles).values({ id: generateId(), userId: supportId, city: "Mumbai", country: "India" });

  // Create main demo user
  const demoId = generateId();
  const demoHash = await hashPassword("Demo@123");
  await db.insert(users).values({
    id: demoId,
    email: "demo@aterkompany.com",
    passwordHash: demoHash,
    name: "Rajesh Kumar",
    phone: "+91 98765 11111",
    role: "user",
    accountStatus: "active",
    referralCode: "RAJ2026",
    emailVerified: true,
  });
  await db.insert(walletAccounts).values({ id: generateId(), userId: demoId, balance: "284750.50", totalInvested: "500000.00", totalEarnings: "84750.50", totalWithdrawn: "120000.00" });
  await db.insert(userProfiles).values({ id: generateId(), userId: demoId, city: "Chennai", country: "India", address: "12, Anna Nagar, Chennai - 600040", bankName: "ICICI Bank", bankAccount: "ICIC-8899-0011", panNumber: "ABCDE1234F", upiId: "rajesh@upi" });

  // Team members
  const teamNames = ["Priya Sharma", "Arjun Patel", "Kavya Reddy", "Vikram Singh", "Ananya Gupta", "Suresh Menon", "Meera Nair", "Karthik Iyer"];
  const teamIds: string[] = [];
  const teamBalances = ["18500.00", "32400.00", "12750.00", "40800.00", "21900.00", "28750.00", "15300.00", "9700.00"];
  for (let i = 0; i < teamNames.length; i++) {
    const tid = generateId();
    teamIds.push(tid);
    const h = await hashPassword("Team@123");
    const code = `TEAM${(i+1).toString().padStart(3, "0")}`;
    await db.insert(users).values({
      id: tid,
      email: `team${i+1}@demo.com`,
      passwordHash: h,
      name: teamNames[i],
      phone: `+91 98765 2222${i}`,
      role: "user",
      accountStatus: i === 7 ? "pending_verification" : "active",
      referralCode: code,
      referredBy: i < 4 ? demoId : teamIds[Math.floor(i / 2)],
      emailVerified: true,
    });
    await db.insert(walletAccounts).values({ id: generateId(), userId: tid, balance: teamBalances[i], totalInvested: "50000.00", totalEarnings: "12500.00" });
    await db.insert(userProfiles).values({ id: generateId(), userId: tid, city: ["Chennai","Coimbatore","Madurai","Trichy"][i%4], country: "India" });
    // referral relationship
    const referrer = i < 4 ? demoId : teamIds[Math.floor(i / 2)];
    await db.insert(referralRelationships).values({ id: generateId(), referrerId: referrer, referredId: tid, level: i < 4 ? 1 : 2 });
  }

  // Ledger entries for demo user
  const ledgerData: Array<{type: any, amount: string, status: any, desc: string, daysAgo: number}> = [
    { type: "deposit", amount: "100000.00", status: "completed", desc: "Initial investment - Plan A (1.6% daily)", daysAgo: 30 },
    { type: "deposit", amount: "200000.00", status: "completed", desc: "Investment - Plan B Premium", daysAgo: 25 },
    { type: "earning", amount: "1600.00", status: "completed", desc: "Daily earnings - Plan A", daysAgo: 29 },
    { type: "earning", amount: "1600.00", status: "completed", desc: "Daily earnings - Plan A", daysAgo: 28 },
    { type: "earning", amount: "3200.00", status: "completed", desc: "Daily earnings - Plan B", daysAgo: 24 },
    { type: "referral_reward", amount: "5000.00", status: "completed", desc: "Referral bonus - Priya Sharma", daysAgo: 20 },
    { type: "withdrawal", amount: "50000.00", status: "completed", desc: "Withdrawal to bank - ICICI", daysAgo: 15 },
    { type: "earning", amount: "2850.50", status: "completed", desc: "Daily earnings - All plans", daysAgo: 5 },
    { type: "deposit", amount: "200000.00", status: "pending", desc: "Pending deposit - UPI", daysAgo: 2 },
    { type: "earning", amount: "1750.00", status: "completed", desc: "Daily earnings - Plan A+B", daysAgo: 1 },
  ];
  for (const l of ledgerData) {
    await db.insert(ledgerEntries).values({
      id: generateId(),
      referenceId: generateReferenceId(),
      userId: demoId,
      type: l.type,
      amount: l.amount,
      status: l.status,
      description: l.desc,
      createdAt: new Date(Date.now() - l.daysAgo*24*60*60*1000),
      completedAt: l.status === "completed" ? new Date(Date.now() - l.daysAgo*24*60*60*1000) : null,
    });
  }

  // Investment records
  const plans = [
    { name: "Starter Plan - 0.16%", rate: "0.16", days: 90, amount: "100000.00", earnings: "48000.00" },
    { name: "Growth Plan - 0.50%", rate: "0.50", days: 180, amount: "200000.00", earnings: "36750.50" },
    { name: "Premium Plan - 1.2%", rate: "1.20", days: 60, amount: "200000.00", earnings: "0.00" },
  ];
  for (const p of plans) {
    await db.insert(investmentRecords).values({
      id: generateId(),
      userId: demoId,
      planName: p.name,
      amount: p.amount,
      ratePercent: p.rate,
      durationDays: p.days,
      status: p.earnings === "0.00" ? "pending" : "active",
      startDate: new Date(Date.now() - 20*24*60*60*1000),
      endDate: new Date(Date.now() + (p.days-20)*24*60*60*1000),
      earningsGenerated: p.earnings,
    });
  }

  // Withdrawals
  await db.insert(withdrawalRequests).values({
    id: generateId(), userId: demoId, amount: "50000.00", method: "bank_transfer", destination: "ICICI - 8899-0011", status: "completed", reviewNote: "Approved and processed", createdAt: new Date(Date.now()-15*24*60*60*1000), completedAt: new Date(Date.now()-14*24*60*60*1000)
  });
  await db.insert(withdrawalRequests).values({
    id: generateId(), userId: demoId, amount: "25000.00", method: "upi", destination: "rajesh@upi", status: "pending", createdAt: new Date(Date.now()-2*24*60*60*1000)
  });
  await db.insert(withdrawalRequests).values({
    id: generateId(), userId: demoId, amount: "15000.00", method: "bank_transfer", destination: "ICICI - 8899-0011", status: "under_review", createdAt: new Date(Date.now()-1*24*60*60*1000)
  });

  // Notifications
  const notifs = [
    { title: "Welcome to ATER KOMPANY", message: "Your account has been verified. Start investing today!", type: "registration" as const },
    { title: "New referral joined", message: "Priya Sharma joined using your referral link. +₹5,000 bonus credited.", type: "referral" as const },
    { title: "Withdrawal approved", message: "Your withdrawal of ₹50,000 has been completed. Check your bank.", type: "withdrawal" as const },
    { title: "Daily earnings credited", message: "₹1,750.00 earnings credited to your wallet.", type: "transaction" as const },
    { title: "Support ticket updated", message: "Your ticket #ATK-1024 has been resolved.", type: "support" as const },
  ];
  for (const [index, n] of notifs.entries()) {
    await db.insert(notifications).values({ id: generateId(), userId: demoId, type: n.type, title: n.title, message: n.message, read: index % 2 === 0, createdAt: new Date(Date.now()-(index + 1)*24*60*60*1000) });
  }

  // Support tickets
  await db.insert(supportTickets).values({ id: generateId(), userId: demoId, subject: "Unable to withdraw funds", message: "My withdrawal is stuck in pending for 3 days. Please help.", status: "resolved", priority: "high", response: "Issue resolved. Please check your wallet. Funds released.", createdAt: new Date(Date.now()-4*24*60*60*1000), updatedAt: new Date() });
  await db.insert(supportTickets).values({ id: generateId(), userId: demoId, subject: "KYC verification pending", message: "Submitted KYC documents 2 days ago, still pending.", status: "open", priority: "medium", createdAt: new Date(Date.now()-1*24*60*60*1000), updatedAt: new Date() });

  // Configs
  await db.insert(calculationConfigs).values({ id: generateId(), name: "Standard Daily 0.16%", ratePercent: "0.16", ratePeriod: "daily", minAmount: "10000.00", maxAmount: "1000000.00", effectiveFrom: new Date(), eligibility: "All verified users", version: 1, approved: true });
  await db.insert(calculationConfigs).values({ id: generateId(), name: "Premium 0.50% Compound", ratePercent: "0.50", ratePeriod: "daily", minAmount: "50000.00", maxAmount: "5000000.00", effectiveFrom: new Date(), eligibility: "Premium members only", version: 1, approved: true });

  const demoConfigs = await db.select().from(calculationConfigs);
  await db.insert(calculationHistory).values([
    { id: generateId(), userId: demoId, configId: demoConfigs[0].id, baseAmount: "100000.00", ratePercent: "1.60", calculatedAmount: "1600.00", isSimulation: false, createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: generateId(), userId: demoId, configId: demoConfigs[1].id, baseAmount: "250000.00", ratePercent: "0.50", calculatedAmount: "1250.00", isSimulation: true, createdAt: new Date(Date.now() - 86400000) },
  ]);

  for (const [index, payment] of [
    { amount: "100000.00", status: "paid", plan: "Starter Plan - 0.16%", rate: "0.16", days: 90, age: 25 },
    { amount: "200000.00", status: "created", plan: "Growth Plan - 0.50%", rate: "0.50", days: 180, age: 2 },
  ].entries()) {
    const createdAt = new Date(Date.now() - payment.age * 86400000);
    await db.insert(paymentOrders).values({
      id: generateId(),
      userId: demoId,
      provider: "razorpay",
      providerOrderId: `order_demo_${index + 1}`,
      amount: payment.amount,
      currency: "INR",
      status: payment.status,
      planName: payment.plan,
      ratePercent: payment.rate,
      durationDays: payment.days,
      createdAt,
      updatedAt: createdAt,
      paidAt: payment.status === "paid" ? createdAt : null,
    });
  }

  const sessionToken = signToken({ userId: demoId, email: "demo@aterkompany.com", role: "user" });
  await db.insert(sessions).values({ id: generateId(), userId: demoId, token: sessionToken, expiresAt: new Date(Date.now() + 7 * 86400000) });

  // Audit logs
  await db.insert(auditLogs).values({ id: generateId(), actorId: adminId, action: "approve_withdrawal", entity: "withdrawal", entityId: "demo", details: { amount: "50000.00" }, createdAt: new Date(Date.now()-14*24*60*60*1000) });

  await db.insert(systemSettings).values({ id: generateId(), key: "platform_name", value: "ATER KOMPANY", description: "Platform display name", updatedAt: new Date() });
  await db.insert(systemSettings).values({ id: generateId(), key: "withdrawal_min", value: "1000", description: "Minimum withdrawal amount", updatedAt: new Date() });
  await db.insert(systemSettings).values({ id: generateId(), key: "currency", value: "INR", description: "Default platform currency", updatedAt: new Date() });

  return { seeded: true, demoId, adminId, accounts: ["demo@aterkompany.com / Demo@123", "admin@aterkompany.com / Admin@123", "finance@aterkompany.com / Finance@123", "support@aterkompany.com / Support@123", ...teamNames.map((_, i) => `team${i + 1}@demo.com / Team@123`)] };
  });
}
