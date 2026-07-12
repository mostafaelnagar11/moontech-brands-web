"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  List, Bell, SignOut, EnvelopeSimple, Info, Question, CaretRight,
} from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";

const INK = "#191234";
const card = "rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)]";
const fieldCls = "w-full rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#4D2FB0]/50 focus:ring-2 focus:ring-[#4D2FB0]/10";
const labelCls = "mb-1.5 block text-[13px] font-medium text-neutral-500";

type Biz = { vat?: string; legalName?: string; city?: string; street?: string; country?: string; area?: string };

export default function SettingsPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Settings");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notif, setNotif] = useState(true);
  const [lang, setLang] = useState("English");
  const [biz, setBiz] = useState<Biz | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("moontech_profile");
      if (s) setBiz(JSON.parse(s));
    } catch {}
  }, []);

  const hasCity = !!biz?.city && biz.city !== "Select city...";
  const office = hasCity && biz?.street?.trim() ? `${biz.street}, ${biz.city}` : "— not added";
  const vat = biz?.vat?.trim() ? biz.vat : "— not added";
  const complete = biz?.vat?.trim() && hasCity && !!biz?.street?.trim();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F8]"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar
        collapsed={collapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-[67px] shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-sm">
          <button
            onClick={() => { if (window.innerWidth < 768) setMobileOpen((o) => !o); else setCollapsed((o) => !o); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold shrink-0" style={{ color: INK }}>Settings</h1>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-neutral-500 hover:bg-neutral-50 transition-colors">
              <Bell size={16} />
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white ring-2 ring-white">2</span>
            </button>
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
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="mb-5 text-[22px] font-bold tracking-tight" style={{ color: INK }}>Settings</h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-4">
              {/* Profile card */}
              <div className={`${card} p-8 text-center`}>
                <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#4D2FB0] text-[26px] font-bold text-white">O</div>
                <p className="mt-3.5 text-[18px] font-semibold" style={{ color: INK }}>Ounass</p>
                <p className="mt-0.5 text-[13px] text-neutral-400">ounass.com</p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Eligible brand
                </span>
              </div>

              {/* Quick links */}
              <div className={`${card} overflow-hidden`}>
                {[
                  { icon: <EnvelopeSimple size={16} />, label: "Contact Support", onClick: () => { window.location.href = "mailto:support@moontech.com"; } },
                  { icon: <Info size={16} />, label: "Terms & Conditions", onClick: () => {} },
                  { icon: <Question size={16} />, label: "FAQ", onClick: () => {} },
                ].map((row) => (
                  <button key={row.label} onClick={row.onClick}
                    className="flex w-full items-center gap-3 border-b border-black/[0.05] px-4 py-3.5 text-left transition last:border-0 hover:bg-neutral-50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4D2FB0]/[0.08] text-[#4D2FB0]">{row.icon}</span>
                    <span className="flex-1 text-[13px] font-medium text-neutral-700">{row.label}</span>
                    <CaretRight size={14} className="text-neutral-300" />
                  </button>
                ))}
              </div>

              {/* Log out */}
              <button onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 transition hover:bg-red-100/70 active:scale-[0.99]">
                <SignOut size={16} weight="bold" />Log out
              </button>
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-5">
              {/* Brand details */}
              <div className={`${card} p-6`}>
                <h3 className="mb-4 text-[15px] font-semibold" style={{ color: INK }}>Brand details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={labelCls}>Brand name</label><input className={fieldCls} defaultValue="Ounass" /></div>
                  <div><label className={labelCls}>Website</label><input className={fieldCls} defaultValue="ounass.com" /></div>
                  <div><label className={labelCls}>Industry</label><input className={fieldCls} defaultValue="Fashion & Apparel" /></div>
                  <div><label className={labelCls}>Country</label><input className={fieldCls} defaultValue="UAE" /></div>
                </div>
              </div>

              {/* Business & billing */}
              <div className={`${card} p-6`}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Business &amp; billing details</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    complete ? "border border-green-200 bg-green-50 text-green-700" : "border border-amber-200 bg-amber-50 text-amber-700"
                  }`}>{complete ? "Complete" : "Incomplete"}</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { k: "VAT / TRN number", v: vat },
                    { k: "Trade license", v: biz?.legalName?.trim() ? biz.legalName : "— not added" },
                    { k: "Office location", v: office },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-neutral-400">{r.k}</span>
                      <span className={`text-right text-[13px] font-medium ${r.v.startsWith("—") ? "text-neutral-400" : "text-neutral-700"}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/profile")}
                  className="mt-5 rounded-xl bg-[#4D2FB0] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#3F2596] active:scale-[0.98]">
                  Manage business details
                </button>
              </div>

              {/* Contact details */}
              <div className={`${card} p-6`}>
                <h3 className="mb-4 text-[15px] font-semibold" style={{ color: INK }}>Contact details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={labelCls}>Full name</label><input className={fieldCls} defaultValue="Sarah Al-Hamdan" /></div>
                  <div><label className={labelCls}>Email</label><input type="email" className={fieldCls} defaultValue="sarah@ounass.com" /></div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Phone <span className="font-normal text-neutral-400">· optional</span></label>
                    <input type="tel" className={fieldCls} defaultValue="+971 50 123 4567" />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className={`${card} p-6`}>
                <h3 className="mb-4 text-[15px] font-semibold" style={{ color: INK }}>Preferences</h3>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Email notifications</p>
                    <p className="mt-0.5 text-[13px] text-neutral-400">Campaign updates, phase completions, performance reports</p>
                  </div>
                  <button onClick={() => setNotif((o) => !o)} aria-label="Toggle email notifications"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notif ? "bg-[#4D2FB0]" : "bg-neutral-300"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notif ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="my-4 h-px bg-black/[0.06]" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-700">Language</p>
                  <button onClick={() => setLang((l) => (l === "English" ? "العربية" : "English"))}
                    className="text-[13px] font-semibold text-[#4D2FB0]">{lang} ▾</button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-[0_1px_2px_rgba(16,12,40,0.04)]">
                <h3 className="mb-4 text-[15px] font-semibold text-red-500">Danger zone</h3>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Delete account</p>
                    <p className="mt-0.5 text-[13px] text-neutral-400">This will permanently delete your account and all campaign data.</p>
                  </div>
                  <button
                    onClick={() => { if (confirm("Delete your MoonTech account permanently?\n\nAll campaign data will be lost. This cannot be undone.")) alert("Account deletion requested. Our team will email you to confirm."); }}
                    className="shrink-0 whitespace-nowrap rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-500 transition hover:bg-red-100/70 active:scale-[0.98]">
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
