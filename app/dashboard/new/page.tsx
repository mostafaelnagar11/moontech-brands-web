"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, MagnifyingGlass, List, Plus, SignOut,
} from "@phosphor-icons/react";
import Sidebar from "../../components/Sidebar";

export default function NewBrandDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [eligible, setEligible] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("moontech_last_eligibility");
      if (stored !== null) setEligible(stored === "1");
    } catch {}
  }, []);

  return (
    <div
      className="flex bg-[#fafafa] overflow-hidden"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", zoom: "110%", height: "calc(100vh / 1.1)" }}
    >
      {/* ── Sidebar ── */}
      <Sidebar collapsed={collapsed} activeNav={activeNav} onNavChange={setActiveNav} restricted={!eligible} />

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
            {eligible && (
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow-md shadow-violet-200 hover:shadow-violet-300 hover:from-violet-700 hover:to-indigo-700 transition-all"
                onClick={() => router.push("/campaigns/new")}>
                <Plus size={13} weight="bold" /> New Campaign
              </button>
            )}
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
              Finish your business profile — add your VAT number, trade license &amp; office location before launching a campaign
            </p>
            <span className="shrink-0 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              0 of 3 done
            </span>
            <button
              onClick={() => router.push("/profile")}
              className="shrink-0 text-[11px] font-medium text-white hover:underline whitespace-nowrap"
            >
              Complete now →
            </button>
          </div>

          {/* Hero — eligibility */}
          <section
            className="relative overflow-hidden"
            style={{
              background: eligible
                ? "linear-gradient(135deg, #ede9fe 0%, #f0f0ff 50%, #e8e4ff 100%)"
                : "linear-gradient(135deg, #f5f5f4 0%, #fafaf9 50%, #f5f5f4 100%)",
            }}
          >
            <div className="px-8 py-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                {/* Left */}
                <div className="flex-1">
                  {eligible ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      Welcome to MoonTech 🎉
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      Welcome to MoonTech 👋
                    </span>
                  )}
                  <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-tight text-neutral-900">
                    {eligible ? (
                      <>Your brand is <span className="text-violet-600">eligible</span><br />for a ROAS campaign</>
                    ) : (
                      <>Your brand isn&apos;t <span className="text-neutral-500">eligible yet</span><br />for a ROAS campaign</>
                    )}
                  </h1>
                  <p className="mt-3 text-sm text-neutral-500">
                    {eligible
                      ? "Website verified · 280k monthly visitors confirmed · Guaranteed ROAS ready to activate"
                      : "Website verified · 3.2k monthly visitors · 5k minimum required to unlock guaranteed ROAS"}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {(eligible
                      ? [
                          { value: "280K", label: "Monthly visitors" },
                          { value: "5×", label: "Guaranteed ROAS" },
                          { value: "100%", label: "Performance-based" },
                        ]
                      : [
                          { value: "3.2K", label: "Monthly visitors" },
                          { value: "5K", label: "Minimum required" },
                          { value: "1.8K", label: "Visitors short" },
                        ]
                    ).map((s) => (
                      <div key={s.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                        <p className={`text-xl font-semibold ${eligible ? "text-violet-600" : "text-neutral-700"}`}>{s.value}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-neutral-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {eligible ? (
                    <button
                      onClick={() => router.push("/campaigns/new")}
                      className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98]"
                    >
                      Create your first campaign →
                    </button>
                  ) : (
                    <div className="mt-6">
                      <a
                        href="mailto:support@moontech.com"
                        className="flex w-fit items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
                      >
                        Think something&apos;s wrong? Contact us
                      </a>
                      <p className="mt-2 text-xs text-neutral-400">
                        We&apos;ll re-check automatically once your traffic crosses 5,000 monthly visitors.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right — eligibility badge */}
                <div className="flex flex-col items-center gap-3 -translate-x-40">
                  <div className="relative flex h-56 w-56 items-center justify-center">
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed ${eligible ? "border-violet-200" : "border-neutral-200"}`} />
                    <div className={`absolute inset-5 rounded-full border-2 border-dashed ${eligible ? "border-violet-300" : "border-neutral-300"}`} />
                    <div className={`absolute inset-10 rounded-full border-2 border-dashed ${eligible ? "border-violet-400" : "border-neutral-400"}`} />
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl">
                      {eligible ? (
                        <svg className="h-11 w-11 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-11 w-11 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium tracking-[0.25em] uppercase ${eligible ? "text-violet-500" : "text-neutral-400"}`}>
                    {eligible ? "Eligible" : "Not yet eligible"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          {eligible && (
            <section className="px-8 py-10">
              <h2 className="mb-6 text-lg font-bold text-neutral-800">How MoonTech works</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { num: "01", title: "Set your budget & ROAS goal", desc: "Use our calculator to lock in a guaranteed return on ad spend across phased campaigns." },
                  { num: "02", title: "We match you with creators", desc: "Vetted micro-influencers and community leaders, selected for your exact audience and product category." },
                  { num: "03", title: "Track every sale in real time", desc: "Unique tracking links per creator. Revenue, orders, and ROAS live in your dashboard from day one." },
                  { num: "04", title: "Guaranteed or we make it right", desc: "If a committed phase misses its target, MoonTech covers the difference. No fine print." },
                ].map((step) => (
                  <div key={step.num} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-3xl font-bold text-indigo-100">{step.num}</p>
                    <p className="mb-1.5 text-sm font-semibold text-neutral-800">{step.title}</p>
                    <p className="text-xs leading-relaxed text-neutral-500">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
