import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getUserFromRequest } from "@/lib/api-auth";
import { generateId } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

const PLANS: Record<string, { ratePercent: string; durationDays: number }> = {
  "Starter Plan - 0.16%": { ratePercent: "0.16", durationDays: 90 },
  "Growth Plan - 0.50%": { ratePercent: "0.50", durationDays: 90 },
  "Premium Plan - 1.2%": { ratePercent: "1.20", durationDays: 90 },
};

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { amount, planName } = await req.json();
    const numericAmount = Number(amount);
    const plan = PLANS[planName];
    if (!plan || !Number.isFinite(numericAmount) || numericAmount < 1) {
      return NextResponse.json({ error: "Enter a valid amount and plan" }, { status: 400 });
    }
    const amountPaise = Math.round(numericAmount * 100);
    if (!Number.isSafeInteger(amountPaise)) return NextResponse.json({ error: "Amount is too large" }, { status: 400 });

    const { client, keyId } = getRazorpay();
    const localId = generateId();
    const order = await client.orders.create({ amount: amountPaise, currency: "INR", receipt: localId, notes: { userId: auth.userId, planName } });
    await prisma.paymentOrder.create({
      data: { id: localId, userId: auth.userId, providerOrderId: order.id, amount: numericAmount.toFixed(2), planName, ratePercent: plan.ratePercent, durationDays: plan.durationDays },
    });
    return NextResponse.json({ keyId, orderId: order.id, amount: amountPaise, currency: "INR", name: "ATER KOMPANY", description: planName });
  } catch (error) {
    console.error("Payment order creation failed", error);
    const message = error instanceof Error && error.message === "Razorpay is not configured" ? error.message : "Unable to create payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
