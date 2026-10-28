"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const u = await login(email, password);
      const isOperator = ["admin", "super_admin", "finance_operator", "support_agent"].includes(u.role);
      router.push(isOperator ? "/admin" : "/dashboard");
    } catch (err:any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      <div className="hidden flex-1 bg-[#062D66] text-white lg:flex flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div>
          <div className="flex items-center gap-3"><BrandLogo variant="mark" className="h-12 w-12" /><div><div className="font-bold leading-none">ATER KOMPANY</div><div className="text-xs tracking-widest text-white/60">FINANCIAL GROUP</div></div></div>
          <h1 className="mt-16 text-4xl font-extrabold leading-tight">Welcome back to your <span className="text-[#00B6E7]">financial command</span> center</h1>
          <p className="mt-4 text-white/70">Secure access, audit-ready ledger, real-time team & earnings tracking.</p>
        </div>
        <div className="text-xs text-white/50">Secure access, audit-ready ledger, real-time team & earnings tracking.</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="text-center"><h2 className="text-2xl font-bold text-[#062D66]">Sign in</h2><p className="mt-1 text-sm text-slate-500">Enter your credentials to access the dashboard</p></div>
          <form onSubmit={handle} className="mt-8 space-y-4">
            <div><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@aterkompany.com" type="email" required /></div>
            <div><Label>Password</Label><Input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></div>
            {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full bg-[#062D66] hover:bg-[#08417F]">{loading ? "Signing in..." : "Sign in"}</Button>
            <div className="flex items-center justify-between text-sm"><Link href="/forgot" className="text-[#0876E8] hover:underline">Forgot password?</Link><Link href="/register" className="text-[#0876E8] hover:underline">Create account</Link></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
