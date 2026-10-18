import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getUserFromRequest } from "@/lib/api-auth";
import { generateId, generateReferenceId } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";

function signaturesMatch(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await req.json();
    if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
      return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
    }
    const { keySecret } = getRazorpay();
    if (!signaturesMatch(orderId, paymentId, signature, keySecret)) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }
    const paymentOrder = await prisma.paymentOrder.findUnique({ where: { providerOrderId: orderId } });
    if (!paymentOrder || paymentOrder.userId !== auth.userId) return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    if (paymentOrder.status === "paid") return NextResponse.json({ success: true, alreadyProcessed: true });

    const referenceId = generateReferenceId();
    const investmentId = generateId();
    const now = new Date();
    const endDate = new Date(now.getTime() + paymentOrder.durationDays * 86_400_000);
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.paymentOrder.updateMany({ where: { id: paymentOrder.id, status: "created" }, data: { status: "paid", providerPaymentId: paymentId, signature, paidAt: now } });
      if (claimed.count !== 1) return;
      await tx.investmentRecord.create({ data: { id: investmentId, userId: auth.userId, amount: paymentOrder.amount, planName: paymentOrder.planName, ratePercent: paymentOrder.ratePercent, durationDays: paymentOrder.durationDays, status: "active", startDate: now, endDate, ledgerReference: referenceId } });
      await tx.ledgerEntry.create({ data: { id: generateId(), referenceId, userId: auth.userId, type: "investment", amount: paymentOrder.amount, status: "completed", description: `Razorpay investment - ${paymentOrder.planName}`, relatedReference: paymentId, metadata: { provider: "razorpay", orderId, paymentId }, completedAt: now } });
      await tx.walletAccount.update({ where: { userId: auth.userId }, data: { totalInvested: { increment: paymentOrder.amount }, updatedAt: now } });
    });
    return NextResponse.json({ success: true, investmentId, referenceId });
  } catch (error) {
    console.error("Payment verification failed", error);
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
