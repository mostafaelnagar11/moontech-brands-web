"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass, ClockCounterClockwise, House, Megaphone, UsersThree,
  Plus, Gear, CreditCard, Question, ArrowElbowDownLeft, type Icon,
} from "@phosphor-icons/react";

const INK = "#191234";

type Item = { id: string; label: string; icon: Icon; href: string };
type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Recent campaigns",
    items: [
      { id: "r-spring", label: "Spring 2026", icon: ClockCounterClockwise, href: "/campaigns/spring-2026" },
      { id: "r-ramadan", label: "Ramadan Flash", icon: ClockCounterClockwise, href: "/campaigns/ramadan-flash" },
      { id: "r-launch", label: "Brand Launch", icon: ClockCounterClockwise, href: "/campaigns/brand-launch" },
      { id: "r-summer", label: "Summer Push", icon: ClockCounterClockwise, href: "/campaigns/summer-push" },
    ],
  },
  {
    title: "Navigate to",
    items: [
      { id: "n-dash", label: "Dashboard", icon: House, href: "/dashboard" },
      { id: "n-camp", label: "Campaigns", icon: Megaphone, href: "/campaigns" },
      { id: "n-creators", label: "Creators", icon: UsersThree, href: "/creators" },
      { id: "n-new", label: "Create new campaign", icon: Plus, href: "/campaigns/new" },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "s-settings", label: "Settings", icon: Gear, href: "/settings" },
      { id: "s-billing", label: "Billing", icon: CreditCard, href: "/settings" },
      { id: "s-help", label: "Help", icon: Question, href: "/settings" },
    ],
  },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset + focus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeId = flat[active]?.id;

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const select = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (flat.length ? (a + 1) % flat.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0)); }
    else if (e.key === "Enter") { e.preventDefault(); select(flat[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  let running = -1;

  return (
    <>
      {/* Trigger — replaces the header search field */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex flex-1 items-center gap-2 rounded-xl border border-black/[0.07] bg-neutral-50 px-4 py-2.5 max-w-sm mx-auto text-left transition hover:border-[#4D2FB0]/30 hover:bg-white"
      >
        <MagnifyingGlass size={14} className="shrink-0 text-neutral-400" />
        <span className="flex-1 text-[13px] text-neutral-400">Search anything…</span>
        <kbd className="shrink-0 rounded-md border border-black/[0.08] bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">⌘K</kbd>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true" aria-label="Search">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-2xl shadow-black/20 animate-fade-in">
            {/* Search row */}
            <div className="flex items-center gap-3 border-b border-black/[0.06] px-4">
              <MagnifyingGlass size={18} className="shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search…"
                className="flex-1 bg-transparent py-4 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-400"
              />
              <kbd className="shrink-0 rounded-md border border-black/[0.08] bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">Esc</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
              {flat.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-400">No results for “{query}”.</div>
              ) : (
                groups.map((g) => (
                  <div key={g.title} className="px-2 pb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">{g.title}</p>
                    {g.items.map((it) => {
                      running += 1;
                      const idx = running;
                      const isActive = it.id === activeId;
                      const IconEl = it.icon;
                      return (
                        <button
                          key={it.id}
                          data-idx={idx}
                          onMouseMove={() => setActive(idx)}
                          onClick={() => select(it)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                            isActive ? "bg-[#4D2FB0] text-white" : "text-neutral-700"
                          }`}
                        >
                          <IconEl size={16} weight={isActive ? "fill" : "regular"} className={isActive ? "text-white" : "text-neutral-400"} />
                          <span className="flex-1 font-medium">{it.label}</span>
                          {isActive && <ArrowElbowDownLeft size={14} className="text-white/70" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-2.5 text-[11px] text-neutral-400">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="rounded border border-black/[0.08] bg-neutral-50 px-1 py-0.5">↑</kbd><kbd className="rounded border border-black/[0.08] bg-neutral-50 px-1 py-0.5">↓</kbd> navigate</span>
              </span>
              <span className="flex items-center gap-1.5" style={{ color: INK }}>
                Open <kbd className="flex h-5 w-5 items-center justify-center rounded border border-black/[0.08] bg-neutral-50 text-neutral-500"><ArrowElbowDownLeft size={12} /></kbd>
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
