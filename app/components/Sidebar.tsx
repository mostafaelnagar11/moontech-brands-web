"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  House, Megaphone,
  Gear, Question, SignOut, X,
} from "@phosphor-icons/react";

const NAV_MENU = [
  { icon: <House size={16} weight="bold" />,     label: "Dashboard",  href: "/dashboard" },
  { icon: <Megaphone size={16} weight="bold" />, label: "Campaigns",  href: "/campaigns" },
];
const NAV_OTHERS = [
  { icon: <Gear size={16} weight="bold" />,     label: "Settings" },
  { icon: <Question size={16} weight="bold" />, label: "Help" },
];

const BRANDS = [
  { id: "voga",  name: "Vogacloset",  initials: "V", color: "#6d28d9" },
  { id: "luna",  name: "Luna Beauty", initials: "L", color: "#0891b2" },
  { id: "fresh", name: "FreshGrocer", initials: "F", color: "#059669" },
];

interface SidebarProps {
  collapsed: boolean;
  activeNav: string;
  onNavChange: (label: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  collapsed, activeNav, onNavChange, onMobileClose,
}: {
  collapsed: boolean;
  activeNav: string;
  onNavChange: (label: string) => void;
  onMobileClose?: () => void;
}) {
  const router = useRouter();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState(BRANDS[0]);

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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-medium text-white shadow-sm"
              style={{ backgroundColor: activeBrand.color }}>
              {activeBrand.initials}
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
                <button key={b.id} onClick={() => { setActiveBrand(b); setBrandMenuOpen(false); }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-neutral-50 ${activeBrand.id === b.id ? "bg-violet-50/60" : ""}`}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: b.color }}>{b.initials}</div>
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

      {/* Nav */}
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
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-1 w-full">
        <div className={`flex flex-col gap-1 w-full ${!collapsed ? "border-t border-neutral-100 pt-3" : ""}`}>
          {NAV_OTHERS.map((item) => (
            <button key={item.label} onClick={() => onNavChange(item.label)} title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all text-left ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
              {item.icon}{!collapsed && item.label}
            </button>
          ))}
          <button onClick={() => router.push("/")} title={collapsed ? "Log out" : undefined}
            className={`flex items-center rounded-xl py-2.5 text-[13px] font-medium text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all text-left w-full ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <SignOut size={16} weight="bold" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, activeNav, onNavChange, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex shrink-0 flex-col border-r border-neutral-100/80 transition-all duration-200 ${collapsed ? "w-[60px]" : "w-[210px]"}`}>
        <SidebarContent collapsed={collapsed} activeNav={activeNav} onNavChange={onNavChange} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-[240px] border-r border-neutral-100 shadow-xl">
            <SidebarContent collapsed={false} activeNav={activeNav} onNavChange={onNavChange} onMobileClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
