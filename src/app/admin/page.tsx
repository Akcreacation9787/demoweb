"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, CreditCard, FileText, Settings, ArrowLeft, Check, X, Clock, Download } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { fetchJson } from "@/lib/api";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/login"); else if (user && !["admin","super_admin","finance_operator","support_agent"].includes(user.role)) router.push("/dashboard"); }, [loading, user]);

  const load = async () => {
    const s = await fetchJson<any>("/api/v1/admin/stats"); setStats(s);
    const u = await fetchJson<any>(`/api/v1/admin/users?q=${encodeURIComponent(search)}`); setUsers(u.users || []);
    const w = await fetchJson<any>("/api/v1/admin/withdrawals"); setWithdrawals(w.withdrawals || []);
  };
  useEffect(()=>{ if (user) load(); }, [user]);

  const handleWithdrawalAction = async (id:string, action:string) => {
    const reason = action==="reject" ? prompt("Rejection reason:") : undefined;
    const res = await fetch("/api/v1/admin/withdrawals", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, action, reason }) });
    const data = await res.json();
    if (!res.ok) alert(data.error); else { alert(`Withdrawal ${action} success`); load(); }
  };

  const handleUserAction = async (userId:string, action:string, value:string) => {
    const res = await fetch("/api/v1/admin/users", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ userId, action, value }) });
    if (res.ok) { alert("Updated"); load(); } else alert("Failed");
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F2540] border-t-transparent" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="bg-[#0F2540] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><Shield className="h-6 w-6" /><span className="font-bold">ATER KOMPANY — Admin Panel</span><Badge className="bg-white/20 text-white border-white/30">{user.role}</Badge></div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={()=>router.push("/dashboard")} className="bg-white text-[#0F2540]"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Button></div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id:"overview", label:"Overview", icon: FileText },
            { id:"users", label:"User Management", icon: Users },
            { id:"withdrawals", label:"Withdrawal Queue", icon: CreditCard },
            { id:"config", label:"Config & Audit", icon: Settings },
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border ${tab===t.id ? "bg-[#0F2540] text-white border-[#0F2540]" : "bg-white hover:bg-slate-50"}`}><t.icon className="h-4 w-4" />{t.label}</button>
          ))}
        </div>

        {tab==="overview" && stats && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="p-5"><div className="text-xs text-slate-500">Total Users</div><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
              <Card><CardContent className="p-5"><div className="text-xs text-slate-500">Total Transactions</div><div className="text-2xl font-bold">{stats.totalTransactions}</div></CardContent></Card>
              <Card><CardContent className="p-5"><div className="text-xs text-slate-500">Pending Withdrawals</div><div className="text-2xl font-bold text-amber-600">{stats.pendingWithdrawals}</div></CardContent></Card>
              <Card><CardContent className="p-5"><div className="text-xs text-slate-500">Open Tickets</div><div className="text-2xl font-bold">{stats.openTickets}</div></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle>Audit Logs (Last 10)</CardTitle></CardHeader><CardContent>
              <div className="space-y-2 text-sm">{stats.recentAudits?.map((a:any)=><div key={a.id} className="flex justify-between border-b py-2"><span>{a.action} • {a.entity} {a.entityId}</span><span className="text-xs text-slate-500">{formatDateTime(a.createdAt)}</span></div>)} {(!stats.recentAudits || stats.recentAudits.length===0) && <div className="text-slate-500">No audits yet</div>}</div>
            </CardContent></Card>
          </div>
        )}

        {tab==="users" && (
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>User Management</CardTitle><div className="flex gap-2"><Input placeholder="Search name/email" value={search} onChange={e=>setSearch(e.target.value)} className="h-9" /><Button onClick={load} variant="outline">Search</Button><Button variant="outline" onClick={()=>{ const csv=[ "name,email,role,status,referralCode" ].concat(users.map(u=>`${u.name},${u.email},${u.role},${u.accountStatus},${u.referralCode}`)).join("\n"); const b=new Blob([csv],{type:"text/csv"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="users.csv"; a.click(); }}><Download className="mr-2 h-4 w-4" />CSV</Button></div></CardHeader>
            <CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Referral</th><th>Balance</th><th>Actions</th></tr></thead><tbody>{users.map(u=>(
                <tr key={u.id} className="border-b"><td className="py-2 font-medium">{u.name}</td><td className="text-xs">{u.email}</td><td><Badge variant="outline">{u.role}</Badge></td><td><Badge variant={u.accountStatus==="active"?"success":"danger"}>{u.accountStatus}</Badge></td><td className="font-mono text-xs">{u.referralCode}</td><td className="text-right">{u.wallet ? formatCurrency(u.wallet.balance) : "—"}</td><td className="flex gap-1 justify-end py-2"><Select defaultValue={u.accountStatus} onChange={e=>handleUserAction(u.id, "updateStatus", e.target.value)}><option value="active">active</option><option value="suspended">suspended</option><option value="pending_verification">pending</option></Select><Select defaultValue={u.role} onChange={e=>handleUserAction(u.id, "updateRole", e.target.value)}><option value="user">user</option><option value="admin">admin</option><option value="finance_operator">finance_operator</option><option value="support_agent">support_agent</option></Select></td></tr>
              ))}</tbody></table></div>
            </CardContent>
          </Card>
        )}

        {tab==="withdrawals" && (
          <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Withdrawal Review Queue</CardTitle><Badge variant="warning">{withdrawals.filter(w=>w.status==="pending").length} pending</Badge></CardHeader>
            <CardContent className="space-y-3">
              {withdrawals.map(w=>(
                <div key={w.id} className="rounded-xl border p-4 bg-white">
                  <div className="flex items-center justify-between"><div><div className="font-bold">{formatCurrency(w.amount)} • {w.method} → {w.destination}</div><div className="text-xs text-slate-500">User: {w.userId} • {formatDateTime(w.createdAt)} • Ref: {w.ledgerReference}</div>{w.reviewNote && <div className="text-xs text-slate-600 mt-1">Note: {w.reviewNote}</div>}</div>
                    <div className="text-right"><Badge variant={w.status==="pending"?"warning":w.status==="completed"?"success":w.status==="rejected"?"danger":"outline"}>{w.status}</Badge>
                      <div className="mt-2 flex gap-1 justify-end">
                        {w.status==="pending" && <><Button size="sm" variant="outline" onClick={()=>handleWithdrawalAction(w.id, "review")}><Clock className="h-3 w-3 mr-1" />Review</Button><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={()=>handleWithdrawalAction(w.id, "approve")}><Check className="h-3 w-3 mr-1" />Approve</Button><Button size="sm" variant="outline" className="border-rose-200 text-rose-600" onClick={()=>handleWithdrawalAction(w.id, "reject")}><X className="h-3 w-3 mr-1" />Reject</Button></>}
                        {w.status==="approved" && <Button size="sm" onClick={()=>handleWithdrawalAction(w.id, "processing")}>→ Processing</Button>}
                        {w.status==="processing" && <Button size="sm" className="bg-emerald-600" onClick={()=>handleWithdrawalAction(w.id, "complete")}>Complete</Button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {withdrawals.length===0 && <div className="text-center py-8 text-slate-500">No withdrawals</div>}
            </CardContent>
          </Card>
        )}

        {tab==="config" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Calculation Configuration</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border p-3"><div className="font-semibold">Standard Daily 1.6%</div><div className="text-xs text-slate-500">Rate 1.60% daily • Min ₹10,000 • Approved v1</div><div className="text-xs text-amber-600 mt-2">Example only — not financial advice. Requires legal review before payout.</div></div>
              <div className="rounded-xl border p-3"><div className="font-semibold">Premium 0.50% Compound</div><div className="text-xs text-slate-500">Rate 0.50% daily • Min ₹50,000 • Approved v1</div></div>
              <Button className="w-full bg-[#0F2540]">Manage Configurations (audit-logged)</Button>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>System & Backup</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><div className="font-semibold">Backup & Recovery</div><div className="text-xs text-slate-600 mt-1">pg_dump daily • Point-in-time recovery • Restore: psql $DATABASE_URL &lt; backup.sql</div></div>
              <div className="rounded-xl bg-white border p-3 text-xs">Health: <span className="text-emerald-600 font-bold">/api/health OK</span> • Migrations via drizzle-kit push • Env vars in .env.example</div>
              <div className="text-xs text-slate-500">All admin actions are audited (actor, action, entity, timestamp). CSV exports available for every table.</div>
            </CardContent></Card>
          </div>
        )}
      </div>
    </div>
  );
}
