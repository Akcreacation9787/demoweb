import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, walletAccounts, userProfiles, referralRelationships, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, generateId, generateReferralCode } from "@/lib/auth";

async function sendMemberIdOnWhatsApp(phone: string, memberId: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION;
  if (!token || !phoneNumberId || !templateName || !graphVersion) return false;

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/[^0-9]/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: memberId }] }],
      },
    }),
  });
  if (!response.ok) console.error("WhatsApp Cloud API returned status", response.status);
  return response.ok;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const phone = String(form.get("phone") || "").trim();
    const referralCode = String(form.get("referralCode") || "").trim();
    const address = String(form.get("address") || "").trim();
    const addressLine2 = String(form.get("addressLine2") || "").trim();
    const city = String(form.get("city") || "").trim();
    const state = String(form.get("state") || "").trim();
    const country = String(form.get("country") || "").trim();
    const postalCode = String(form.get("postalCode") || "").trim();
    const whatsappConsent = form.get("whatsappConsent") === "true";
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
    if (!address || !city || !state || !country || !postalCode) {
      return NextResponse.json({ error: "Complete the address fields" }, { status: 400 });
    }
    if (whatsappConsent && (!phone || !/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, "")))) {
      return NextResponse.json({ error: "Enter a valid international phone number to receive your member ID on WhatsApp" }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    let referredBy: string | null = null;
    let referrerId: string | null = null;
    if (referralCode) {
      const ref = await db.select().from(users).where(eq(users.referralCode, referralCode.toUpperCase())).limit(1);
      if (ref.length) {
        referrerId = ref[0].id;
        referredBy = ref[0].id;
      }
    }

    const id = generateId();
    const hash = await hashPassword(password);
    const code = generateReferralCode();
    // ensure unique code - try twice
    let finalCode = code;
    const codeExists = await db.select().from(users).where(eq(users.referralCode, finalCode)).limit(1);
    if (codeExists.length) finalCode = generateReferralCode();

    await db.insert(users).values({
      id,
      email,
      passwordHash: hash,
      name,
      phone: phone || null,
      role: "user",
      accountStatus: "active",
      referralCode: finalCode,
      referredBy: referredBy,
    });
    await db.insert(walletAccounts).values({ id: generateId(), userId: id, balance: "0.00", totalInvested: "0.00", totalEarnings: "0.00", totalWithdrawn: "0.00" });
    await db.insert(userProfiles).values({
      id: generateId(), userId: id, address, addressLine2: addressLine2 || null,
      city, state, country, postalCode, idType: null, idNumber: null, idProofPath: null,
    });

    if (referrerId) {
      // prevent self referral already handled (new id != referrer)
      await db.insert(referralRelationships).values({ id: generateId(), referrerId, referredId: id, level: 1 });
      // notify referrer
      await db.insert(notifications).values({
        id: generateId(), userId: referrerId, type: "referral", title: "New referral joined", message: `${name} joined using your referral link.`, read: false
      });
      // Check for level 2: if referrer was referred by someone, create level 2
      const parentRel = await db.select().from(referralRelationships).where(eq(referralRelationships.referredId, referrerId)).limit(1);
      if (parentRel.length) {
        await db.insert(referralRelationships).values({ id: generateId(), referrerId: parentRel[0].referrerId, referredId: id, level: 2 });
      }
    }

    await db.insert(notifications).values({ id: generateId(), userId: id, type: "registration", title: "Welcome to ATER KOMPANY", message: "Your account has been created. Start investing today!", read: false });

    const token = signToken({ userId: id, email, role: "user" });
    const whatsappSent = whatsappConsent && phone ? await sendMemberIdOnWhatsApp(phone, finalCode).catch((error) => {
      console.error("WhatsApp member ID message failed:", error);
      return false;
    }) : false;
    const res = NextResponse.json({ success: true, whatsappSent, user: { id, email, name, referralCode: finalCode }, token });
    res.cookies.set("ater_token", token, { httpOnly: true, path: "/", maxAge: 60*60*24*7, sameSite: "lax" });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
