"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-[#0F2540]">Forgot password</h2><p className="text-sm text-slate-500 mt-1">We will send reset instructions (mock — no email configured).</p>
        {!sent ? (
          <form onSubmit={e=>{e.preventDefault(); setSent(true);}} className="mt-6 space-y-4">
            <div><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></div>
            <Button type="submit" className="w-full bg-[#0F2540]">Send reset link</Button>
            <div className="text-center text-sm"><Link href="/login" className="text-[#2563EB]">Back to login</Link></div>
          </form>
        ) : (
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">If an account exists for <b>{email}</b>, a reset link has been sent. Check inbox (integration boundary: email service requires SMTP credentials). <Link href="/login" className="underline">Return to login</Link></div>
        )}
      </Card>
    </div>
  );
}
