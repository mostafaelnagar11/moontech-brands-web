"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MagnifyingGlass, List, Plus, SignOut } from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
type CampaignStatus = "Live" | "Ready" | "Ended";

const CAMPAIGNS = [
  {
    id: "spring-2026",
    name: "Spring 2026",
    dates: "Apr 1 – May 30, 2026",
    status: "Ready" as CampaignStatus,
    revenue: null,
    orders: null,
    goalPct: null,
    phaseLabel: "Phase 1 · Ready to launch",
    phaseColor: "text-violet-600",
    progress: 0,
    progressBar: "bg-neutral-200",
  },
  {
    id: "summer-2025",
    name: "Summer 2025",
    dates: "Apr 12 – Apr 20, 2025",
    status: "Live" as CampaignStatus,
    revenue: "$2,340",
    orders: "287",
    goalPct: "82%",
    phaseLabel: "Phase 1 · In progress",
    phaseColor: "text-violet-600",
    progress: 82,
    progressBar: "bg-violet-600",
  },
  {
    id: "ramadan-flash",
    name: "Ramadan Flash",
    dates: "Mar 1 – Mar 30, 2025",
    status: "Ended" as CampaignStatus,
    revenue: "$18,400",
    orders: "6,210",
    goalPct: "100%",
    phaseLabel: "All phases complete",
    phaseColor: "text-green-600",
    progress: 100,
    progressBar: "bg-green-500",
  },
  {
    id: "eid-collection",
    name: "Eid Collection",
    dates: "Apr 5 – Apr 25, 2025",
    status: "Ended" as CampaignStatus,
    revenue: "$14,200",
    orders: "4,820",
    goalPct: "97%",
    phaseLabel: "All phases complete",
    phaseColor: "text-violet-600",
    progress: 97,
    progressBar: "bg-amber-400",
  },
];

const STATUS_FILTERS = ["All", "Live", "Ready", "Ended"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

/* ------------------------------------------------------------------ */
/* Status badge                                                        */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === "Live") return (
    <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />Live
    </span>
  );
  if (status === "Ready") return (
    <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
      <span className="text-[10px]">⏳</span>Ready
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Ended
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Campaign card                                                       */
/* ------------------------------------------------------------------ */
function CampaignCard({ c }: { c: typeof CAMPAIGNS[0] }) {
  const isLive = c.status === "Live";
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 ${
      isLive ? "border-2 border-green-400" : "border border-neutral-100"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1e1b4b]">{c.name}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{c.dates}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Revenue",  value: c.revenue  ?? "—" },
          { label: "Orders",   value: c.orders   ?? "—" },
          { label: "Of goal",  value: c.goalPct  ?? "—" },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[15px] font-bold text-[#1e1b4b] leading-none">{m.value}</p>
            <p className="text-[11px] text-neutral-400 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Progress to target</p>
          <p className={`text-[11px] font-semibold ${c.phaseColor}`}>{c.phaseLabel}</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-neutral-100">
          <div className={`h-full rounded-full transition-all ${c.progressBar}`} style={{ width: `${c.progress}%` }} />
        </div>
      </div>

      {/* Footer link */}
      <p className="text-[12px] font-medium text-neutral-400 text-right hover:text-violet-600 cursor-pointer transition-colors">
        Tap to view campaign details →
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function CampaignsPage() {
  const router = useRouter();
  const [activeNav, setActiveNav]       = useState("Campaigns");
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

  const filtered = activeFilter === "All"
    ? CAMPAIGNS
    : CAMPAIGNS.filter((c) => c.status === activeFilter);

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
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold text-[#1e1b4b] shrink-0">Campaigns</h1>

          <div className="hidden sm:flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 max-w-sm mx-auto">
            <MagnifyingGlass size={14} className="text-neutral-400 shrink-0" />
            <input placeholder="Search campaigns…" className="bg-transparent text-[13px] text-neutral-600 placeholder:text-neutral-400 outline-none w-full" />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={() => router.push("/campaigns/new")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 sm:px-4 py-2 text-[12px] font-semibold text-white shadow-sm shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 transition-all">
              <Plus size={13} weight="bold" />
              <span className="hidden sm:inline">New Campaign</span>
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors shadow-sm">
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">2</span>
            </button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium shadow-sm shadow-violet-200">
                ME
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-neutral-100 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-neutral-50">
                    <p className="text-xs font-semibold text-neutral-700">Mostafa Elnagar</p>
                    <p className="text-[10px] text-neutral-400">Admin</p>
                  </div>
                  <button onClick={() => router.push("/")}
                    className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">

          {/* Page heading */}
          <div className="mb-5">
            <h2 className="text-[22px] font-bold text-[#1e1b4b]">Campaigns</h2>
            <p className="text-xs text-neutral-500 mt-0.5">All your campaigns in one place</p>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            {STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeFilter === f
                    ? "border border-violet-500 bg-violet-50 text-violet-700"
                    : "border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                }`}>
                {f}
                {f !== "All" && (
                  <span className={`ml-1.5 text-[11px] ${activeFilter === f ? "text-violet-500" : "text-neutral-400"}`}>
                    {CAMPAIGNS.filter(c => c.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Campaign grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[40px] mb-3">📭</p>
              <p className="text-sm font-semibold text-neutral-700">No {activeFilter.toLowerCase()} campaigns</p>
              <p className="text-xs text-neutral-400 mt-1">Try a different filter or start a new campaign.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
