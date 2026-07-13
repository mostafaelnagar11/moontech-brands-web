"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, Plus, SignOut } from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import NotificationCenter from "../components/NotificationCenter";
import CommandPalette from "../components/CommandPalette";
import { useEligibility } from "../components/useEligibility";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";
const card = "rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)]";

/* ------------------------------------------------------------------ */
/* Data                                                                 */
/* ------------------------------------------------------------------ */

const STATS = [
  { label: "Total revenue",      value: "$34,940", change: "+12%",  sub: "vs last period", hero: true },
  { label: "Total orders",       value: "11,317",  change: "+8%",   sub: "vs last period" },
  { label: "Avg ROAS",           value: "5.8×",    change: "+0.4×", sub: "vs last period" },
  { label: "Goal completion",    value: "97%",      change: "+3%",   sub: "vs last period" },
  { label: "Total spend",        value: "$6,025",  change: null,    sub: "Across 4 campaigns" },
  { label: "Budget utilization", value: "92%",      change: null,    sub: "$6,025 of $6,550 committed" },
  { label: "Active influencers", value: "24",       change: null,    sub: "86 worked with lifetime" },
  { label: "Content live",       value: "89",       change: null,    sub: "Across all running campaigns" },
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
    threshold: "80% threshold reached — Phase 2 unlocks soon",
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
    threshold: "On pace — 80% unlock target 3 days away",
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
  const W = 700, H = 210, PL = 46, PR = 46, PT = 14, PB = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxRev = 20000, maxOrd = 7500;
  const n = REV_TIME.length;
  const colW = cW / n;
  const barW = Math.min(colW * 0.52, 26);
  const r = barW / 2;
  const peak = REV_TIME.reduce((best, d, i) => (d.rev > REV_TIME[best].rev ? i : best), 0);

  const ordY  = (v: number) => PT + cH - (v / maxOrd) * cH;
  const cx    = (i: number) => PL + (i + 0.5) * colW;

  const dots = REV_TIME.map((d, i) => ({ x: cx(i), y: ordY(d.orders) }));
  const line = dots
    .map((p, i, a) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const q = a[i - 1];
      const mx = (q.x + p.x) / 2;
      return `C${mx},${q.y} ${mx},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");

  const yLeft  = ["$20k","$16k","$12k","$8k","$4k","$0"];
  const yRight = ["7,500","6,000","4,500","3,000","1,500","0"];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full" style={{ height: 260 }}>
        {/* Grid + left labels */}
        {yLeft.map((l, i) => {
          const y = PT + (i / (yLeft.length - 1)) * cH;
          return (
            <g key={l}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f4f4f6" strokeWidth="1" />
              <text x={PL - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#b3b3bb">{l}</text>
            </g>
          );
        })}
        {/* Right labels */}
        {yRight.map((l, i) => {
          const y = PT + (i / (yRight.length - 1)) * cH;
          return <text key={l} x={W - PR + 8} y={y + 3.5} textAnchor="start" fontSize="9.5" fill="#b3b3bb">{l}</text>;
        })}

        {/* Revenue bars */}
        {REV_TIME.map((d, i) => {
          const bH = Math.max((d.rev / maxRev) * cH, 4);
          const y  = PT + cH - bH;
          const rx = Math.min(r, bH / 2);
          return (
            <g key={i}>
              <title>{`${d.month} — $${d.rev.toLocaleString()} revenue · ${d.orders.toLocaleString()} orders`}</title>
              <rect x={cx(i) - r} y={y} width={barW} height={bH} rx={rx} ry={rx}
                fill={i === peak ? BRAND : "#EDE9FB"} />
            </g>
          );
        })}

        {/* Peak value callout */}
        <text x={cx(peak)} y={PT + cH - (REV_TIME[peak].rev / maxRev) * cH - 8}
          textAnchor="middle" fontSize="10" fontWeight="600" fill={BRAND}>
          {`$${(REV_TIME[peak].rev / 1000).toFixed(1)}k`}
        </text>

        {/* Orders curve */}
        <path d={line} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
        {dots.map((p, i) => (
          <g key={i}>
            <title>{`${REV_TIME[i].month} — ${REV_TIME[i].orders.toLocaleString()} orders`}</title>
            <circle cx={p.x} cy={p.y} r="2.5" fill="#A78BFA" />
          </g>
        ))}

        {/* X-axis month labels */}
        {REV_TIME.map((d, i) => (
          <text key={d.month} x={cx(i)} y={H + 22} textAnchor="middle" fontSize="10"
            fontWeight={i === peak ? 600 : 400} fill={i === peak ? BRAND : "#b3b3bb"}>{d.month}</text>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-5 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#EDE9FB] border border-[#ddd4f5]" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="5" r="2.5" fill="#A78BFA" />
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
  const W = 700, H = 180, PL = 46, PR = 10, PT = 10, PB = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxVal = 22000;
  const n = REV_CAMPAIGNS.length;
  const groupW = cW / n;
  const barW = Math.min(groupW * 0.22, 32);
  const gap = 6;
  const r = barW / 2;

  const bH  = (v: number) => Math.max((v / maxVal) * cH, v > 0 ? 4 : 0);
  const cx  = (i: number) => PL + (i + 0.5) * groupW;
  const yLabels = ["$20k","$16k","$12k","$8k","$4k","$0"];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 50}`} className="w-full" style={{ height: 240 }}>
        {yLabels.map((l, i) => {
          const y = PT + (i / (yLabels.length - 1)) * cH;
          return (
            <g key={l}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f4f4f6" strokeWidth="1" />
              <text x={PL - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#b3b3bb">{l}</text>
            </g>
          );
        })}
        {REV_CAMPAIGNS.map((d, i) => {
          const revBH = bH(d.rev);
          const tarBH = bH(d.target);
          const x = cx(i);
          const pct = Math.round((d.rev / d.target) * 100);
          return (
            <g key={i}>
              <title>{`${d.name} — $${d.rev.toLocaleString()} of $${d.target.toLocaleString()} target (${pct}%)`}</title>
              {d.rev > 0 ? (
                <>
                  <rect x={x - barW - gap / 2} y={PT + cH - revBH}
                    width={barW} height={revBH} rx={Math.min(r, revBH / 2)} ry={Math.min(r, revBH / 2)} fill={BRAND} />
                  <text x={x - gap / 2 - barW / 2} y={PT + cH - revBH - 7}
                    textAnchor="middle" fontSize="9.5" fontWeight="600" fill={BRAND}>
                    {`${pct}%`}
                  </text>
                </>
              ) : (
                <text x={x - gap / 2 - barW / 2} y={PT + cH - 7}
                  textAnchor="middle" fontSize="9.5" fontWeight="500" fill="#b3b3bb">
                  0%
                </text>
              )}
              <rect x={x + gap / 2} y={PT + cH - tarBH}
                width={barW} height={tarBH} rx={Math.min(r, tarBH / 2)} ry={Math.min(r, tarBH / 2)}
                fill="#EDE9FB" />
            </g>
          );
        })}
        {REV_CAMPAIGNS.map((d, i) => (
          <text key={d.name} x={cx(i)} y={H + 26}
            textAnchor="middle" fontSize="10.5" fontWeight="500" fill="#71717a">{d.name}</text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-5 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#4D2FB0]" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#EDE9FB] border border-[#ddd4f5]" />Target
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
      label: "Avg ROAS",
      value: "5.8×",
      color: "text-[#4D2FB0]",
      badge: "+0.4× vs last",
      desc: "Campaigns return $5.80 per $1 spent — above the 5× target.",
    },
    {
      label: "Goal completion rate",
      value: "97%",
      color: "text-green-600",
      badge: "+3% vs last",
      desc: "97% of committed phases hit their revenue target.",
    },
    {
      label: "Avg phase duration",
      value: "6.2 days",
      color: "",
      badge: "1.1d faster",
      desc: "Phases completing faster — stronger creator performance.",
    },
  ];
  return (
    <div className="flex flex-col flex-1 divide-y divide-black/[0.05]">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-neutral-600">{item.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{item.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-xl font-semibold tracking-tight tabular-nums ${item.color}`} style={item.color ? undefined : { color: INK }}>{item.value}</p>
            <p className="mt-0.5 text-xs font-medium text-green-600">↑ {item.badge}</p>
          </div>
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
      label: "Avg ROAS",
      value: "5.8×", valueCls: "text-[#4D2FB0]",
      vs: "vs 4.1× category avg",
      note: "Top 18% of brands", noteCls: "text-green-600", up: true,
    },
    {
      label: "Goal completion",
      value: "97%", valueCls: "text-[#4D2FB0]",
      vs: "vs 84% category avg",
      note: "Phases reliably hit target", noteCls: "text-green-600", up: true,
    },
    {
      label: "Repeat-purchase rate",
      value: "11%", valueCls: "text-amber-500",
      vs: "vs 16% category avg",
      note: "Opportunity — retention", noteCls: "text-amber-600", up: false,
    },
  ];
  return (
    <div className={`${card} p-6`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-[15px] font-semibold" style={{ color: INK }}>How you compare</h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
          Fashion &amp; Apparel · GCC
        </span>
      </div>
      <p className="text-xs text-neutral-400 mt-1">Benchmarked against anonymized MoonTech brands in your category &amp; region</p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
        {items.map((item) => (
          <div key={item.label} className="py-4 sm:py-1 sm:px-6 first:sm:pl-0 last:sm:pr-0">
            <p className="text-[13px] font-medium text-neutral-500">{item.label}</p>
            <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
              <p className={`text-[26px] font-semibold tracking-tight tabular-nums ${item.valueCls}`}>{item.value}</p>
              <p className="text-xs text-neutral-400">{item.vs}</p>
            </div>
            <p className={`mt-1 text-xs font-medium ${item.noteCls}`}>{item.up ? "↑" : "↓"} {item.note}</p>
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
    <div className={`${card} p-5 flex flex-col transition-colors hover:border-black/[0.12]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold" style={{ color: INK }}>{c.name}</h3>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-live" />Live
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">{c.phase} · {c.dates}</p>
        </div>
        <button className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-[#4D2FB0] hover:bg-[#4D2FB0]/[0.06] transition-colors">
          View →
        </button>
      </div>

      {/* Revenue progress */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[26px] font-semibold tracking-tight tabular-nums leading-none" style={{ color: INK }}>
            {fmt(c.rev)}{" "}
            <span className="text-sm font-normal tracking-normal text-neutral-400">of {fmt(c.revTarget)} target</span>
          </p>
          <p className="text-sm font-semibold tabular-nums text-[#4D2FB0]">{c.revPct}%</p>
        </div>
        <div className="mt-3.5 h-2 w-full rounded-full bg-[#EFEBFA]">
          <div className="h-full rounded-full bg-[#4D2FB0] transition-all" style={{ width: `${c.revPct}%` }} />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className={`text-xs font-medium ${c.thresholdGreen ? "text-green-600" : "text-amber-600"}`}>
            {c.thresholdGreen ? "✓" : "◷"} {c.threshold}
          </p>
          <p className="shrink-0 text-xs text-neutral-400">{c.remaining} remaining</p>
        </div>
      </div>

      {/* Metric row */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-black/[0.05] pt-4">
        {[
          { label: "Ads live",    value: `${c.adsLive}`, suffix: `/${c.adsTotal}`, note: `${c.adsPct}% of plan` },
          { label: "Influencers", value: `${c.influencers}`, suffix: "",           note: c.influencerNote },
          { label: "Content",     value: `${c.content}`,     suffix: "",           note: c.contentNote },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-medium text-neutral-400">{m.label}</p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight tabular-nums" style={{ color: INK }}>
              {m.value}<span className="text-[13px] font-normal text-neutral-400">{m.suffix}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400 truncate">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase completion tracker                                            */
/* ------------------------------------------------------------------ */
function PhaseTracker() {
  const phaseDot = (v: string) =>
    v === "Done"   ? "bg-[#4D2FB0]" :
    v === "Active" ? "bg-amber-400" :
                     "bg-neutral-300";
  const phaseText = (v: string) =>
    v === "Done"   ? "text-neutral-700" :
    v === "Active" ? "text-amber-600" :
                     "text-neutral-400";

  const statusCls = (v: string) =>
    v === "Live"   ? "bg-green-50 text-green-600" :
    v === "Ready"  ? "bg-amber-50 text-amber-600" :
                     "bg-neutral-100 text-neutral-500";

  return (
    <div className={`${card} p-6 overflow-x-auto`}>
      <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Phase completion tracker</h3>
      <p className="text-xs text-neutral-400 mt-1 mb-4">Status of each phase across all campaigns</p>
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.05]">
            {["Campaign","Phase 1","Phase 2","Phase 3","Revenue","ROAS","Status"].map((h) => (
              <th key={h} className="pb-3 text-left text-xs font-medium text-neutral-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04]">
          {PHASE_TRACKER.map((row) => (
            <tr key={row.name} className="hover:bg-neutral-50/60 transition-colors">
              <td className="py-4 font-medium pr-4" style={{ color: INK }}>{row.name}</td>
              {[row.p1, row.p2, row.p3].map((p, i) => (
                <td key={i} className="py-4 pr-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${phaseText(p)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${phaseDot(p)}`} />
                    {p}
                  </span>
                </td>
              ))}
              <td className="py-4 font-medium tabular-nums text-neutral-700 pr-3">{row.rev}</td>
              <td className="py-4 font-semibold tabular-nums text-[#4D2FB0] pr-3">{row.roas}</td>
              <td className="py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusCls(row.status)}`}>
                  {row.status === "Live" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-live" />}
                  {row.status}
                </span>
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
const DATE_FILTERS = ["Today", "Yesterday", "This week", "Last week", "Last 30 days", "All time"] as const;
type DateFilter = typeof DATE_FILTERS[number];

export default function Dashboard() {
  const router = useRouter();
  const eligible = useEligibility();
  const [activeNav, setActiveNav]       = useState("Dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dateFilter, setDateFilter]     = useState<DateFilter>("Last 30 days");
  const [filterOpen, setFilterOpen]     = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F7F8] overflow-hidden"
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
        <header className="flex h-[67px] shrink-0 items-center gap-3 bg-white/80 backdrop-blur-sm border-b border-black/[0.06] px-4 sticky top-0 z-20">
          {/* Hamburger: toggles drawer on mobile, collapses sidebar on desktop */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold shrink-0" style={{ color: INK }}>Dashboard</h1>

          {/* Central search / command palette */}
          <CommandPalette />

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {eligible && (
              <button onClick={() => router.push("/campaigns/new")}
                className="flex items-center gap-2 rounded-xl bg-[#4D2FB0] px-3 sm:px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#3F2596] transition-colors">
                <Plus size={13} weight="bold" />
                <span className="hidden sm:inline">New Campaign</span>
              </button>
            )}
            <NotificationCenter />
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4D2FB0] text-white text-xs font-medium">
                ME
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.06] z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-black/[0.05]">
                    <p className="text-xs font-semibold text-neutral-700">Mostafa Elnagar</p>
                    <p className="text-[11px] text-neutral-400">Admin</p>
                  </div>
                  <button onClick={() => router.push("/")}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">

          {/* Welcome banner */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-tight" style={{ color: INK }}>Welcome back, Mostafa</h2>
              <p className="text-[13px] text-neutral-400 mt-1" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Live badge */}
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[12px] font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />2 live campaigns
              </span>
              {/* Date filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:border-[#4D2FB0]/30 hover:text-[#4D2FB0] transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
                    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {dateFilter}
                  <svg className={`h-3 w-3 text-neutral-400 transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.06]">
                    {DATE_FILTERS.map((f) => (
                      <button key={f} onClick={() => { setDateFilter(f); setFilterOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition hover:bg-neutral-50 ${
                          dateFilter === f ? "font-medium text-[#4D2FB0]" : "text-neutral-600"
                        }`}>
                        {f}
                        {dateFilter === f && (
                          <svg className="h-3.5 w-3.5 text-[#4D2FB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.label}
                className={`rounded-2xl p-4 sm:p-5 transition-colors ${
                  s.hero
                    ? "bg-[#4D2FB0]"
                    : "bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)] hover:border-black/[0.12]"
                }`}>
                <p className={`text-[13px] font-medium ${s.hero ? "text-white/60" : "text-neutral-500"}`}>{s.label}</p>
                <p className={`mt-2 text-[24px] sm:text-[28px] font-semibold tracking-tight tabular-nums leading-none ${s.hero ? "text-white" : ""}`}
                  style={s.hero ? undefined : { color: INK }}>
                  {s.value}
                </p>
                <p className="mt-2.5 text-xs">
                  {s.change ? (
                    <>
                      <span className={`font-medium ${s.hero ? "text-white" : "text-green-600"}`}>↑ {s.change.replace("+", "")}</span>{" "}
                      <span className={s.hero ? "text-white/50" : "text-neutral-400"}>{s.sub}</span>
                    </>
                  ) : (
                    <span className="text-neutral-400">{s.sub}</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Running Campaigns */}
          <div className="pt-2">
            <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: INK }}>Running campaigns</h2>
            <p className="text-[13px] text-neutral-400 mt-0.5">Live performance · updated in real time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {RUNNING.map((c) => <CampaignCard key={c.name} c={c} />)}
            <div className={`${card} p-5 flex flex-col`}>
              <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Key averages</h3>
              <p className="text-xs text-neutral-400 mt-1 mb-3">Across all completed phases</p>
              <KeyAverages />
            </div>
          </div>

          {/* Performance Overview */}
          <div className="pt-2">
            <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: INK }}>Performance overview</h2>
            <p className="text-[13px] text-neutral-400 mt-0.5">Revenue trends across months and campaigns</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${card} p-5`}>
              <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Revenue over time</h3>
              <p className="text-xs text-neutral-400 mt-1 mb-4">Monthly revenue generated across all campaigns</p>
              <RevenueOverTimeChart />
            </div>
            <div className={`${card} p-5`}>
              <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Revenue per campaign</h3>
              <p className="text-xs text-neutral-400 mt-1 mb-4">How each campaign contributed to total revenue vs. target</p>
              <RevenueByCampaignChart />
            </div>
          </div>

          {/* Phase tracker */}
          <PhaseTracker />

          {/* How you compare — bottom */}
          <HowYouCompare />

        </main>
      </div>
    </div>
  );
}
