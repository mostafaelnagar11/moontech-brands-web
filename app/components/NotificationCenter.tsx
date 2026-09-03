"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Lightning, Images, UsersThree, CreditCard, ChartLineUp, Checks,
} from "@phosphor-icons/react";
import {
  CAMPAIGNS, adsFor, duePhase, fmtUSD, nextPhase, phaseTitle,
} from "../lib/campaigns";

const INK = "#191234";

/* Every alert is now about a phase, because a campaign IS a phase — so
   "phase" stopped telling the types apart. `ladder` is the class of event
   that moves a brand along its ladder: an unlock, a pace check. */
type NotifType = "ladder" | "content" | "creator" | "payment" | "report";

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

/* ------------------------------------------------------------------ */
/* The seed.                                                          */
/*                                                                    */
/* A campaign is a phase, so every alert is about ONE PHASE: there is */
/* no brand-chosen name to drop into a sentence, and nothing here may */
/* imply that a brand has several campaigns running at once. Titles   */
/* come from phaseTitle, so an alert and the card it opens can never  */
/* disagree about what the thing is called.                           */
/*                                                                    */
/* The figures are read off the SEED rather than the funded roster:   */
/* an alert records what was true when it fired, and funding a phase  */
/* today must not rewrite yesterday's sentence.                       */
/*                                                                    */
/* Two brands appear below, each on its own ladder — Ounass two rungs */
/* in with Phase 3 unlocked and waiting on payment, Luna still        */
/* climbing to its own 80% line. Nothing is totalled across them.     */
/* ------------------------------------------------------------------ */
const seed = (id: string) => CAMPAIGNS.find((c) => c.id === id)!;

const OU_LIVE = seed("ounass-phase-2");
const LU_LIVE = seed("luna-phase-2");
const LU_PAID = seed("luna-phase-1");   // the phase that receipt belongs to
const LU_NEXT = nextPhase(LU_LIVE)!;    // what Luna's 80% line unlocks

/* duePhase only ever returns a Ready phase carrying a `due`, and a `due`
   funds the phase it sits on — so the CTA below is Phase 3 paying for
   Phase 3, never a sibling. */
const OU_DUE = duePhase("ounass")!;
const OU_FUND = OU_DUE.due!;

const NOTIFS: Notif[] = [
  { id: "n1", type: "ladder",  group: "Today",   time: "2m ago",
    title: `${phaseTitle(OU_DUE.phaseNo)} unlocked 🎉`,
    body: `${phaseTitle(OU_LIVE.phaseNo)} reached ${OU_LIVE.revPct}% of its ${fmtUSD(OU_LIVE.revTarget!)} target — the next rung is ready to fund.`,
    href: `/campaigns/${OU_DUE.id}`,
    cta: `${OU_FUND.label} — ${fmtUSD(OU_FUND.amount)}` },
  /* This used to read "12 ads awaiting review — needs your approval before it
     goes live", which is the exact claim the signup key terms deny. The count
     is DERIVED from the drafts sitting on the phase, so the bell and the
     review screen cannot disagree about how much is waiting.

     It counts UNDECIDED drafts, not every draft on the phase. Two of the
     eight already carry a signal, and a draft you have judged is not
     waiting on you — the campaigns list says 6, so this has to say 6. */
  { id: "n2", type: "content", group: "Today",   time: "1h ago",
    title: `${adsFor(OU_LIVE.id).filter((a) => a.signal === "none").length} ads waiting on you`,
    body: `Drafts from ${phaseTitle(OU_LIVE.phaseNo)} are ready to publish — nothing publishes until you like them.`,
    href: `/campaigns/ads?c=${OU_LIVE.id}&shelf=waiting` },
  { id: "n3", type: "creator", group: "Today",   time: "3h ago",
    title: "8 creators waiting on you",
    body: `Fresh matches for ${phaseTitle(OU_LIVE.phaseNo)}.`,
    href: "/creators" },
  { id: "n4", type: "payment", group: "Earlier", time: "Yesterday",
    title: `Payment received — ${fmtUSD(LU_PAID.budget)}`,
    body: `Mamo Pay processed Luna Beauty's funding for ${phaseTitle(LU_PAID.phaseNo)}.`,
    href: `/campaigns/${LU_PAID.id}` },
  /* ROAS is PER PHASE: this is what Phase 2 returned on the budget Phase 2
     was given, against the multiple guaranteed on it. Never a figure pooled
     across the ladder or across brands. */
  { id: "n5", type: "report",  group: "Earlier", time: "Yesterday",
    title: "Your weekly report is ready",
    body: `${phaseTitle(OU_LIVE.phaseNo)} is up 18% week over week — ${OU_LIVE.roas} on the ${fmtUSD(OU_LIVE.budget)} it was given, against ${OU_LIVE.guaranteedRoas}× guaranteed.`,
    href: "/dashboard" },
  { id: "n6", type: "creator", group: "Earlier", time: "2d ago",
    title: `Jawaher Alsuwaidi joined ${phaseTitle(OU_LIVE.phaseNo)}`,
    body: "She'll start publishing within 48 hours.",
    href: "/creators" },
  /* Three days old, so it reports where Luna's Phase 2 stood THEN — below
     the 55% the seed shows today, because a phase's revenue only climbs. */
  { id: "n7", type: "ladder",  group: "Earlier", time: "3d ago",
    title: `${phaseTitle(LU_LIVE.phaseNo)} is on pace`,
    body: `Luna Beauty was 45% of the way to this phase's ${fmtUSD(LU_LIVE.revTarget!)} target — ${phaseTitle(LU_NEXT.phaseNo)} unlocks at 80%.`,
    href: `/campaigns/${LU_LIVE.id}` },
];

const TYPE_STYLE: Record<NotifType, { icon: React.ReactNode; tile: string }> = {
  ladder:  { icon: <Lightning size={15} weight="fill" />,  tile: "bg-[#4D2FB0]/[0.08] text-[#4D2FB0]" },
  content: { icon: <Images size={15} weight="fill" />,     tile: "bg-[#D70015]/[0.07] text-[#D70015]" },
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
        aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} new` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-neutral-500 hover:bg-neutral-50 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D70015]/[0.07]0 px-0.5 text-[9px] font-medium text-white ring-2 ring-white">
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
