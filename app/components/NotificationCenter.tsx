"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Lightning, Images, UsersThree, CreditCard, ChartLineUp, Checks,
} from "@phosphor-icons/react";

const INK = "#191234";

type NotifType = "phase" | "content" | "creator" | "payment" | "report";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  group: "Today" | "Earlier";
  href: string;
  cta?: string;
}

const NOTIFS: Notif[] = [
  { id: "n1", type: "phase",   group: "Today",   time: "2m ago",  title: "Phase 2 unlocked 🎉", body: "Spring 2026 hit 84% of its Phase 1 target — the next phase is ready.", href: "/campaigns", cta: "Pay Phase 2 — $2,000" },
  { id: "n2", type: "content", group: "Today",   time: "1h ago",  title: "12 ads awaiting review", body: "New creator content for Spring 2026 needs your approval before it goes live.", href: "/creators" },
  { id: "n3", type: "creator", group: "Today",   time: "3h ago",  title: "8 creators pending approval", body: "Fresh matches for your Ounass campaign pool.", href: "/creators" },
  { id: "n4", type: "payment", group: "Earlier", time: "Yesterday", title: "Payment received — $500", body: "Phase 1 payment for Ramadan Flash was processed by Mamo Pay.", href: "/settings" },
  { id: "n5", type: "report",  group: "Earlier", time: "Yesterday", title: "Your weekly report is ready", body: "Revenue up 18% week over week · ROAS 5.8×. See what changed.", href: "/dashboard" },
  { id: "n6", type: "creator", group: "Earlier", time: "2d ago",  title: "Layla Al Rashid accepted your campaign", body: "She'll start posting within 48 hours.", href: "/creators" },
  { id: "n7", type: "phase",   group: "Earlier", time: "3d ago",  title: "Ramadan Flash is on pace", body: "77% of the Phase 2 target — unlock expected in about 3 days.", href: "/campaigns" },
];

const TYPE_STYLE: Record<NotifType, { icon: React.ReactNode; tile: string }> = {
  phase:   { icon: <Lightning size={15} weight="fill" />,  tile: "bg-[#4D2FB0]/[0.08] text-[#4D2FB0]" },
  content: { icon: <Images size={15} weight="fill" />,     tile: "bg-amber-50 text-amber-600" },
  creator: { icon: <UsersThree size={15} weight="fill" />, tile: "bg-teal-50 text-teal-600" },
  payment: { icon: <CreditCard size={15} weight="fill" />, tile: "bg-green-50 text-green-600" },
  report:  { icon: <ChartLineUp size={15} weight="bold" />, tile: "bg-neutral-100 text-neutral-500" },
};

const READ_KEY = "moontech_notif_read";

export default function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(READ_KEY);
      if (s) setReadIds(JSON.parse(s));
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const persist = (ids: string[]) => {
    setReadIds(ids);
    try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch {}
  };

  const isRead = (id: string) => readIds.includes(id);
  const unreadCount = NOTIFS.filter((n) => !isRead(n.id)).length;

  const markRead = (id: string) => { if (!isRead(id)) persist([...readIds, id]); };
  const markAll = () => persist(NOTIFS.map((n) => n.id));

  const openItem = (n: Notif) => {
    markRead(n.id);
    setOpen(false);
    router.push(n.href);
  };

  const shown = tab === "all" ? NOTIFS : NOTIFS.filter((n) => !isRead(n.id));
  const groups: ("Today" | "Earlier")[] = ["Today", "Earlier"];

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-neutral-500 hover:bg-neutral-50 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-medium text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-xl shadow-black/[0.08] animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-black/[0.05] px-4 py-3">
            <p className="text-sm font-semibold" style={{ color: INK }}>Notifications</p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#4D2FB0]/[0.08] px-2 py-0.5 text-[11px] font-semibold text-[#4D2FB0]">{unreadCount} new</span>
            )}
            <button onClick={markAll}
              className="ml-auto flex items-center gap-1 text-[11px] font-medium text-neutral-400 transition hover:text-[#4D2FB0]">
              <Checks size={13} /> Mark all read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 border-b border-black/[0.05] px-3 py-2">
            {(["all", "unread"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  tab === t ? "bg-[#4D2FB0] text-white" : "text-neutral-500 hover:text-neutral-700"
                }`}>
                {t === "all" ? "All" : `Unread${unreadCount ? ` · ${unreadCount}` : ""}`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-6 py-12 text-center">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-semibold" style={{ color: INK }}>All caught up</p>
                <p className="text-xs text-neutral-400">New activity will show up here.</p>
              </div>
            ) : (
              groups.map((g) => {
                const items = shown.filter((n) => n.group === g);
                if (items.length === 0) return null;
                return (
                  <div key={g}>
                    <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{g}</p>
                    {items.map((n) => {
                      const st = TYPE_STYLE[n.type];
                      const unread = !isRead(n.id);
                      return (
                        <button key={n.id} onClick={() => openItem(n)}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 ${unread ? "bg-[#4D2FB0]/[0.03]" : ""}`}>
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${st.tile}`}>{st.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={`truncate text-[13px] ${unread ? "font-semibold" : "font-medium"}`} style={{ color: INK }}>{n.title}</span>
                              <span className="shrink-0 text-[11px] text-neutral-400">{n.time}</span>
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{n.body}</span>
                            {n.cta && (
                              <span className="mt-2 inline-flex rounded-lg bg-[#4D2FB0] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#3F2596]">
                                {n.cta} →
                              </span>
                            )}
                          </span>
                          {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#4D2FB0]" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <button onClick={() => { setOpen(false); router.push("/settings"); }}
            className="block w-full border-t border-black/[0.05] px-4 py-2.5 text-center text-[11px] font-medium text-neutral-400 transition hover:text-[#4D2FB0]">
            Notification preferences
          </button>
        </div>
      )}
    </div>
  );
}
