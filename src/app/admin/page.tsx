"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, Check, Clock,
  Download, Headphones, Home, LogOut, Search, Settings, ShieldCheck,
  Users, Wallet, X, Network, BarChart3,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { fetchJson } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AdminTab = "overview" | "users" | "referrals" | "transactions" | "withdrawals" | "reports" | "compliance" | "support" | "config";

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user && !["admin", "super_admin", "finance_operator", "support_agent"].includes(user.role)) router.push("/dashboard");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchJson<any>("/api/v1/admin/stats"),
      fetchJson<any>(`/api/v1/admin/users?q=${encodeURIComponent(search)}`),
      fetchJson<any>("/api/v1/admin/withdrawals"),
      fetchJson<any>("/api/v1/admin/transactions"),
      fetchJson<any>("/api/v1/admin/referrals"),
      fetchJson<any>("/api/v1/admin/support"),
      fetchJson<any>("/api/v1/admin/config"),
      fetchJson<any>("/api/health"),
    ]);
    const errors: string[] = [];
    const apply = (index: number, setter: (value: any) => void, key: string) => {
      const result = results[index];
      if (result.status === "fulfilled") setter(["stats", "health"].includes(key) ? result.value : (result.value[key] ?? []));
      else if (!result.reason?.message?.includes("403") && !result.reason?.message?.includes("Forbidden")) errors.push(result.reason?.message || `Could not load ${key}`);
    };
    apply(0, setStats, "stats");
    apply(1, setUsers, "users");
    apply(2, setWithdrawals, "withdrawals");
    apply(3, setTransactions, "transactions");
    apply(4, setReferrals, "referrals");
    apply(5, setTickets, "tickets");
    apply(6, setConfigs, "configs");
    apply(7, setDbHealth, "health");
    setLoadError(errors.join(" · "));
  }, [search]);

  useEffect(() => { if (user) void Promise.resolve().then(load); }, [user, load]);

  const handleWithdrawalAction = async (id: string, action: string) => {
    const reason = action === "reject" ? window.prompt("Rejection reason:") : undefined;
    if (action === "reject" && reason === null) return;
    try {
      await fetchJson("/api/v1/admin/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) });
      setLoadError(""); await load();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Withdrawal action failed"); }
  };

  const handleUserAction = async (userId: string, action: string, value: string) => {
    try {
      await fetchJson("/api/v1/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action, value }) });
      setLoadError(""); await load();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Client update failed"); }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleTicketAction = async (id: string, status: string, response: string) => {
    try {
      await fetchJson("/api/v1/admin/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, response }) });
      setLoadError(""); await load();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Support ticket update failed"); }
  };

  const saveDailyRate = async (formData: FormData) => {
    try {
      await fetchJson("/api/v1/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ratePercent: formData.get("ratePercent") }) });
      setLoadError(""); await load();
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Could not save rate"); }
  };

  const exportCsv = (filename: string, headers: string[], values: any[][]) => {
    const rows = [headers, ...values].map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  };

  const exportUsers = () => exportCsv("client-accounts.csv", ["name", "email", "role", "status", "referralCode"], users.map((u) => [u.name, u.email, u.role, u.accountStatus, u.referralCode]));
  const exportTransactions = () => exportCsv("transactions.csv", ["reference", "client", "type", "amount", "currency", "status", "createdAt"], transactions.map((tx) => [tx.referenceId, tx.userName, tx.type, tx.amount, tx.currency, tx.status, tx.createdAt]));

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-slate-100"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-t-transparent" /></div>;

  const allNavigation: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "users", label: "Client Accounts", icon: Users },
    { id: "referrals", label: "Referral Tracking", icon: Network },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "withdrawals", label: "Withdrawals", icon: Wallet },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "support", label: "Support", icon: Headphones },
    { id: "config", label: "Settings", icon: Settings },
  ];
  const navigation = allNavigation.filter((item) => {
    if (["admin", "super_admin"].includes(user.role)) return true;
    if (user.role === "finance_operator") return ["overview", "users", "transactions", "withdrawals", "reports"].includes(item.id);
    if (user.role === "support_agent") return ["overview", "users", "compliance", "support"].includes(item.id);
    return item.id === "overview";
  });
  const activeDailyConfig = configs.filter((config) => config.approved && config.ratePeriod === "daily" && config.name.toLowerCase().startsWith("standard daily"))
    .sort((a, b) => b.version - a.version)[0];

  return (
    <div className="min-h-screen bg-[#f1f6fc] text-[#10234d] md:flex">
      <aside className="flex w-full flex-col bg-[#06244b] text-white md:fixed md:inset-y-0 md:w-[248px]">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><BrandLogo variant="mark" className="h-11 w-11" /><div className="leading-tight"><div className="text-lg font-bold tracking-wide">ATER</div><div className="text-[10px] tracking-[.34em] text-blue-200">KOMPANY</div></div></div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible md:py-6">
          {navigation.map((item, i) => <button key={`${item.label}-${i}`} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${tab === item.id && (item.id === "overview" ? item.label === "Overview" : true) ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20" : "text-blue-100 hover:bg-white/10"}`}><item.icon className="h-[18px] w-[18px]" />{item.label}</button>)}
        </nav>
        <div className="hidden p-4 md:block"><div className="rounded-2xl border border-blue-300/20 bg-white/5 p-4"><Headphones className="mb-3 h-6 w-6 text-sky-200"/><p className="font-semibold">Need help?</p><p className="mt-1 text-xs leading-5 text-blue-100/75">Finance support is ready to assist.</p><a href="mailto:support@aterkompany.com" className="mt-3 block rounded-lg border border-blue-300/30 px-3 py-2 text-center text-sm hover:bg-white/10">Contact Support →</a></div><button onClick={() => router.push("/dashboard")} className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-blue-100 hover:bg-white/10"><LogOut className="h-4 w-4"/>Back to Dashboard</button></div>
      </aside>

      <main className="min-w-0 flex-1 md:ml-[248px]">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
          <div><h1 className="text-lg font-bold md:text-xl">Finance Operations Dashboard</h1><p className="mt-0.5 text-xs text-slate-500">Welcome back, {user.name} <span className="mx-1">|</span> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => void load()} className="border-slate-200 bg-white">Refresh</Button><span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 sm:inline">{user.role.replaceAll("_", " ")}</span><div className="relative"><Button variant="outline" size="icon" aria-label="Recent admin alerts" aria-expanded={alertsOpen} onClick={() => setAlertsOpen((open) => !open)} className="h-9 w-9 border-slate-200"><Bell className="h-4 w-4"/></Button>{alertsOpen && <div className="absolute right-0 top-11 z-30 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><div className="mb-3 font-semibold">Recent admin alerts</div>{(stats?.recentAudits || []).slice(0, 4).map((audit: any) => <div key={audit.id} className="border-t py-2 text-xs"><div className="font-medium capitalize">{String(audit.action).replaceAll("_", " ")}</div><div className="mt-1 text-slate-500">{formatDateTime(audit.createdAt)}</div></div>)}{!stats?.recentAudits?.length && <p className="py-3 text-sm text-slate-500">No recent admin alerts.</p>}<Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setAlertsOpen(false); setTab("config"); }}>Open audit and settings</Button></div>}</div><Button variant="outline" size="sm" disabled={loggingOut} onClick={() => void handleLogout()} className="border-slate-200 bg-white text-rose-700 hover:bg-rose-50"><LogOut className="mr-2 h-4 w-4"/>{loggingOut ? "Logging out…" : "Logout"}</Button></div>
        </header>

        <div className="space-y-5 p-4 md:p-7">
          {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>Some dashboard data could not load: {loadError}</span><Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></div>}
          {tab === "overview" && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric title="Total Client Accounts" value={stats?.totalUsers ?? "—"} detail="Registered accounts" icon={Users} tone="blue" />
              <Metric title="Verified Transactions" value={stats ? Number(stats.completedTransactions || 0).toLocaleString("en-IN") : "—"} detail={`${Number(stats?.transactionVolume || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })} completed volume`} icon={ArrowLeftRight} tone="green" />
              <Metric title="Pending Withdrawals" value={stats ? formatCurrency(stats.pendingWithdrawalAmount || 0) : "—"} detail={`${stats?.pendingWithdrawals ?? 0} requests awaiting review`} icon={Wallet} tone="orange" />
              <Metric title="Referral Rewards" value={stats ? formatCurrency(stats.referralRewards || 0) : "—"} detail="Completed ledger rewards" icon={Users} tone="purple" />
            </section>

            <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,.82fr)]">
              <div className="space-y-5">
                <Panel title="Account Activity" action={<span className="text-xs text-slate-500">Last 30 days</span>}>
                  <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600"><Legend color="bg-[#123f9c]" label="Deposits"/><Legend color="bg-[#43a7f5]" label="Withdrawals"/><Legend color="bg-[#13b981]" label="New accounts"/></div>
                  <div className="h-[260px] w-full">{stats?.activity?.some((day: any) => day.deposits > 0 || day.withdrawals > 0 || day.accounts > 0) ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.activity} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}><CartesianGrid stroke="#dce7f3" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd"/><YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : String(v)}/><Tooltip formatter={(value: any, name: any) => [Number(value).toLocaleString("en-IN"), name]}/><Bar dataKey="deposits" name="Deposits (₹)" fill="#123f9c" radius={[3, 3, 0, 0]}/><Bar dataKey="withdrawals" name="Withdrawals (₹)" fill="#43a7f5" radius={[3, 3, 0, 0]}/><Bar dataKey="accounts" name="New accounts" fill="#13b981" radius={[3, 3, 0, 0]}/></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-sm text-slate-500">No account activity in the last 30 days.</div>}</div>
                </Panel>
                <Panel title="Recent Transactions" action={<button onClick={() => setTab("transactions")} className="text-sm font-medium text-blue-600">View all →</button>}>
                  <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-y bg-slate-50 text-left text-xs text-slate-500"><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Amount (INR)</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date &amp; time</th></tr></thead><tbody>{(stats?.recentTransactions || []).map((tx: any) => <tr key={tx.id} className="border-b border-slate-100"><td className="px-3 py-3 font-mono text-xs text-slate-500">{tx.referenceId}</td><td className="px-3 py-3 font-medium">{tx.userName || "Client"}</td><td className="px-3 py-3 capitalize"><span className="inline-flex items-center gap-2">{tx.type === "withdrawal" ? <ArrowUpRight className="h-4 w-4 text-orange-500"/> : <ArrowDownLeft className="h-4 w-4 text-emerald-600"/>}{tx.type.replaceAll("_", " ")}</span></td><td className="px-3 py-3 font-medium">{formatCurrency(tx.amount)}</td><td className="px-3 py-3"><StatusBadge status={tx.status}/></td><td className="px-3 py-3 text-xs text-slate-500">{formatDateTime(tx.createdAt)}</td></tr>)}{!stats?.recentTransactions?.length && <tr><td colSpan={6} className="py-10 text-center text-slate-500">No transactions recorded yet.</td></tr>}</tbody></table></div>
                </Panel>
              </div>
              <div className="space-y-5">
                <Panel title="Compliance & Verification" action={<button onClick={() => setTab("users")} className="text-sm font-medium text-blue-600">View all →</button>}>
                  <div className="flex items-center gap-5 py-2"><div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border-[8px] border-emerald-500 bg-emerald-50"><div className="text-center"><ShieldCheck className="mx-auto h-6 w-6 text-emerald-600"/><div className="text-xl font-bold">{stats?.verificationRate ?? 0}%</div><div className="text-[9px] text-slate-500">Email verified</div></div></div><div className="min-w-0 flex-1 space-y-3"><ComplianceRow color="bg-emerald-500" label="Email verified" value={stats?.verifiedUsers ?? 0}/><ComplianceRow color="bg-orange-400" label="Pending verification" value={stats?.pendingVerification ?? 0}/><ComplianceRow color="bg-blue-500" label="ID documents received" value={stats?.idDocumentsReceived ?? 0}/></div></div>
                </Panel>
                <Panel title="Client Verification"><div className="mb-3 flex items-center justify-between text-xs"><span>Verified email accounts</span><b>{stats?.verificationRate ?? 0}%</b></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${stats?.verificationRate ?? 0}%` }}/></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">Verified <b className="float-right">{stats?.verifiedUsers ?? 0}</b></div><div className="rounded-lg bg-orange-50 p-3 text-orange-800">Pending <b className="float-right">{stats?.pendingVerification ?? 0}</b></div></div></Panel>
                <Panel title="Recent Admin Activity" action={<span className="text-xs text-blue-600">Audit log</span>}><div className="space-y-3">{(stats?.recentAudits || []).slice(0, 5).map((a: any) => <div key={a.id} className="flex items-start gap-3"><div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Activity className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{String(a.action).replaceAll("_", " ")}</div><div className="text-xs text-slate-500">{a.entity}{a.entityId ? ` · ${a.entityId}` : ""}</div></div><time className="shrink-0 text-[10px] text-slate-400">{formatDateTime(a.createdAt)}</time></div>)}{!stats?.recentAudits?.length && <div className="py-5 text-center text-sm text-slate-500">No admin activity yet.</div>}</div></Panel>
              </div>
            </section>
          </>}

          {tab === "users" && <Panel title="Client Accounts" action={<div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9"/></div><Button onClick={exportUsers} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Export CSV</Button></div>}><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-y bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Client</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Referral code</th><th className="p-3">Balance</th><th className="p-3">Manage</th></tr></thead><tbody>{users.map((u) => <tr key={u.id} className="border-b border-slate-100"><td className="p-3 font-medium">{u.name}</td><td className="p-3 text-xs">{u.email}</td><td className="p-3"><Badge variant="outline">{u.role}</Badge></td><td className="p-3"><StatusBadge status={u.accountStatus}/></td><td className="p-3 font-mono text-xs">{u.referralCode}</td><td className="p-3">{u.wallet ? formatCurrency(u.wallet.balance) : "—"}</td><td className="p-3">{["admin", "super_admin"].includes(user.role) ? <div className="flex min-w-[260px] gap-1"><Select value={u.accountStatus} onChange={(e) => void handleUserAction(u.id, "updateStatus", e.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option><option value="pending_verification">Pending</option><option value="closed">Closed</option></Select>{u.role === "user" && <Button size="sm" variant={u.accountStatus === "active" ? "outline" : "default"} onClick={() => void handleUserAction(u.id, "updateStatus", u.accountStatus === "active" ? "suspended" : "active")}>{u.accountStatus === "active" ? "Suspend" : "Activate"}</Button>}<Select value={u.role} onChange={(e) => void handleUserAction(u.id, "updateRole", e.target.value)}><option value="user">Client</option><option value="admin">Admin</option><option value="finance_operator">Finance</option><option value="support_agent">Support</option>{user.role === "super_admin" && <option value="super_admin">Super admin</option>}</Select></div> : <span className="text-xs text-slate-400">Read only</span>}</td></tr>)}</tbody></table>{!users.length && <div className="py-10 text-center text-slate-500">No client accounts found.</div>}</div></Panel>}

          {tab === "referrals" && <Panel title="Referral Tracking" action={<Badge variant="outline">{referrals.length} relationships</Badge>}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-y bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Referrer</th><th className="p-3">Referral code</th><th className="p-3">New client</th><th className="p-3">Level</th><th className="p-3">Joined</th></tr></thead><tbody>{referrals.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 font-medium">{item.referrer?.name || "Client"}</td><td className="p-3 font-mono text-xs">{item.referrer?.referralCode || "—"}</td><td className="p-3">{item.referred?.name || "Client"}</td><td className="p-3">{item.level}</td><td className="p-3 text-xs text-slate-500">{formatDateTime(item.createdAt)}</td></tr>)}</tbody></table>{!referrals.length && <EmptyState>No referral relationships found.</EmptyState>}</div></Panel>}

          {tab === "transactions" && <Panel title="Transactions" action={<div className="flex items-center gap-2"><Input placeholder="Search client, ref, or type" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9"/><Button onClick={exportTransactions} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Export CSV</Button></div>}><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-y bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Reference</th><th className="p-3">Client</th><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{transactions.filter((tx) => `${tx.referenceId} ${tx.userName} ${tx.type}`.toLowerCase().includes(search.toLowerCase())).map((tx) => <tr key={tx.id} className="border-b border-slate-100"><td className="p-3 font-mono text-xs">{tx.referenceId}</td><td className="p-3">{tx.userName}</td><td className="p-3 capitalize">{String(tx.type).replaceAll("_", " ")}</td><td className="p-3">{formatCurrency(tx.amount)}</td><td className="p-3"><StatusBadge status={tx.status}/></td><td className="p-3 text-xs text-slate-500">{formatDateTime(tx.createdAt)}</td></tr>)}</tbody></table>{!transactions.length && <EmptyState>No transactions found.</EmptyState>}</div></Panel>}

          {tab === "reports" && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><ReportAction title="Client accounts" count={stats?.totalUsers ?? 0} onClick={exportUsers}/><ReportAction title="Transactions" count={stats?.totalTransactions ?? 0} onClick={exportTransactions}/><ReportAction title="Referral relationships" count={stats?.referralCount ?? referrals.length} onClick={() => exportCsv("referrals.csv", ["referrer", "referred", "level", "createdAt"], referrals.map((r) => [r.referrer?.name, r.referred?.name, r.level, r.createdAt]))}/></div>}

          {tab === "compliance" && <Panel title="Client Verification" action={<Badge variant="outline">{stats?.verificationRate ?? 0}% email verified</Badge>}><p className="mb-4 text-sm text-slate-500">Identity document collection is disabled for new registrations. This view reports email verification and account status only.</p><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-y bg-slate-50 text-left text-xs text-slate-500"><th className="p-3">Client</th><th className="p-3">Email</th><th className="p-3">Email verification</th><th className="p-3">Account status</th><th className="p-3">Created</th></tr></thead><tbody>{users.map((client) => <tr key={client.id} className="border-b border-slate-100"><td className="p-3 font-medium">{client.name}</td><td className="p-3">{client.email}</td><td className="p-3"><StatusBadge status={client.emailVerified ? "completed" : "pending"}/></td><td className="p-3"><StatusBadge status={client.accountStatus}/></td><td className="p-3 text-xs text-slate-500">{formatDateTime(client.createdAt)}</td></tr>)}</tbody></table>{!users.length && <EmptyState>No clients found.</EmptyState>}</div></Panel>}

          {tab === "support" && <Panel title="Support Tickets" action={<Badge variant="warning">{tickets.filter((ticket) => ticket.status === "open").length} open</Badge>}><div className="space-y-3">{tickets.map((ticket) => <div key={ticket.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{ticket.subject}</h3><p className="mt-1 text-xs text-slate-500">{ticket.user?.name || "Client"} · {ticket.user?.email || ticket.userId} · {formatDateTime(ticket.createdAt)}</p><p className="mt-3 text-sm">{ticket.message}</p>{ticket.response && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Response: {ticket.response}</p>}</div><div className="flex items-center gap-2"><StatusBadge status={ticket.status}/><Select value={ticket.status} onChange={(e) => void handleTicketAction(ticket.id, e.target.value, ticket.response || "")}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></Select></div></div></div>)}{!tickets.length && <EmptyState>No support tickets found.</EmptyState>}</div></Panel>}

          {tab === "withdrawals" && <Panel title="Withdrawal Review Queue" action={<Badge variant="warning">{withdrawals.filter((w) => w.status === "pending").length} pending</Badge>}><div className="space-y-3">{withdrawals.map((w) => <div key={w.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><div><div className="font-semibold">{formatCurrency(w.amount)} <span className="font-normal text-slate-500">· {w.method}</span></div><div className="mt-1 text-xs text-slate-500">Client {w.userId} · {formatDateTime(w.createdAt)} · Ref {w.ledgerReference || "—"}</div>{w.reviewNote && <div className="mt-1 text-xs">Note: {w.reviewNote}</div>}</div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={w.status}/>{w.status === "pending" && <><Button size="sm" variant="outline" onClick={() => void handleWithdrawalAction(w.id, "review")}><Clock className="mr-1 h-3 w-3"/>Review</Button><Button size="sm" onClick={() => void handleWithdrawalAction(w.id, "approve")}><Check className="mr-1 h-3 w-3"/>Approve</Button><Button size="sm" variant="outline" onClick={() => void handleWithdrawalAction(w.id, "reject")}><X className="mr-1 h-3 w-3"/>Reject</Button></>}{w.status === "under_review" && <><Button size="sm" onClick={() => void handleWithdrawalAction(w.id, "approve")}>Approve</Button><Button size="sm" variant="outline" onClick={() => void handleWithdrawalAction(w.id, "reject")}>Reject</Button></>}{w.status === "approved" && <Button size="sm" onClick={() => void handleWithdrawalAction(w.id, "processing")}>Mark processing</Button>}{w.status === "processing" && <Button size="sm" onClick={() => void handleWithdrawalAction(w.id, "complete")}>Complete</Button>}</div></div>)}{!withdrawals.length && <div className="py-10 text-center text-slate-500">No withdrawals found.</div>}</div></Panel>}

          {tab === "config" && <div className="grid gap-5 xl:grid-cols-2"><Panel title="Calculation Configuration"><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void saveDailyRate(new FormData(e.currentTarget)); }}><div className="rounded-xl border p-4"><div className="font-semibold">Standard daily rate</div><p className="mt-1 text-xs text-slate-500">Current approved rate: {activeDailyConfig ? `${activeDailyConfig.ratePercent}%` : "Not configured"} · Version {activeDailyConfig?.version ?? "—"}</p><label className="mt-4 block text-sm font-medium">New daily rate (%)<Input key={activeDailyConfig?.version ?? "default"} name="ratePercent" type="number" min="0.01" max="100" step="0.01" defaultValue={activeDailyConfig?.ratePercent ?? "0.16"} className="mt-1" required/></label><p className="mt-2 text-xs text-slate-500">Saving creates a new approved version and keeps previous calculations unchanged.</p></div><Button type="submit" className="w-full bg-[#0c3975]">Save daily rate</Button></form></Panel><Panel title="System & Audit"><div className="space-y-3 text-sm"><div className="rounded-xl bg-slate-50 p-4"><b>Database connection</b><p className={`mt-1 text-xs font-medium ${dbHealth?.ok ? "text-emerald-700" : "text-rose-600"}`}>{dbHealth ? (dbHealth.ok ? "PostgreSQL connected" : "PostgreSQL unavailable") : "Checking connection…"}</p></div><div className="rounded-xl border p-4 text-xs">Database: Supabase PostgreSQL<br/>Health check: /api/health</div><p className="text-xs text-slate-500">Administrative changes are recorded in the audit log.</p><div className="max-h-48 space-y-2 overflow-y-auto">{(stats?.recentAudits || []).map((audit: any) => <div key={audit.id} className="border-t pt-2 text-xs"><b>{String(audit.action).replaceAll("_", " ")}</b><span className="float-right text-slate-400">{formatDateTime(audit.createdAt)}</span></div>)}</div></div></Panel></div>}
        </div>
      </main>
    </div>
  );
}

function Metric({ title, value, detail, icon: Icon, tone }: { title: string; value: any; detail: string; icon: any; tone: string }) {
  const styles: Record<string, string> = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", orange: "bg-orange-50 text-orange-600", purple: "bg-violet-50 text-violet-600" };
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className="text-sm font-medium text-slate-600">{title}</div><div className={`grid h-11 w-11 place-items-center rounded-xl ${styles[tone]}`}><Icon className="h-5 w-5"/></div></div><div className="mt-3 text-2xl font-bold tracking-tight text-[#112957]">{value}</div><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="flex min-h-14 items-center justify-between gap-3 px-5 py-3"><h2 className="font-bold text-[#112957]">{title}</h2>{action}</div><div className="px-5 pb-5">{children}</div></section>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${color}`}/>{label}</span>; }
function EmptyState({ children }: { children: ReactNode }) { return <div className="py-10 text-center text-sm text-slate-500">{children}</div>; }
function ReportAction({ title, count, onClick }: { title: string; count: number; onClick: () => void }) { return <Panel title={title}><div className="text-2xl font-bold">{count.toLocaleString("en-IN")}</div><p className="mt-1 text-xs text-slate-500">Available records</p><Button className="mt-4 w-full" variant="outline" onClick={onClick}><Download className="mr-2 h-4 w-4"/>Download CSV</Button></Panel>; }
function ComplianceRow({ color, label, value }: { color: string; label: string; value: number }) { return <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"><i className={`h-2.5 w-2.5 rounded-full ${color}`}/><span className="min-w-0 flex-1 truncate">{label}</span><b>{value}</b></div>; }
function StatusBadge({ status }: { status: string }) { const colors: Record<string, string> = { completed: "bg-emerald-100 text-emerald-700", active: "bg-emerald-100 text-emerald-700", pending: "bg-orange-100 text-orange-700", pending_verification: "bg-orange-100 text-orange-700", under_review: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", processing: "bg-blue-100 text-blue-700", rejected: "bg-rose-100 text-rose-700", failed: "bg-rose-100 text-rose-700", suspended: "bg-rose-100 text-rose-700" }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${colors[status] || "bg-slate-100 text-slate-600"}`}>{status.replaceAll("_", " ")}</span>; }
