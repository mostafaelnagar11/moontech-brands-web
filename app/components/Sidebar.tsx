"use client";

import Image from "next/image";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  House, Megaphone, UsersThree,
  Gear, Question, SignOut, X,
} from "@phosphor-icons/react";
import { BRANDS, type Brand } from "../data";
import { useActiveBrand, setActiveBrand } from "../lib/brand";

type NavItem = { icon: ReactNode; label: string; href: string; badge?: string };
const NAV_MENU: NavItem[] = [
  { icon: <House size={16} weight="bold" />,      label: "Dashboard", href: "/dashboard" },
  { icon: <Megaphone size={16} weight="bold" />,  label: "Campaigns", href: "/campaigns" },
  { icon: <UsersThree size={16} weight="bold" />, label: "Creators",  href: "/creators", badge: "8" },
];
const NAV_OTHERS: { icon: ReactNode; label: string; href?: string }[] = [
  { icon: <Gear size={16} weight="bold" />,     label: "Settings", href: "/settings" },
  { icon: <Question size={16} weight="bold" />, label: "Help" },
];

/* The workspace brands live in app/data.ts — the sign-in brand picker shows
   the same list, so it must not be duplicated here. */
type BrandItem = Brand;

interface SidebarProps {
  collapsed: boolean;
  activeNav: string;
  onNavChange: (label: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Hide the main nav (Dashboard/Campaigns/Creators) — e.g. for a brand
      that isn't eligible for campaigns yet. Defaults to showing the menu. */
  restricted?: boolean;
}

function SidebarContent({
  collapsed, activeNav, onNavChange, onMobileClose, restricted = false,
}: {
  collapsed: boolean;
  activeNav: string;
  onNavChange: (label: string) => void;
  onMobileClose?: () => void;
  restricted?: boolean;
}) {
  const router = useRouter();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  /* The switch lives in app/lib/brand.ts, not here: each brand owns its own
     ladder of phases, so picking a brand has to move the campaigns list, the
     detail route and the dashboard with it. Local state moved the sidebar and
     nothing else. Both sidebar copies — desktop and mobile drawer — read the
     same store, so they can never disagree. */
  const activeBrand = useActiveBrand();
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  useEffect(() => {
    try { const l = localStorage.getItem("moontech_logo"); if (l) setCustomLogo(l); } catch {}
  }, []);
  const markSrc = (b: BrandItem) => (b.id === "ounass" ? customLogo ?? b.logo ?? null : b.logo ?? null);

  return (
    <div className={`flex h-full flex-col bg-white py-5 overflow-y-auto ${collapsed ? "px-2 items-center" : "px-3"}`}>

      {/* Logo + mobile close */}
      <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
        {collapsed
          ? <div className="h-8 w-8 rounded-xl bg-[#4D2FB0] flex items-center justify-center text-white text-[10px] font-medium shadow-md">M</div>
          : <Image src="/logo.svg" alt="MoonTech" width={110} height={20} />
        }
        {!collapsed && onMobileClose && (
          <button onClick={onMobileClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 md:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Brand switcher */}
      {!collapsed && (
        <div className="relative mb-5 px-1">
          <button
            onClick={() => setBrandMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 transition hover:bg-neutral-100"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[11px] font-medium text-white shadow-sm"
              style={{ backgroundColor: markSrc(activeBrand) ? "#fff" : activeBrand.color }}>
              {markSrc(activeBrand)
                ? // eslint-disable-next-line @next/next/no-img-element
                  <img src={markSrc(activeBrand)!} alt={activeBrand.name} className="h-full w-full object-cover" />
                : activeBrand.initials}
            </div>
            <span className="flex-1 truncate text-left text-[13px] font-semibold text-neutral-700">{activeBrand.name}</span>
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${brandMenuOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {brandMenuOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-xl shadow-neutral-200/60">
              <p className="px-3 pb-1 pt-2.5 text-[9px] font-medium uppercase tracking-widest text-neutral-400">Switch brand</p>
              {BRANDS.map((b) => (
                <button key={b.id} onClick={() => { setActiveBrand(b.id); setBrandMenuOpen(false); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-neutral-50 ${activeBrand.id === b.id ? "bg-violet-50/60" : ""}`}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: markSrc(b) ? "#fff" : b.color }}>
                    {markSrc(b)
                      ? // eslint-disable-next-line @next/next/no-img-element
                        <img src={markSrc(b)!} alt={b.name} className="h-full w-full object-cover" />
                      : b.initials}
                  </div>
                  <span className="flex-1 text-[12px] font-medium text-neutral-700">{b.name}</span>
                  {activeBrand.id === b.id && (
                    <svg className="h-3.5 w-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="border-t border-neutral-100 px-3 py-2.5">
                <button className="flex w-full items-center gap-2 text-[12px] font-semibold text-violet-600 hover:text-violet-700 transition">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add brand
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav — hidden for brands that aren't eligible yet */}
      {!restricted && (
        <>
          {!collapsed && <p className="px-2 mb-2 text-[9px] font-medium uppercase tracking-widest text-neutral-300">Menu</p>}
          <nav className="flex flex-col gap-1 mb-6 w-full">
            {NAV_MENU.map((item) => (
              <button key={item.label} onClick={() => { onNavChange(item.label); router.push(item.href); onMobileClose?.(); }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all text-left ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                  activeNav === item.label
                    ? "bg-[#4D2FB0] text-white shadow-md shadow-violet-200"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                }`}>
                {item.icon}
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    activeNav === item.label ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}>{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-1 w-full">
        <div className={`flex flex-col gap-1 w-full ${!collapsed ? "border-t border-neutral-100 pt-3" : ""}`}>
          {NAV_OTHERS.map((item) => (
            <button key={item.label}
              onClick={() => { onNavChange(item.label); if (item.href) { router.push(item.href); onMobileClose?.(); } }}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium transition-all text-left ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                activeNav === item.label
                  ? "bg-[#4D2FB0] text-white shadow-md shadow-violet-200"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}>
              {item.icon}{!collapsed && item.label}
            </button>
          ))}
          <button onClick={() => router.push("/")} title={collapsed ? "Sign out" : undefined}
            className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium text-neutral-400 hover:bg-[#D70015]/[0.07] hover:text-[#D70015] transition-all text-left w-full ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <SignOut size={16} weight="bold" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, activeNav, onNavChange, mobileOpen, onMobileClose, restricted }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex shrink-0 flex-col border-r border-neutral-100/80 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[210px]"}`}>
        <SidebarContent collapsed={collapsed} activeNav={activeNav} onNavChange={onNavChange} restricted={restricted} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-[240px] border-r border-neutral-100 shadow-xl">
            <SidebarContent collapsed={false} activeNav={activeNav} onNavChange={onNavChange} onMobileClose={onMobileClose} restricted={restricted} />
          </aside>
        </div>
      )}
    </>
  );
}
