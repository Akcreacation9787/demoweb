"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", referralCode: ref });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      Object.entries(form).forEach(([key, value]) => formData.set(key, value));
      const result = await register(formData);
      if (formData.get("whatsappConsent") === "true" && !result.whatsappSent) {
        setComplete(true);
        setNotice("Your account was created, but WhatsApp could not send your member ID. The WhatsApp service may not be configured or the message could not be delivered.");
        return;
      }
      router.push("/dashboard");
    } catch (err:any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      <div className="hidden lg:flex flex-1 bg-[#062D66] text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-[#0876E8]/20 blur-3xl" />
        <div>
          <div className="flex items-center gap-3"><BrandLogo variant="mark" className="h-12 w-12" /><div><div className="font-bold leading-none">ATER KOMPANY</div><div className="text-xs tracking-widest text-white/60">JOIN THE NETWORK</div></div></div>
          <h1 className="mt-16 text-4xl font-extrabold">Create your account — <span className="text-[#00B6E7]">refer, invest, grow</span> together</h1>
          <ul className="mt-6 space-y-3 text-sm text-white/80 list-disc list-inside"><li>Unique referral link & multi-level genealogy</li><li>Ledger-accurate investment records</li><li>Secure withdrawals with audit trail</li></ul>
        </div>
        <div className="text-xs text-white/50">By registering you agree to risk disclosures. Earnings simulations ≠ guarantees.</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8">
          <h2 className="text-2xl font-bold text-[#062D66] text-center">Create account</h2><p className="text-center text-sm text-slate-500 mt-1">Start your ATER journey today</p>
          <form onSubmit={handle} className="mt-6 space-y-4">
            <div><Label>Full Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><Label>Phone / WhatsApp</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 98765 43210" autoComplete="tel" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
            <div><Label>Password (min 6 chars)</Label><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
            <div><Label>Referral Code (optional)</Label><Input value={form.referralCode} onChange={e=>setForm({...form,referralCode:e.target.value})} placeholder="e.g. RAJ2026" /></div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-[#062D66]">Address details</h3>
              <div className="mt-3 space-y-3">
                <div><Label>Address line 1</Label><Input name="address" autoComplete="address-line1" required /></div>
                <div><Label>Address line 2 (optional)</Label><Input name="addressLine2" autoComplete="address-line2" /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>City</Label><Input name="city" autoComplete="address-level2" required /></div>
                  <div><Label>State / Province</Label><Input name="state" autoComplete="address-level1" required /></div>
                  <div><Label>Postal code</Label><Input name="postalCode" autoComplete="postal-code" required /></div>
                  <div><Label>Country</Label><Input name="country" autoComplete="country-name" required /></div>
                </div>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input name="whatsappConsent" type="checkbox" value="true" className="mt-1" />
              <span>Send my generated customer/member ID to my WhatsApp number after registration.</span>
            </label>
            {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}
            {notice && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">{notice}<Button type="button" onClick={()=>router.push("/dashboard")} className="mt-3 w-full bg-[#062D66]">Continue to dashboard</Button></div>}
            <Button type="submit" disabled={loading || complete} className="w-full bg-[#062D66] hover:bg-[#08417F]">{loading ? "Creating..." : complete ? "Account created" : "Create account"}</Button>
            <div className="text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="text-[#0876E8] font-medium">Sign in</Link></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
