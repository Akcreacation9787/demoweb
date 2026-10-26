import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/BrandLogo";
import { Shield, TrendingUp, Users, Wallet, ArrowRight, Globe, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo variant="full" className="h-[76px] w-[98px]" />
            <div className="text-xs tracking-widest text-slate-500">Connect. Grow. Prosper.</div>
          </div>
          <div className="hidden items-center gap-6 md:flex text-sm font-medium text-slate-600"><a href="#features" className="hover:text-[#062D66]">Features</a><a href="#plans" className="hover:text-[#062D66]">Plans</a><a href="#security" className="hover:text-[#062D66]">Security</a></div>
          <div className="flex items-center gap-3"><Link href="/login"><Button variant="ghost">Login</Button></Link><Link href="/register"><Button className="bg-[#0876E8] hover:bg-[#0665C7]">Get Started</Button></Link></div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#062D66] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#062D66] via-[#0756A5] to-[#0876E8] opacity-90" />
        <div className="absolute -top-20 -right-20 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide"><Zap className="h-4 w-4 text-amber-300" /> TRUSTED BY 50,000+ INVESTORS</div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight lg:text-5xl">Driven by Trust. Defined by Growth. <span className="break-words text-[#00B6E7]">ATER KOMPANY</span></h1>
            <p className="mt-4 max-w-xl space-y-1 break-words text-white/80">
              <span className="block"><strong className="font-semibold text-white">Investment tracking:</strong> View balances, plans, and transaction history.</span>
              <span className="block"><strong className="font-semibold text-white">Referral management:</strong> Monitor referral links, eligible commissions, and customer activity.</span>
              <span className="block"><strong className="font-semibold text-white">Earnings ledger:</strong> Review calculated earnings with a clear breakdown of each entry.</span>
              <span className="block"><strong className="font-semibold text-white">Withdrawals:</strong> Submit requests and track approval and payment status.</span>
              <span className="block"><strong className="font-semibold text-white">Configurable calculations:</strong> Manage authorised rates, eligibility rules, and calculation periods.</span>
              <span className="block"><strong className="font-semibold text-white">Audit trails:</strong> Record administrative changes and financial transactions.</span>
              <span className="block"><strong className="font-semibold text-white">Notifications:</strong> Receive timely updates on transactions, verification, and withdrawals.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/register"><Button size="lg" className="bg-white hover:bg-slate-100" style={{ color: "#062D66" }}>Create Account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link href="#how-it-works"><Button size="lg" variant="outline" className="border-white/40 hover:bg-white/10" style={{ backgroundColor: "transparent", color: "white" }}>View Demo</Button></Link></div>
            <div className="mt-8 flex items-center gap-6 text-sm text-white/70"><span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Bank-grade security</span><span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Tamil + English</span></div>
          </div>
          <Card className="border-0 bg-white p-0 shadow-2xl overflow-hidden">
            <div className="bg-[#F8FAFC] p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">Dashboard Preview</div>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">LIVE</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#062D66] p-4 text-white"><div className="text-xs text-white/70">Total Investment</div><div className="mt-1 text-lg font-bold">₹5,00,000</div><div className="text-xs text-emerald-300">+12.5%</div></div>
                <div className="rounded-xl bg-[#0876E8] p-4 text-white"><div className="text-xs text-white/80">Total Earnings</div><div className="mt-1 text-lg font-bold">₹84,750</div><div className="text-xs text-white/80">Today +₹1.6%</div></div>
                <div className="rounded-xl bg-white border p-4"><div className="text-xs text-slate-500">Direct Members</div><div className="mt-1 text-lg font-bold text-[#062D66]">4</div><div className="text-xs text-slate-500">Team 8</div></div>
              </div>
              <div className="mt-4 h-24 rounded-xl bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] p-3 flex items-end gap-1">
                {[40,65,50,80,60,90,70].map((h,i)=><div key={i} className="flex-1 rounded-t bg-[#0876E8]" style={{height: `${h}%`}} />)}
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-sm"><span className="font-semibold">Recent Transactions</span><span className="text-[#0876E8]">View all</span></div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { t:"Investment - Plan A", a:"+₹100,000", c:"text-emerald-600" },
                  { t:"Earnings - Daily 1.6%", a:"+₹1,600", c:"text-emerald-600" },
                  { t:"Withdrawal to ICICI", a:"-₹50,000", c:"text-slate-700" },
                ].map((r,i)=><div key={i} className="flex items-center justify-between border-b pb-2 last:border-0"><div><div className="font-medium">{r.t}</div><div className="text-xs text-slate-500">Completed • ATK…{100+i}</div></div><div className={`font-bold ${r.c}`}>{r.a}</div></div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#0876E8]">Product demo</p>
          <h2 className="mt-2 text-3xl font-bold text-[#062D66]">See how the platform works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">A quick walkthrough of the steps shown in your account dashboard.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { step: "01", title: "Choose a plan", description: "Review the available plan details and enter the amount you want to record.", icon: Wallet },
            { step: "02", title: "Complete verification", description: "Payments are verified before an investment record is activated.", icon: Shield },
            { step: "03", title: "Track activity", description: "See investment records, ledger activity, referrals, and earnings in your dashboard.", icon: TrendingUp },
          ].map(item => (
            <Card key={item.step} className="p-6">
              <div className="flex items-center justify-between"><span className="text-sm font-bold tracking-widest text-[#0876E8]">{item.step}</span><item.icon className="h-6 w-6 text-[#0876E8]" /></div>
              <h3 className="mt-5 font-semibold text-[#062D66]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">Demo walkthrough only. Example calculations are simulations and are not guaranteed returns.</p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center"><h2 className="text-3xl font-bold text-[#062D66]">Everything you need to grow</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">From referral genealogy to ledger-accurate earnings — ATER KOMPANY keeps every rupee auditable.</p></div>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: Wallet, title:"Wallet & Ledger", desc:"Deposit records, balance history, unique Tx IDs, refunds & adjustments." },
            { icon: Users, title:"Referral & Team", desc:"Unique link, 4-direct view, multi-level tree, search & filters." },
            { icon: TrendingUp, title:"Earnings Engine", desc:"Configurable % rates, history, simulation vs verified earnings." },
            { icon: Shield, title:"Admin & Audit", desc:"User management, withdrawal approvals, role permissions & logs." },
          ].map(f=>(
            <Card key={f.title} className="p-6 hover:shadow-md transition"><f.icon className="h-8 w-8 text-[#0876E8]" /><h3 className="mt-4 font-semibold text-[#062D66]">{f.title}</h3><p className="mt-2 text-sm text-slate-600">{f.desc}</p></Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="bg-[#F1F5F9] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-[#062D66]">Investment Plans (Example rates)</h2>
          <p className="text-center text-sm text-slate-500 mt-2">0.30% and 0.16% shown as examples — not guaranteed daily returns. Review business terms before activation.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { name:"Starter 0.30%", amt:"₹10,000 - ₹1,00,000", days:"30 days", color:"bg-[#062D66]" },
              { name:"Growth 0.50%", amt:"₹50,000 - ₹5,00,000", days:"30 days", color:"bg-[#0876E8]" },
              { name:"Premium 0.16%", amt:"₹1,00,000 - ₹25,00,000", days:"30 days", color:"bg-emerald-600" },
            ].map(p=>(
              <Card key={p.name} className="overflow-hidden"><div className={`p-4 text-white ${p.color}`}><div className="text-sm opacity-80">{p.days}</div><div className="text-xl font-bold">{p.name}</div></div><CardContent className="pt-4"><div className="text-sm text-slate-600">{p.amt}</div><ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside"><li>Daily calculation simulation</li><li>Manual verification for payouts</li><li>Audit trail & ledger entries</li></ul><Link href="/register"><Button className="mt-4 w-full">Select Plan</Button></Link></CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3"><BrandLogo variant="mark" className="h-9 w-9 border border-slate-200" /><span className="text-sm font-semibold text-[#062D66]">© 2026 ATER KOMPANY — All rights reserved. Simulations ≠ guaranteed income.</span></div>
          <div className="flex gap-4 text-sm text-slate-500"><a href="#" className="hover:text-[#062D66]">Privacy</a><a href="#" className="hover:text-[#062D66]">Terms</a><a href="#" className="hover:text-[#062D66]">Risk Disclosure</a></div>
        </div>
      </footer>
    </div>
  );
}
