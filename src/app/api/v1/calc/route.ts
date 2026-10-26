import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { calculationConfigs, calculationHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/auth";

// Amounts are rupees with two decimal places; 0.16 means 0.16 percent.
function decimalToScaledInt(value: unknown, scale: number): bigint | null {
  const raw = String(value ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > scale) return null;
  return BigInt(whole) * BigInt("10") ** BigInt(scale) + BigInt((fraction + "0".repeat(scale)).slice(0, scale) || "0");
}

function scaledIntToDecimal(value: bigint, scale: number): string {
  const unit = BigInt("10") ** BigInt(scale);
  return `${value / unit}.${String(value % unit).padStart(scale, "0")}`;
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / BigInt("2")) / denominator;
}

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
  if (baseAmount === undefined || ratePercent === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const baseCents = decimalToScaledInt(baseAmount, 2);
  const requestedRateHundredths = decimalToScaledInt(ratePercent, 2);
  const dayCount = Number(days ?? 30);
  if (baseCents === null || requestedRateHundredths === null || !Number.isSafeInteger(dayCount) || dayCount < 1 || dayCount > 3650 || baseCents <= BigInt("0")) {
    return NextResponse.json({ error: "Invalid calculation values" }, { status: 400 });
  }

  const now = new Date();
  const configs = await db.select().from(calculationConfigs);
  const config = configs
    .filter((item) => item.approved && item.ratePeriod === "daily" && item.name.toLowerCase().startsWith("standard daily"))
    .sort((a, b) => b.version - a.version)[0];
  if (!config) return NextResponse.json({ error: "No approved standard daily rate is configured" }, { status: 409 });

  const configuredRateHundredths = decimalToScaledInt(config.ratePercent, 2);
  if (configuredRateHundredths === null || requestedRateHundredths !== configuredRateHundredths) {
    return NextResponse.json({ error: "Rate does not match the currently approved daily rate", ratePercent: config.ratePercent }, { status: 400 });
  }

  // Cents × hundredths of a percent / 10,000, rounded half-up to cents.
  const calculatedCents = roundHalfUp(baseCents * configuredRateHundredths * BigInt(dayCount), BigInt("10000"));
  const calculatedDecimal = scaledIntToDecimal(calculatedCents, 2);
  const baseDecimal = scaledIntToDecimal(baseCents, 2);
  const rateDecimal = scaledIntToDecimal(configuredRateHundredths, 2);
  await db.insert(calculationHistory).values({
    id: generateId(), userId: auth.userId, configId: config.id,
    baseAmount: baseDecimal, ratePercent: rateDecimal, calculatedAmount: calculatedDecimal,
    isSimulation: isSimulation !== false, createdAt: now,
  });

  return NextResponse.json({
    result: Number(calculatedDecimal), ratePercent: rateDecimal,
    assumptions: `Simple interest: ${rateDecimal}% daily × ${dayCount} days, non-compounding. Hypothetical simulation only — not credited to ledger.`,
    isSimulation: isSimulation !== false,
  });
}
