import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, walletAccounts, userProfiles, referralRelationships, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, generateId, generateReferralCode } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { encryptIdNumber } from "@/lib/id-data";

const allowedProofTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxProofSize = 5 * 1024 * 1024;

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
    const idType = String(form.get("idType") || "").trim();
    const idNumber = String(form.get("idNumber") || "").trim();
    const whatsappConsent = form.get("whatsappConsent") === "true";
    const proof = form.get("idProof");
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
    if (!address || !city || !state || !country || !postalCode || !idType || !idNumber || !(proof instanceof File)) {
      return NextResponse.json({ error: "Complete the address and identity fields and upload your ID proof" }, { status: 400 });
    }
    if (!allowedProofTypes.has(proof.type) || proof.size === 0 || proof.size > maxProofSize) {
      return NextResponse.json({ error: "ID proof must be a PDF, JPG, or PNG no larger than 5 MB" }, { status: 400 });
    }
    if (whatsappConsent && (!phone || !/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, "")))) {
      return NextResponse.json({ error: "Enter a valid international phone number to receive your member ID on WhatsApp" }, { status: 400 });
    }
    const proofBytes = new Uint8Array(await proof.arrayBuffer());
    const hasPdfSignature = proofBytes[0] === 0x25 && proofBytes[1] === 0x50 && proofBytes[2] === 0x44 && proofBytes[3] === 0x46;
    const hasPngSignature = proofBytes[0] === 0x89 && proofBytes[1] === 0x50 && proofBytes[2] === 0x4e && proofBytes[3] === 0x47;
    const hasJpegSignature = proofBytes[0] === 0xff && proofBytes[1] === 0xd8 && proofBytes[2] === 0xff;
    if ((proof.type === "application/pdf" && !hasPdfSignature) || (proof.type === "image/png" && !hasPngSignature) || (proof.type === "image/jpeg" && !hasJpegSignature)) {
      return NextResponse.json({ error: "The uploaded file does not match its file type" }, { status: 400 });
    }
    let encryptedIdNumber: string;
    try {
      encryptedIdNumber = encryptIdNumber(idNumber);
    } catch {
      return NextResponse.json({ error: "Identity data encryption is not configured. Contact the site administrator." }, { status: 503 });
    }
    const storageUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const storageKey = process.env.SUPABASE_SECRET_KEY;
    if (!storageUrl || !storageKey) {
      return NextResponse.json({ error: "ID proof storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY." }, { status: 503 });
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

    const bucket = process.env.ID_PROOFS_BUCKET || "id-proofs";
    const proofExtension = proof.type === "application/pdf" ? "pdf" : proof.type === "image/png" ? "png" : "jpg";
    const proofPath = `${id}/${generateId()}.${proofExtension}`;
    const storage = createClient(storageUrl, storageKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const upload = await storage.storage.from(bucket).upload(proofPath, proof, { contentType: proof.type, upsert: false });
    if (upload.error) {
      console.error("ID proof upload failed:", upload.error.message);
      return NextResponse.json({ error: "Could not securely upload ID proof. Check the private Supabase Storage bucket configuration." }, { status: 503 });
    }

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
      city, state, country, postalCode, idType, idNumber: encryptedIdNumber, idProofPath: proofPath,
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
