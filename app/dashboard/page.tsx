"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  House,
  Megaphone,
  Users,
  ChartBar,
  Gear,
  Question,
  SignOut,
  Bell,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  CaretDown,
  List,
  ShoppingCart,
  TrendUp,
  CurrencyDollar,
  Wallet,
  Funnel,
  Plus,
  DotsThreeVertical,
} from "@phosphor-icons/react";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    label: "Total Orders", value: "3,575,987", change: 29, up: true,
    icon: <ShoppingCart size={18} weight="fill" />,
    gradient: "from-violet-500 to-purple-600",
    bg: "from-violet-50 to-purple-50",
    wave: "M0,18 C15,14 25,22 40,16 C55,10 65,20 80,14 C95,8 105,18 120,12",
  },
  {
    label: "Gross Revenue", value: "3,575 AED", change: 16, up: true,
    icon: <TrendUp size={18} weight="fill" />,
    gradient: "from-indigo-500 to-blue-500",
    bg: "from-indigo-50 to-blue-50",
    wave: "M0,20 C15,16 25,24 40,18 C55,12 65,22 80,16 C95,10 105,20 120,14",
  },
  {
    label: "Total Payouts", value: "2,748 AED", change: null, up: true,
    icon: <CurrencyDollar size={18} weight="fill" />,
    gradient: "from-fuchsia-500 to-pink-500",
    bg: "from-fuchsia-50 to-pink-50",
    wave: "M0,16 C15,20 25,12 40,18 C55,24 65,14 80,20 C95,26 105,16 120,22",
  },
  {
    label: "Wallet Balance", value: "8,250 AED", change: null, up: true,
    icon: <Wallet size={18} weight="fill" />,
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 to-teal-50",
    wave: "M0,14 C15,18 25,10 40,16 C55,22 65,12 80,18 C95,24 105,14 120,20",
  },
];

const PERF_DATA = [
  { month: "Jan", revenue: 22, orders: 32 },
  { month: "Feb", revenue: 16, orders: 24 },
  { month: "Mar", revenue: 48, orders: 56 },
  { month: "Apr", revenue: 30, orders: 38 },
  { month: "May", revenue: 12, orders: 18 },
  { month: "Sep", revenue: 38, orders: 44 },
  { month: "Aug", revenue: 28, orders: 34 },
  { month: "Jun", revenue: 18, orders: 26 },
];

const CAMPAIGNS = [
  { name: "Winter Sales",     type: "E-Commerce Sales", orders: 52, start: "15 Oct, 2026", end: "15 Nov, 2026", status: "Live" },
  { name: "Summer Deals",    type: "E-Commerce Sales", orders: 37, start: "5 Nov, 2026",  end: "5 Dec, 2026",  status: "Approved" },
  { name: "Autumn Specials", type: "E-Commerce Sales", orders: 23, start: "30 Aug, 2026", end: "15 Sep, 2026", status: "Draft" },
  { name: "Spring Discount", type: "E-Commerce Sales", orders: 9,  start: "12 Dec, 2026", end: "30 Dec, 2026", status: "Pending" },
];

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  Live:     { pill: "bg-green-50 text-green-600 border border-green-200",    dot: "bg-green-500" },
  Approved: { pill: "bg-violet-50 text-violet-600 border border-violet-200", dot: "bg-violet-500" },
  Draft:    { pill: "bg-neutral-100 text-neutral-500 border border-neutral-200", dot: "bg-neutral-400" },
  Pending:  { pill: "bg-amber-50 text-amber-600 border border-amber-200",    dot: "bg-amber-400" },
};

