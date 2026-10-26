import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    const found = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!found.length) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const user = found[0];
    if (user.accountStatus !== "active") {
      const message = user.accountStatus === "suspended"
        ? "Account suspended. Contact support for help."
        : user.accountStatus === "pending_verification"
          ? "Account is pending verification. Contact support for help."
          : "This account is closed. Contact support for help.";
      return NextResponse.json({ error: message }, { status: 403 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, referralCode: user.referralCode }, token });
    res.cookies.set("ater_token", token, { httpOnly: true, path: "/", maxAge: 60*60*24*7, sameSite: "lax" });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
