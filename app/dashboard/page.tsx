"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MagnifyingGlass, List, Plus, SignOut } from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const STATS = [
  { label: "Total Revenue",      value: "$34,940", change: "+12%",  sub: "vs last period", hero: true },
  { label: "Total Orders",       value: "11,317",  change: "+8%",   sub: "vs last period" },
  { label: "Avg ROAS",           value: "5.8×",    change: "+0.4×", sub: "vs last period" },
  { label: "Goal Completion",    value: "97%",      change: "+3%",   sub: "vs last period" },
  { label: "Total Spend",        value: "$6,025",  change: null,    sub: "Across 4 campaigns" },
  { label: "Budget Utilization", value: "92%",      change: null,    sub: "$6,025 of $6,550 committed" },
  { label: "Active Influencers", value: "24",       change: null,    sub: "86 worked with lifetime" },
  { label: "Content Live",       value: "89",       change: null,    sub: "Across all running campaigns" },
];

const REV_TIME = [
  { month: "Jan", rev: 300,   orders: 75 },
  { month: "Feb", rev: 300,   orders: 75 },
  { month: "Mar", rev: 1500,  orders: 375 },
  { month: "Apr", rev: 3200,  orders: 800 },
  { month: "May", rev: 5800,  orders: 1450 },
  { month: "Jun", rev: 8200,  orders: 2050 },
  { month: "Jul", rev: 10700, orders: 2675 },
  { month: "Aug", rev: 14500, orders: 3625 },
  { month: "Sep", rev: 18500, orders: 4625 },
  { month: "Oct", rev: 200,   orders: 50 },
  { month: "Nov", rev: 200,   orders: 50 },
  { month: "Dec", rev: 200,   orders: 50 },
];

const REV_CAMPAIGNS = [
  { name: "Spring 2026",    rev: 17000, target: 20000 },
  { name: "Summer 2025",    rev: 11000, target: 12000 },
  { name: "Ramadan Flash",  rev: 5000,  target: 6000 },
  { name: "Eid Collection", rev: 0,     target: 10000 },
];

const RUNNING = [
  {
    name: "Spring 2026",
    phase: "Phase 1 · Warm-up",
    dates: "Apr 1 – May 30, 2026",
    rev: 840,  revTarget: 1000, revPct: 84,
    threshold: "✓ 80% threshold reached — Phase 2 unlocks soon",
    thresholdGreen: true,
    remaining: "$160",
    adsLive: 125, adsTotal: 200, adsPct: 62.5,
    influencers: 24, influencerNote: "All deployed",   influencerPct: 100,
    content: 89,  contentNote: "71% of live ads",      contentPct: 71,
  },
  {
    name: "Ramadan Flash",
    phase: "Phase 2 · Scale",
    dates: "Mar 10 – Apr 20, 2026",
    rev: 3840, revTarget: 5000, revPct: 77,
    threshold: "⏰ On pace — 80% unlock target 3 days away",
    thresholdGreen: false,
    remaining: "$1,160",
    adsLive: 96,  adsTotal: 150, adsPct: 64,
    influencers: 38, influencerNote: "2 pending setup", influencerPct: 95,
    content: 142, contentNote: "88% of live ads",       contentPct: 88,
  },
];

const PHASE_TRACKER = [
  { name: "Spring 2026",   p1: "Active", p2: "Pending", p3: "Pending", rev: "$840",    roas: "0.84×", status: "Live" },
  { name: "Ramadan Flash", p1: "Done",   p2: "Active",  p3: "Pending", rev: "$3,840",  roas: "1.9×",  status: "Live" },
  { name: "Summer Push",   p1: "Done",   p2: "Done",    p3: "Done",    rev: "$11,340", roas: "6.2×",  status: "Ended" },
  { name: "Brand Launch",  p1: "Done",   p2: "Done",    p3: "Pending", rev: "$5,400",  roas: "5.1×",  status: "Ready" },
];