const NAV_MENU = [
  { icon: <House size={16} weight="bold" />,     label: "Dashboard" },
  { icon: <Megaphone size={16} weight="bold" />, label: "Campaigns" },
  { icon: <Users size={16} weight="bold" />,     label: "Influencers" },
  { icon: <ChartBar size={16} weight="bold" />,  label: "Analytics" },
];
const NAV_OTHERS = [
  { icon: <Gear size={16} weight="bold" />,     label: "Settings" },
  { icon: <Question size={16} weight="bold" />, label: "Help" },
];

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */
function Sparkline({ path, color }: { path: string; color: string }) {
  return (
    <svg width="80" height="28" viewBox="0 0 120 28" fill="none">
      <path d={path} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Perf chart                                                          */
/* ------------------------------------------------------------------ */
function PerfChart() {
  const H = 180;
  const max = 58;
  const yLabels = ["50K", "40K", "30K", "20K", "10K"];

  return (
    <div>
      <div className="flex">
        <div className="flex flex-col justify-between pr-4 shrink-0 text-right" style={{ height: H }}>
          {yLabels.map((l) => (
            <span key={l} className="text-[10px] font-medium text-neutral-300">{l}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {[0,1,2,3,4].map((i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-neutral-100" style={{ top: `${(i / 4) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-2.5">
            {PERF_DATA.map((d, i) => (
              <div key={i} className="flex flex-1 items-end gap-0.5 relative group cursor-pointer">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none">
                  <div className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap shadow-xl shadow-violet-200">
                    {Math.round(d.revenue / max * 50)}K AED
                  </div>
                  <div className="rounded-lg bg-[#1e1b4b] px-2.5 py-1 text-[10px] font-bold text-white whitespace-nowrap shadow-xl shadow-neutral-200">
                    {Math.round(d.orders / max * 50)}K AED
                  </div>
                </div>
                <div className="flex-1 rounded-t-lg bg-violet-100 group-hover:bg-violet-200 transition-colors" style={{ height: `${(d.orders / max) * H}px` }} />
                <div className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-700 to-violet-500 group-hover:from-violet-800 group-hover:to-violet-600 transition-colors shadow-sm" style={{ height: `${(d.revenue / max) * H}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex mt-3 pl-12">
        {PERF_DATA.map((d) => (
          <div key={d.month} className="flex-1 text-center text-[10px] font-medium text-neutral-400">{d.month}</div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-5 text-[11px] font-semibold text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-violet-700 to-violet-500" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-violet-100" />Orders
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer Overview                                                   */
/* ------------------------------------------------------------------ */
function CustomerOverview() {
  return (
    <div>
      <p className="text-[12px] text-neutral-400 leading-relaxed mb-6">
        New vs. returning customers — track influencer campaign impact over time.
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e1b4b] text-white text-[11px] font-bold">+</div>
              <span className="text-[12px] font-semibold text-neutral-700">New customers</span>
            </div>
            <span className="text-[13px] font-black text-[#1e1b4b]">2,000</span>
          </div>
          <div className="h-10 w-full rounded-xl bg-gradient-to-r from-violet-700 to-violet-500 shadow-lg shadow-violet-200/50" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-300 text-white text-[11px] font-bold">↺</div>
              <span className="text-[12px] font-semibold text-neutral-700">Returning</span>
            </div>
            <span className="text-[13px] font-black text-[#1e1b4b]">400</span>
          </div>
          <div className="h-10 w-[20%] rounded-xl bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-md shadow-violet-100" />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4 text-[11px] font-semibold text-neutral-500">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1e1b4b]" />New customers</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-400" />Returning</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = CAMPAIGNS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-[#fafafa] overflow-hidden" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", zoom: "110%", height: "calc(100vh / 1.1)" }}>

      {/* ── Sidebar ── */}
      <aside className={`flex shrink-0 flex-col bg-white border-r border-neutral-100/80 py-5 overflow-y-auto transition-all duration-200 ${collapsed ? "w-[60px] px-2 items-center" : "w-[210px] px-3"}`}>
        <div className={`mb-8 ${collapsed ? "flex justify-center" : "px-2"}`}>
          {collapsed
            ? <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-[10px] font-black shadow-md">M</div>
            : <Image src="/logo.svg" alt="MoonTech" width={110} height={20} />
          }
        </div>

        {!collapsed && <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-widest text-neutral-300">Menu</p>}
        <nav className="flex flex-col gap-1 mb-6 w-full">
          {NAV_MENU.map((item) => (
            <button key={item.label} onClick={() => setActiveNav(item.label)} title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all text-left ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                activeNav === item.label
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
            >
              {item.icon}
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 w-full">
          {!collapsed && (
            <div className="mb-3">
              <div className="rounded-2xl p-4 shadow-sm border border-[#e9defa]/60" style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-violet-500 text-sm">✦</span>
                  <p className="text-[13px] font-bold text-[#1e1b4b]">Become Pro</p>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">Unlock premium AI features, automation, and deeper insights</p>
                <button className="mt-3 w-full rounded-xl bg-white border border-violet-200 py-2 text-[11px] font-bold text-[#1e1b4b] hover:bg-violet-50 transition-colors shadow-sm">
                  View our plans →
                </button>
              </div>
            </div>
          )}
          <div className={`flex flex-col gap-1 w-full ${!collapsed ? "border-t border-neutral-100 pt-3" : ""}`}>
            {NAV_OTHERS.map((item) => (
              <button key={item.label} onClick={() => setActiveNav(item.label)} title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all text-left ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
              >
                {item.icon}{!collapsed && item.label}
              </button>
            ))}
            <button onClick={() => router.push("/")} title={collapsed ? "Log out" : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all text-left w-full ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
            >
              <SignOut size={16} weight="bold" />
              {!collapsed && "Log out"}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-5 py-3 sticky top-0 z-20">
          <button onClick={() => setCollapsed((o) => !o)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-bold text-[#1e1b4b]">Dashboard</h1>

          <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 max-w-sm mx-auto">
            <MagnifyingGlass size={14} className="text-neutral-400 shrink-0" />
            <input placeholder="Search anything…" className="bg-transparent text-[13px] text-neutral-600 placeholder:text-neutral-400 outline-none w-full" />
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-violet-200 hover:shadow-violet-300 hover:from-violet-700 hover:to-indigo-700 transition-all">
              <Plus size={13} weight="bold" /> New Campaign
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors shadow-sm">
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">2</span>
            </button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-violet-200 hover:shadow-violet-300 transition-all">
                ME
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-neutral-100 bg-white shadow-xl shadow-neutral-200/50 z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-neutral-50">
                    <p className="text-[12px] font-semibold text-neutral-800">Mostafa Elnagar</p>
                    <p className="text-[10px] text-neutral-400">Admin</p>
                  </div>
                  <button onClick={() => router.push("/")} className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Welcome banner */}
          <div className="rounded-2xl px-6 py-5 flex items-center justify-between shadow-sm border border-[#e9defa]/60" style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }}>
            <div>
              <h2 className="text-[18px] font-bold text-[#1e1b4b]">Welcome back, Mostafa 👋</h2>
              <p className="text-[13px] text-neutral-500 mt-0.5">Wednesday, 18 June 2026 · Here's what's happening today</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-white/60 border border-white/80 backdrop-blur-sm px-3 py-1.5 text-[12px] font-semibold text-[#1e1b4b]">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />2 live campaigns
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white border border-neutral-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-md`}>
                    {s.icon}
                  </div>
                  {s.change !== null && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${s.up ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                      {s.up ? <ArrowUp size={9} weight="bold" /> : <ArrowDown size={9} weight="bold" />}{s.change}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">{s.label}</p>
                <p className="mt-1 text-[22px] font-black text-[#1e1b4b] leading-tight">{s.value}</p>
                <div className="mt-2">
                  <Sparkline path={s.wave} color={s.up ? "#7c3aed" : "#f43f5e"} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-2xl bg-white border border-neutral-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-bold text-[#1e1b4b]">Performance Overview</h3>
                  <p className="text-[12px] text-neutral-400 mt-0.5">The performance of influencers and customers</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors">
                  This month <CaretDown size={10} />
                </button>
              </div>
              <PerfChart />
            </div>

            <div className="rounded-2xl bg-white border border-neutral-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-[15px] font-bold text-[#1e1b4b]">Customer Overview</h3>
              <CustomerOverview />
            </div>
          </div>

          {/* Campaigns */}
          <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden mb-4">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-50">
              <div>
                <h3 className="text-[15px] font-bold text-[#1e1b4b]">Campaigns</h3>
                <p className="text-[11px] text-neutral-400">{filtered.length} total campaigns</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 w-40">
                  <MagnifyingGlass size={12} className="text-neutral-400 shrink-0" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="bg-transparent text-[12px] text-neutral-600 placeholder:text-neutral-400 outline-none w-full" />
                </div>
                <button className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Sort: <span className="font-semibold ml-1">Newest</span> <CaretDown size={10} className="ml-1" />
                </button>
                <button className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                  <Funnel size={12} weight="bold" /> Filter
                </button>
              </div>
            </div>

            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-neutral-50/80">
                  {["Campaign Name", "Type", "Orders", "Start Date", "End Date", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((c) => {
                  const s = STATUS_STYLE[c.status];
                  return (
                    <tr key={c.name} className="hover:bg-violet-50/30 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-neutral-800">{c.name}</td>
                      <td className="px-6 py-4 text-neutral-500">{c.type}</td>
                      <td className="px-6 py-4 font-bold text-[#1e1b4b]">{c.orders}</td>
                      <td className="px-6 py-4 text-neutral-500">{c.start}</td>
                      <td className="px-6 py-4 text-neutral-500">{c.end}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${s.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{c.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100">
                          <DotsThreeVertical size={16} weight="bold" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </div>
  );
}
