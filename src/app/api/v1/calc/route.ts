import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { calculationConfigs, calculationHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const configs = await db.select().from(calculationConfigs);
  const history = await db.select().from(calculationHistory).where(eq(calculationHistory.userId, auth.userId)).orderBy(desc(calculationHistory.createdAt)).limit(20);
  return NextResponse.json({ configs, history });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { baseAmount, ratePercent, days, isSimulation } = await req.json();
  if (!baseAmount || !ratePercent) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const base = parseFloat(baseAmount);
  const rate = parseFloat(ratePercent);
  const d = parseInt(days || "30");
  if (isNaN(base) || isNaN(rate)) return NextResponse.json({ error: "Invalid numbers" }, { status: 400 });
  // Simple calc: daily rate * days, not compounding unless specified, rounded to 2 decimals
  const calculated = parseFloat((base * (rate/100) * d).toFixed(2));
  await db.insert(calculationHistory).values({
    id: generateId(), userId: auth.userId, baseAmount: base.toFixed(2), ratePercent: rate.toFixed(2), calculatedAmount: calculated.toFixed(2), isSimulation: isSimulation !== false, createdAt: new Date()
  });
  return NextResponse.json({ result: calculated, assumptions: `Simple interest: ${rate}% daily × ${d} days, non-compounding. Hypothetical simulation only — not credited to ledger.`, isSimulation: true });
}