/* ------------------------------------------------------------------ */
/* Revenue over time chart                                             */
/* ------------------------------------------------------------------ */
function RevenueOverTimeChart() {
  const W = 700, H = 210, PL = 58, PR = 52, PT = 12, PB = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxRev = 20000, maxOrd = 5000;
  const n = REV_TIME.length;
  const colW = cW / n;
  const barW = Math.min(colW * 0.52, 26);
  const r = barW / 2;

  const ordY  = (v: number) => PT + cH - (v / maxOrd) * cH;
  const cx    = (i: number) => PL + (i + 0.5) * colW;

  const dots  = REV_TIME.map((d, i) => ({ x: cx(i), y: ordY(d.orders) }));
  const line  = dots.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const yLeft  = ["$20k","$18k","$16k","$14k","$12k","$10k","$8k","$6k","$4k","$2k"];
  const yRight = ["5000","4500","4000","3500","3000","2500","2000","1500","1000","500"];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ height: 260 }}>
        {/* Grid + left labels */}
        {yLeft.map((l, i) => {
          const y = PT + (i / (yLeft.length - 1)) * cH;
          return (
            <g key={l}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#bbb">{l}</text>
            </g>
          );
        })}
        {/* Right labels */}
        {yRight.map((l, i) => {
          const y = PT + (i / (yRight.length - 1)) * cH;
          return <text key={l} x={W - PR + 6} y={y + 4} textAnchor="start" fontSize="10" fill="#bbb">{l}</text>;
        })}

        {/* Bars (pill-shaped: revenue) */}
        {REV_TIME.map((d, i) => {
          const bH = Math.max((d.rev / maxRev) * cH, r * 2);
          const y  = PT + cH - bH;
          return (
            <rect key={i} x={cx(i) - r} y={y} width={barW} height={bH}
              rx={r} ry={r} fill="#e8e4ff" stroke="#9b87f5" strokeWidth="1.5" />
          );
        })}

        {/* Dashed orders line */}
        <path d={line} fill="none" stroke="#7c5af5" strokeWidth="2" strokeDasharray="6 4" />

        {/* Dots */}
        {dots.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5.5" fill="white" stroke="#7c5af5" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="2.5" fill="#7c5af5" />
          </g>
        ))}

        {/* X-axis month labels */}
        {REV_TIME.map((d, i) => (
          <text key={d.month} x={cx(i)} y={H + 22} textAnchor="middle" fontSize="10" fill="#bbb">{d.month}</text>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-6 text-[11px] font-semibold text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-violet-200 border border-violet-400" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#7c5af5" strokeWidth="2" strokeDasharray="5 3" />
            <circle cx="10" cy="5" r="3" fill="white" stroke="#7c5af5" strokeWidth="1.5" />
          </svg>
          Orders
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue per campaign chart                                          */
/* ------------------------------------------------------------------ */
function RevenueByCampaignChart() {
  const W = 480, H = 180, PL = 54, PT = 10, PB = 8;
  const cW = W - PL, cH = H - PT - PB;
  const maxVal = 22000;
  const n = REV_CAMPAIGNS.length;
  const groupW = cW / n;
  const barW = Math.min(groupW * 0.32, 28);
  const gap = 5;
  const r = barW / 2;

  const bH  = (v: number) => Math.max((v / maxVal) * cH, v > 0 ? r * 2 : 0);
  const cx  = (i: number) => PL + (i + 0.5) * groupW;
  const yLabels = ["$20k","$16k","$12k","$8k","$4k","$0"];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 50}`} className="w-full" style={{ height: 240 }}>
        {yLabels.map((l, i) => {
          const y = PT + (i / (yLabels.length - 1)) * cH;
          return (
            <g key={l}>
              <line x1={PL} y1={y} x2={W} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#bbb">{l}</text>
            </g>
          );
        })}
        {REV_CAMPAIGNS.map((d, i) => {
          const revBH = bH(d.rev);
          const tarBH = bH(d.target);
          const x = cx(i);
          return (
            <g key={i}>
              {d.rev > 0 && (
                <rect x={x - barW - gap / 2} y={PT + cH - revBH}
                  width={barW} height={revBH} rx={r} ry={r} fill="#6854e8" />
              )}
              <rect x={x + gap / 2} y={PT + cH - tarBH}
                width={barW} height={tarBH} rx={r} ry={r}
                fill="#eceaff" stroke="#c4baf5" strokeWidth="1.5" />
            </g>
          );
        })}
        {REV_CAMPAIGNS.map((d, i) => (
          <text key={d.name} x={cx(i)} y={H + 30}
            textAnchor="middle" fontSize="10" fill="#aaa"
            transform={`rotate(-20,${cx(i)},${H + 30})`}>{d.name}</text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-5 text-[11px] font-semibold text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-violet-600" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-violet-100 border border-violet-300" />Target
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Key averages                                                        */
/* ------------------------------------------------------------------ */
function KeyAverages() {
  const items = [
    {
      label: "AVG ROAS",
      value: "5.8×",
      color: "text-violet-600",
      bar: "bg-violet-600",
      pct: 75,
      badge: "▲ +0.4× vs last",
      badgeCls: "bg-green-50 text-green-600 border-green-100",
      desc: "For every $1 spent, campaigns return $5.80 on average — above the 5× target.",
    },
    {
      label: "GOAL COMPLETION RATE",
      value: "97%",
      color: "text-green-500",
      bar: "bg-green-500",
      pct: 97,
      badge: "▲ +3% vs last",
      badgeCls: "bg-green-50 text-green-600 border-green-100",
      desc: "97% of committed phases hit their revenue target.",
    },
    {
      label: "AVG PHASE DURATION",
      value: "6.2 days",
      color: "text-[#1e1b4b]",
      bar: "bg-violet-600",
      pct: 52,
      badge: "▼ 1.1d faster",
      badgeCls: "bg-green-50 text-green-600 border-green-100",
      desc: "Phases completing 1.1 days faster — stronger creator performance.",
    },
  ];
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">{item.label}</p>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${item.badgeCls}`}>{item.badge}</span>
          </div>
          <p className={`mt-1 text-[26px] font-bold leading-none ${item.color}`}>{item.value}</p>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-100">
            <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How you compare                                                     */
/* ------------------------------------------------------------------ */
function HowYouCompare() {
  const items = [
    {
      label: "AVG ROAS",
      value: "5.8×", valueCls: "text-violet-600",
      vs: "vs 4.1× category avg",
      note: "▲ Top 18% of brands", noteCls: "text-green-600",
    },
    {
      label: "GOAL COMPLETION",
      value: "97%", valueCls: "text-violet-600",
      vs: "vs 84% category avg",
      note: "▲ Phases reliably hit target", noteCls: "text-green-600",
    },
    {
      label: "REPEAT-PURCHASE RATE",
      value: "11%", valueCls: "text-amber-500",
      vs: "vs 16% category avg",
      note: "▼ Opportunity — retention", noteCls: "text-amber-600",
    },
  ];
  return (
    <div className="rounded-2xl bg-violet-50 border border-violet-100 p-6 shadow-sm">
      <h3 className="text-[15px] font-semibold text-violet-800">How you compare — Fashion &amp; Apparel, GCC</h3>
      <p className="text-[12px] text-neutral-500 mt-0.5 mb-4">Benchmarked against anonymized MoonTech brands in your category &amp; region</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white border border-neutral-100 p-4 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">{item.label}</p>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <p className={`text-[24px] font-bold ${item.valueCls}`}>{item.value}</p>
              <p className="text-[12px] text-neutral-400">{item.vs}</p>
            </div>
            <p className={`mt-1 text-[12px] font-semibold ${item.noteCls}`}>{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Running campaign card                                               */
/* ------------------------------------------------------------------ */
function CampaignCard({ c }: { c: typeof RUNNING[0] }) {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  return (
    <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1e1b4b]">{c.name}</h3>
          <p className="text-[12px] text-neutral-400 mt-0.5">{c.phase} · {c.dates}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-live" />Live
          </span>
          <button className="rounded-xl px-4 py-2 text-[12px] font-semibold text-[#1e1b4b] hover:bg-[#1e1b4b]/5 transition-colors">
            View →
          </button>
        </div>
      </div>

      {/* Revenue progress */}
      <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-violet-700">Revenue Generated vs. Budget</p>
          <div className="shrink-0 text-right">
            <p className="text-[22px] font-bold text-violet-600 leading-none">{c.revPct}%</p>
            <p className="text-[10px] font-semibold text-violet-400">of target reached</p>
          </div>
        </div>
        <p className="mt-1.5 text-[20px] font-bold text-[#1e1b4b]">
          {fmt(c.rev)}{" "}
          <span className="text-[13px] font-normal text-neutral-400">of {fmt(c.revTarget)} budget</span>
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-violet-200">
          <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${c.revPct}%` }} />
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <p className={`text-[11px] font-semibold ${c.thresholdGreen ? "text-green-600" : "text-amber-600"}`}>{c.threshold}</p>
          <p className="shrink-0 text-[11px] text-neutral-400 text-right">{c.remaining}<br />remaining</p>
        </div>
      </div>

      {/* Metric rows */}
      {[
        { label: "ADS LIVE",           value: c.adsLive,     suffix: `/${c.adsTotal}`, note: `${c.adsPct}% of plan`,  pct: c.adsPct,        bar: "bg-violet-600" },
        { label: "ACTIVE INFLUENCERS", value: c.influencers, suffix: "",               note: c.influencerNote,         pct: c.influencerPct, bar: "bg-green-500" },
        { label: "CONTENT POSTED",     value: c.content,     suffix: "",               note: c.contentNote,            pct: c.contentPct,    bar: "bg-amber-400" },
      ].map((m) => (
        <div key={m.label} className="rounded-2xl bg-white border border-neutral-100 p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">{m.label}</p>
          <p className="mt-1 text-[22px] font-bold text-[#1e1b4b]">
            {m.value}<span className="text-[14px] font-normal text-neutral-400">{m.suffix}</span>
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
            <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-neutral-400">{m.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase completion tracker                                            */
/* ------------------------------------------------------------------ */
function PhaseTracker() {
  const phaseCls = (v: string) =>
    v === "Done"   ? "bg-violet-100 text-violet-600 border border-violet-200" :
    v === "Active" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                     "bg-neutral-50 text-neutral-400 border border-neutral-200";

  const statusCls = (v: string) =>
    v === "Live"   ? "bg-green-50 text-green-600 border border-green-200" :
    v === "Ready"  ? "bg-amber-50 text-amber-600 border border-amber-200" :
                     "bg-neutral-100 text-neutral-500 border border-neutral-200";

  return (
    <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-6 overflow-x-auto">
      <h3 className="text-[15px] font-semibold text-[#1e1b4b]">Phase completion tracker</h3>
      <p className="text-[12px] text-neutral-400 mt-0.5 mb-5">Status of each phase across all campaigns</p>
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="border-b border-neutral-100">
            {["Campaign","Phase 1","Phase 2","Phase 3","Revenue","ROAS","Status"].map((h) => (
              <th key={h} className="pb-3 text-left text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {PHASE_TRACKER.map((row) => (
            <tr key={row.name} className="hover:bg-violet-50/30 transition-colors">
              <td className="py-3.5 font-semibold text-[#1e1b4b] pr-4">{row.name}</td>
              {[row.p1, row.p2, row.p3].map((p, i) => (
                <td key={i} className="py-3.5 pr-3">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${phaseCls(p)}`}>{p}</span>
                </td>
              ))}
              <td className="py-3.5 font-semibold text-neutral-700 pr-3">{row.rev}</td>
              <td className="py-3.5 font-semibold text-violet-600 pr-3">{row.roas}</td>
              <td className="py-3.5">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusCls(row.status)}`}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav]       = useState("Dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      <Sidebar
        collapsed={collapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-4 py-3 sticky top-0 z-20">
          {/* Hamburger: toggles drawer on mobile, collapses sidebar on desktop */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold text-[#1e1b4b] shrink-0">Dashboard</h1>

          {/* Search — hidden on small screens */}
          <div className="hidden sm:flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 max-w-sm mx-auto">
            <MagnifyingGlass size={14} className="text-neutral-400 shrink-0" />
            <input placeholder="Search anything…" className="bg-transparent text-[13px] text-neutral-600 placeholder:text-neutral-400 outline-none w-full" />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={() => router.push("/campaigns/new")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 sm:px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-violet-200 hover:shadow-violet-300 hover:from-violet-700 hover:to-indigo-700 transition-all">
              <Plus size={13} weight="bold" />
              <span className="hidden sm:inline">New Campaign</span>
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors shadow-sm">
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">2</span>
            </button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium shadow-md shadow-violet-200">
                ME
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-neutral-100 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-neutral-50">
                    <p className="text-[12px] font-semibold text-neutral-800">Mostafa Elnagar</p>
                    <p className="text-[10px] text-neutral-400">Admin</p>
                  </div>
                  <button onClick={() => router.push("/")}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

          {/* Welcome banner */}
          <div className="rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-[#e9defa]/60"
            style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }}>
            <div>
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#1e1b4b]">Welcome back, Mostafa 👋</h2>
              <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-0.5">Wednesday, 18 June 2026 · Here&apos;s what&apos;s happening today</p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white/60 border border-white/80 backdrop-blur-sm px-3 py-1.5 text-[12px] font-semibold text-[#1e1b4b]">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />2 live campaigns
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map((s) => (
              <div key={s.label}
                className={`rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow ${
                  s.hero ? "bg-[#eef0fb] border border-[#dde0f5]" : "bg-white border border-neutral-100"
                }`}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-3">{s.label}</p>
                <p className={`text-[22px] sm:text-[26px] font-bold leading-none ${s.hero ? "text-[#1e1b4b]" : "text-neutral-800"}`}>{s.value}</p>
                <div className="mt-2.5">
                  {s.change ? (
                    <span className="flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold text-green-600">
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 shrink-0" fill="currentColor">
                        <polygon points="5,1 9,9 1,9" />
                      </svg>
                      {s.change} {s.sub}
                    </span>
                  ) : (
                    <span className="text-[11px] sm:text-[12px] text-neutral-400">{s.sub}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Running Campaigns header */}
          <div>
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#1e1b4b]">Running Campaigns</h2>
            <p className="text-[12px] text-neutral-400 mt-0.5">Live performance · updated in real time</p>
          </div>

          {/* Row 1: Campaign cards + Key averages */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {RUNNING.map((c) => <CampaignCard key={c.name} c={c} />)}
            <div className="rounded-2xl bg-white border border-neutral-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-[14px] font-semibold text-[#1e1b4b]">Key averages</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5 mb-4">Across all completed phases</p>
              <KeyAverages />
            </div>
          </div>

          {/* Performance Overview heading */}
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#1e1b4b]">Performance Overview</h2>

          {/* Row 2: Two charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white border border-neutral-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-[14px] font-semibold text-[#1e1b4b]">Revenue over time</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5 mb-4">Monthly revenue generated across all campaigns</p>
              <RevenueOverTimeChart />
            </div>
            <div className="rounded-2xl bg-white border border-neutral-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-[14px] font-semibold text-[#1e1b4b]">Revenue per campaign</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5 mb-4">How each campaign contributed to total revenue vs. target</p>
              <RevenueByCampaignChart />
            </div>
          </div>

          {/* Row 3: How you compare — full width */}
          <HowYouCompare />

          {/* Phase tracker */}
          <PhaseTracker />

        </main>
      </div>
    </div>
  );
}
