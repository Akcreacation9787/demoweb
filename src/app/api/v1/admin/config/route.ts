import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, calculationConfigs } from "@/db/schema";
import { generateId } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/api-auth";

const allowedRoles = ["admin", "super_admin"];

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !allowedRoles.includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const configs = await db.select().from(calculationConfigs).orderBy(desc(calculationConfigs.version));
    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Admin calculation config load failed", error);
    return NextResponse.json({ error: "Could not load calculation settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !allowedRoles.includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { ratePercent } = await req.json();
    const rate = Number(ratePercent);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100 || !/^\d+(?:\.\d{1,2})?$/.test(String(ratePercent))) {
      return NextResponse.json({ error: "Enter a daily rate from 0.01% to 100%, with up to 2 decimal places" }, { status: 400 });
    }
    const now = new Date();
    const [current] = (await db.select().from(calculationConfigs))
      .filter((config) => config.approved && config.ratePeriod === "daily" && config.name.toLowerCase().startsWith("standard daily"))
      .sort((a, b) => b.version - a.version);
    const allConfigs = await db.select({ version: calculationConfigs.version }).from(calculationConfigs);
    const nextVersion = Math.max(0, ...allConfigs.map((row) => row.version)) + 1;
    const id = generateId();
    await db.transaction(async (tx) => {
      if (current) await tx.update(calculationConfigs).set({ approved: false, effectiveTo: now }).where(eq(calculationConfigs.id, current.id));
      await tx.insert(calculationConfigs).values({
        id, name: `Standard Daily ${rate.toFixed(2)}%`, ratePercent: rate.toFixed(2), ratePeriod: "daily",
        minAmount: current?.minAmount || "0.00", maxAmount: current?.maxAmount || null,
        effectiveFrom: now, eligibility: current?.eligibility || "Approved standard daily calculation",
        roundingRule: current?.roundingRule || "standard", version: nextVersion, approved: true,
      });
      await tx.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_daily_calculation_rate", entity: "calculation_config", entityId: id, details: { ratePercent: rate.toFixed(2), version: nextVersion } });
    });
    return NextResponse.json({ success: true, ratePercent: rate.toFixed(2), version: nextVersion });
  } catch (error) {
    console.error("Admin calculation config update failed", error);
    return NextResponse.json({ error: "Could not update calculation settings" }, { status: 500 });
  }
}
