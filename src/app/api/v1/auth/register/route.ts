import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, walletAccounts, userProfiles, referralRelationships, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, generateId, generateReferralCode } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, referralCode } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });

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
      email: email.toLowerCase(),
      passwordHash: hash,
      name,
      phone: phone || null,
      role: "user",
      accountStatus: "active",
      referralCode: finalCode,
      referredBy: referredBy,
    });
    await db.insert(walletAccounts).values({ id: generateId(), userId: id, balance: "0.00", totalInvested: "0.00", totalEarnings: "0.00", totalWithdrawn: "0.00" });
    await db.insert(userProfiles).values({ id: generateId(), userId: id });

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

    const token = signToken({ userId: id, email: email.toLowerCase(), role: "user" });
    const res = NextResponse.json({ success: true, user: { id, email: email.toLowerCase(), name, referralCode: finalCode }, token });
    res.cookies.set("ater_token", token, { httpOnly: true, path: "/", maxAge: 60*60*24*7, sameSite: "lax" });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
