"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MagnifyingGlass, List, SignOut } from "@phosphor-icons/react";
import Sidebar from "../../components/Sidebar";
import EligibilityAgent from "../../components/EligibilityAgent";

export default function NewBrandDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [resolved, setResolved] = useState(false);

  // Eligible brands skip this screen entirely: a brand with no campaigns yet has
  // an empty app, so instead we drop them straight into the AI campaign assistant
  // and greet them with a welcome overlay there (flag read on /campaigns/new).
  // Only brands that aren't eligible yet stay on this page.
  useEffect(() => {
    let eligible = true;
    try {
      const stored = window.localStorage.getItem("moontech_last_eligibility");
      if (stored !== null) eligible = stored === "1";
    } catch {}
    if (eligible) {
      try { sessionStorage.setItem("moontech_welcome_campaign", "1"); } catch {}
      router.replace("/campaigns/new");
      return;
    }
    setResolved(true);
  }, [router]);

  // While deciding (and during the redirect for eligible brands) render a blank
  // canvas so the eligible hero never flashes before the redirect.
  if (!resolved) return <div className="min-h-screen bg-[#fafafa]" />;

  return (
    <div
      className="flex bg-[#fafafa] overflow-hidden"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", zoom: "110%", height: "calc(100vh / 1.1)" }}
    >
      {/* ── Sidebar (restricted — no campaign menu until eligible) ── */}
      <Sidebar collapsed={collapsed} activeNav={activeNav} onNavChange={setActiveNav} restricted />

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b border-neutral-100 px-5 py-3 sticky top-0 z-20">
          <button onClick={() => setCollapsed((o) => !o)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold text-[#1e1b4b]">Dashboard</h1>

          <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 max-w-sm mx-auto">
            <MagnifyingGlass size={14} className="text-neutral-400 shrink-0" />
            <input placeholder="Search anything…" className="bg-transparent text-[13px] text-neutral-600 placeholder:text-neutral-400 outline-none w-full" />
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors shadow-sm">
              <Bell size={16} />
            </button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium shadow-md shadow-violet-200">
                O
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-neutral-100 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-neutral-50">
                    <p className="text-[12px] font-semibold text-neutral-800">Ounass</p>
                  </div>
                  <button onClick={() => router.push("/")} className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    <SignOut size={13} weight="bold" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile completion banner */}
          <div className="flex items-center gap-4 bg-violet-600 px-6 py-3">
            <svg className="h-4 w-4 shrink-0 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            <p className="flex-1 text-xs font-medium text-white">
              Finish your business profile — add your VAT number, trade licence &amp; office location before you can fund a campaign
            </p>
            <span className="shrink-0 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              0 of 3 complete
            </span>
            <button
              onClick={() => router.push("/profile")}
              className="shrink-0 text-[11px] font-medium text-white hover:underline whitespace-nowrap"
            >
              Complete now →
            </button>
          </div>

          {/* Hero — not yet eligible */}
          <section
            className="relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #f5f5f4 0%, #fafaf9 50%, #f5f5f4 100%)" }}
          >
            <div className="px-8 py-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                {/* Left */}
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    Welcome to MoonTech 👋
                  </span>
                  <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-tight text-neutral-900">
                    Your brand isn&apos;t <span className="text-neutral-500">eligible yet</span><br />for a ROAS campaign
                  </h1>
                  <p className="mt-3 text-sm text-neutral-500">
                    Website verified · 3.2k monthly visitors · 5k minimum required to unlock guaranteed ROAS
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {[
                      { value: "3.2K", label: "Monthly visitors" },
                      { value: "5K", label: "Minimum required" },
                      { value: "1.8K", label: "Visitors short" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-xl font-semibold text-neutral-700">{s.value}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-neutral-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setAgentOpen(true)}
                      className="flex w-fit items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
                    >
                      <span aria-hidden="true" className="text-[#4D2FB0]">✦</span>
                      Think something&apos;s wrong? Talk to the MoonTech assistant
                    </button>
                    <p className="mt-2 text-xs text-neutral-400">
                      We&apos;ll re-check automatically once your traffic crosses 5,000 monthly visitors.
                    </p>
                  </div>
                </div>

                {/* Right — not-eligible badge */}
                <div className="flex flex-col items-center gap-3 -translate-x-40">
                  <div className="relative flex h-56 w-56 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-200" />
                    <div className="absolute inset-5 rounded-full border-2 border-dashed border-neutral-300" />
                    <div className="absolute inset-10 rounded-full border-2 border-dashed border-neutral-400" />
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
                      <svg className="h-11 w-11 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-neutral-400">
                    Not yet eligible
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Eligibility AI agent — full-screen chat overlay */}
      {agentOpen && <EligibilityAgent onClose={() => setAgentOpen(false)} />}
    </div>
  );
}
