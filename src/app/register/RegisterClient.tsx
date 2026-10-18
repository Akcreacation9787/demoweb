"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", referralCode: ref });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await register(form); router.push("/dashboard"); } catch (err:any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      <div className="hidden lg:flex flex-1 bg-[#0F2540] text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[#2563EB]/20 blur-3xl" />
        <div>
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white text-[#0F2540] flex items-center justify-center font-black">AK</div><div><div className="font-bold leading-none">ATER KOMPANY</div><div className="text-xs tracking-widest text-white/60">JOIN THE NETWORK</div></div></div>
          <h1 className="mt-16 text-4xl font-extrabold">Create your account — <span className="text-[#60A5FA]">refer, invest, grow</span> together</h1>
          <ul className="mt-6 space-y-3 text-sm text-white/80 list-disc list-inside"><li>Unique referral link & multi-level genealogy</li><li>Ledger-accurate investment records</li><li>Secure withdrawals with audit trail</li></ul>
        </div>
        <div className="text-xs text-white/50">By registering you agree to risk disclosures. Earnings simulations ≠ guarantees.</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-[#0F2540] text-center">Create account</h2><p className="text-center text-sm text-slate-500 mt-1">Start your ATER journey today</p>
          <form onSubmit={handle} className="mt-6 space-y-4">
            <div><Label>Full Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 ..." /></div>
            <div><Label>Password (min 6 chars)</Label><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
            <div><Label>Referral Code (optional)</Label><Input value={form.referralCode} onChange={e=>setForm({...form,referralCode:e.target.value})} placeholder="e.g. RAJ2026" /></div>
            {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full bg-[#0F2540] hover:bg-[#15365E]">{loading ? "Creating..." : "Create account"}</Button>
            <div className="text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="text-[#2563EB] font-medium">Sign in</Link></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
