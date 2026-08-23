"use client";

/* ------------------------------------------------------------------ */
/* Campaigns list — THE LADDER.                                        */
/*                                                                     */
/* A campaign is a phase, so this screen is the active brand's ladder   */
/* in phase order: what has finished, the one thing running, what is    */
/* unlocked, and what is still queued behind it.                        */
/*                                                                     */
/* The ladder is UNBOUNDED — a brand can be on Phase 2 or Phase 20 —    */
/* so nothing here may assume a length. Completed phases collapse into  */
/* a Completed block rather than growing the grid forever.              */
/*                                                                     */
/* Everything derives from useRoster(), which is already scoped to the  */
/* active brand and sorted by phase, so a phase funded on the detail    */
/* route is applied when you come back here.                            */
/*                                                                     */
/* NOTE — never print a total across brands, and never a lifetime       */
/* total. The masthead figure is the running phase's revenue.           */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CaretRight, CheckCircle, Clock, Lightning, List, LockSimple, Megaphone, SignOut,
} from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import NotificationCenter from "../components/NotificationCenter";
import CommandPalette from "../components/CommandPalette";
import StatusBadge from "../components/StatusBadge";
import {
  CAMPAIGNS, adsFor, fmtUSD, phaseHasStarted, phaseTitle, prevPhase,
  type Ad, type Campaign, type CampaignStatus,
} from "../lib/campaigns";
import { useRoster } from "../lib/funding";
import { useAdOverrides } from "../lib/adSignals";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";

const STATUS_FILTERS = ["All", "Live", "Ready", "Locked", "Ended"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

/* The filter VALUES are the stored campaign statuses; the labels are the
   canonical state words, so a tab and a status chip never disagree. */
const FILTER_LABEL: Record<StatusFilter, string> = {
  All: "All",
  Live: "Live",
  Ready: "Ready to fund",
  Locked: "Queued",
  Ended: "Completed",
};

/* ------------------------------------------------------------------ */
/* The two states a card can be in                                     */
/*                                                                     */
/* A phase gets its target the moment it is funded — budget × the       */
/* multiple guaranteed on it — so anything that has run, or is running, */
/* is METERED and shows revenue against that target.                    */
/*                                                                     */
/* A phase that has not run is QUEUED. Its revenue is zero and its      */
/* ROAS is undefined, so printing them would read as failure rather     */
/* than as "not started". What it honestly has is the money it will     */
/* deploy and the multiple promised on it.                              */
/* ------------------------------------------------------------------ */
type CardState = "metered" | "queued";

const cardState = (c: Campaign): CardState =>
  c.revTarget !== null ? "metered" : "queued";

/* ------------------------------------------------------------------ */
/* Campaign card — one component, three bodies                         */
/* ------------------------------------------------------------------ */
function CampaignCard({ c, i, onOpen }: { c: Campaign; i: number; onOpen: (id: string) => void }) {
  const state = cardState(c);
  const metered = state === "metered";
  const title = phaseTitle(c.phaseNo);
  const before = prevPhase(c);
  const label = metered
    ? `${title}, ${c.status.toLowerCase()}, ${fmtUSD(c.rev)} of ${fmtUSD(c.revTarget!)}, ${c.revPct} percent of this phase's target, ${c.roas} ROAS. Open phase.`
    : c.status === "Ready"
      ? `${title}, ready to fund, ${fmtUSD(c.budget)} to deploy at a guaranteed ${c.guaranteedRoas} times. Open phase.`
      : `${title}, queued, ${fmtUSD(c.budget)} reserved. Unlocks when the running phase crosses its 80% line. Open phase.`;

  return (
    <button
      onClick={() => onOpen(c.id)}
      aria-label={label}
      className="animate-fade-in flex w-full flex-col rounded-2xl border border-black/[0.06] bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,12,40,0.04)] transition-all hover:border-black/[0.10] hover:shadow-md"
      style={{ animationDelay: `${(0.04 + i * 0.06).toFixed(2)}s` }}
    >
      {/* Row 1 — identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold" style={{ color: INK }}>{title}</h3>
          {/* The name is the phase, so the second line carries the only
              other fact of identity a phase has: its own window. */}
          <p className="mt-0.5 truncate text-xs text-neutral-500">{c.dates}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {metered ? (
        <>
          {/* Row 2A — the revenue spine */}
          <div className="mt-5 flex items-baseline justify-between gap-2">
            <p className="text-[26px] font-bold leading-none tabular-nums" style={{ color: INK }}>
              {fmtUSD(c.rev)}
              <span className="ml-1.5 text-xs font-medium text-neutral-500">
                of {fmtUSD(c.revTarget!)}
              </span>
            </p>
            <span className="flex shrink-0 items-baseline gap-2">
              {/* A phase funded a moment ago is metered but has earned
                  nothing, so its ROAS is "—". Printing "— ROAS" reads as a
                  broken number; until there is revenue, the honest figure
                  is the multiple it is promised. */}
              <span className="rounded-full bg-[#F6F4FC] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#4D2FB0]">
                {c.rev > 0 ? `${c.roas} ROAS` : `${c.guaranteedRoas}× guaranteed`}
              </span>
              <span className="text-sm font-semibold tabular-nums text-[#4D2FB0]">{c.revPct}%</span>
            </span>
          </div>

          {/* THE SIGNATURE — the 80% unlock line */}
          <div className="relative mt-3 h-2 rounded-full bg-[#EFEBFA]">
            <div
              className="bar-fill keyline-grad h-full rounded-full"
              style={{ width: `${c.revPct}%`, "--bd": `${(0.35 + i * 0.08).toFixed(2)}s` } as React.CSSProperties}
            />
            <span aria-hidden="true" className={`unlock-notch ${c.revPct! >= 80 ? "unlock-notch--crossed" : ""}`} />
          </div>
          <span className="sr-only">
            {c.revPct! >= 80
              ? "Past the 80% unlock line."
              : `${80 - c.revPct!} percentage points below the 80% unlock line.`}
          </span>

          {/* Row 3 — threshold, verbatim from the shared data */}
          {c.threshold && (
            <p className={`mt-2.5 flex items-start gap-1.5 text-xs font-medium ${
              c.thresholdGreen ? "text-[#047857]" : "text-amber-700"
            }`}>
              {c.thresholdGreen
                ? <CheckCircle size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                : <Clock size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />}
              {c.threshold}
            </p>
          )}
        </>
      ) : (
        /* Row 2B — a phase that has not run. Its revenue is $0 and its
           ROAS is undefined, so the honest figures are the budget it
           will deploy and the multiple guaranteed on it. */
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[26px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                {fmtUSD(c.budget)}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
                {c.status === "Ready" ? "ready to deploy" : "reserved for this phase"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#F6F4FC] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#4D2FB0]">
              {c.guaranteedRoas}× guaranteed
            </span>
          </div>
          {c.status === "Ready" && c.due ? (
            <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-[#4D2FB0]">
              <Lightning size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
              {c.due.reason}
            </p>
          ) : (
            <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-neutral-400">
              <LockSimple size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
              {before
                ? `Unlocks when ${phaseTitle(before.phaseNo)} crosses its 80% line`
                : "Unlocks when the phase before it crosses its 80% line"}
            </p>
          )}
        </>
      )}

      {/* Spacer — floats the crew strip to the card's floor so a row of
          cards aligns on the same line however tall their bodies are.

          There is no phase stepper here any more. The ladder is unbounded
          and this list IS the ladder, so a fixed three-segment strip on
          every card was both impossible and a second drawing of the
          screen it sits on. */}
      <div aria-hidden="true" className="min-h-[1.25rem] flex-1" />

      {/* Row 5 — the crew. Keyed off the crew itself, not off the metering:
          a just-funded phase still has its matched creators. */}
      {c.creators !== null && (
        <div className="mt-3.5 flex items-center gap-2.5 border-t border-black/[0.06] pt-3.5">
          <span className="flex -space-x-2" aria-hidden="true">
            {c.faces.map((f) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={f.id} src={f.avatar} alt="" loading="lazy"
                className="h-7 w-7 rounded-full bg-neutral-200 object-cover ring-2 ring-white" />
            ))}
          </span>
          <span className="text-xs text-neutral-500">{c.creators} creators</span>
          <CaretRight size={14} weight="bold" aria-hidden="true" className="ml-auto shrink-0 text-neutral-300" />
        </div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Completed — finished phases stop being cards.                       */
/*                                                                     */
/* This is what makes an unbounded ladder survive: a brand twelve       */
/* phases in has eleven finished, and eleven cards would bury the one   */
/* thing that is actually running.                                      */
/* ------------------------------------------------------------------ */
function CompletedBlock({
  rows, delay, showEyebrow, onOpen,
}: {
  rows: Campaign[]; delay: number; showEyebrow: boolean; onOpen: (id: string) => void;
}) {
  return (
    <>
      {showEyebrow && (
        <p className="mb-2.5 mt-8 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          Completed · {rows.length}
        </p>
      )}
      <div
        className="animate-fade-in overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm"
        style={{ animationDelay: `${delay.toFixed(2)}s` }}
      >
        {rows.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            aria-label={`${phaseTitle(c.phaseNo)}, completed, ${c.revLabel} earned, ${c.roas} ROAS. Open phase.`}
            className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 sm:px-5 ${
              i > 0 ? "border-t border-black/[0.06]" : ""
            }`}
          >
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-neutral-100">
              <CheckCircle size={17} weight="fill" className="text-neutral-400" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold" style={{ color: INK }}>{phaseTitle(c.phaseNo)}</span>
              <span className="mt-0.5 block text-xs text-neutral-500">{c.dates}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums" style={{ color: INK }}>{c.revLabel}</span>
              <span className="block text-[11px] font-semibold tabular-nums text-neutral-500">{c.roas} ROAS</span>
            </span>
            <CaretRight size={14} weight="bold" aria-hidden="true" className="shrink-0 text-neutral-300" />
          </button>
        ))}
      </div>
    </>
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
  const [filter, setFilter]             = useState<StatusFilter>("All");
  /* Announces the filtered count to screen readers. */
  const [announce, setAnnounce]         = useState("");

  /* Funding is optimistic and lives in a module store, because the detail
     is its own route — a phase funded there has to be visible here. */
  const roster = useRoster();
  const open = (id: string) => router.push(`/campaigns/${id}`);

  /* At most one phase can be awaiting payment, because only the phase
     after the running one can be unlocked. */
  const actions = roster.filter((c) => c.due);
  const nextDue = actions[0];

  /* Drafts still waiting on the brand, per campaign. useWaitingFor is a hook,
     so it can't be called inside a loop — the overrides are read once and
     applied exactly the way useAdsFor applies them. */
  const overrides = useAdOverrides();
  const adQueue: { c: Campaign; waiting: Ad[] }[] = roster
    .filter(phaseHasStarted)
    .map((c) => ({
      c,
      waiting: adsFor(c.id).filter((a) => (overrides[a.id] ?? a.signal) === "none"),
    }))
    .filter((r) => r.waiting.length > 0);
  const adsWaiting = adQueue.reduce((s, r) => s + r.waiting.length, 0);

  /* Phases run one after another, never side by side, so a brand has AT
     MOST ONE live phase. There is nothing to combine and nothing to
     average: the headline IS the running phase, and it always has a
     target because funding sets one. */
  const live = roster.find((c) => c.status === "Live");
  const count = (s: CampaignStatus) => roster.filter((c) => c.status === s).length;

  /* The three headline panels sit in one row. Either of the two action panels
     can be empty, so the grid follows how many actually render — a missing
     panel must not leave a hole. */
  const panels = 1 + (actions.length > 0 ? 1 : 0) + (adQueue.length > 0 ? 1 : 0);
  const panelGrid =
    panels === 3 ? "xl:grid-cols-3" : panels === 2 ? "lg:grid-cols-2" : "";

  const shown = filter === "All" ? roster : roster.filter((c) => c.status === filter);
  const cards = shown.filter((c) => c.status !== "Ended");
  const completed = shown.filter((c) => c.status === "Ended");

  /* Deep link (?c=id) forwards to the detail route so old notification
     links keep landing in the right place. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("c");
    if (id && CAMPAIGNS.some((x) => x.id === id)) router.replace(`/campaigns/${id}`);
  }, [router]);

  const EMPTY: Record<StatusFilter, { title: string; body: string; cta?: string; act?: () => void }> = {
    Live: {
      title: "Nothing running right now",
      body: "Phases run one at a time. Fund the unlocked phase and it is live within the hour.",
      cta: "See what's ready", act: () => setFilter("Ready"),
    },
    Ready: {
      title: "Nothing waiting on you",
      body: "The running phase unlocks the next one when it crosses 80% of its target.",
      cta: "See what's running", act: () => setFilter("Live"),
    },
    Locked: {
      title: "Nothing queued",
      body: "Phases appear here once the phase ahead of them is under way.",
    },
    Ended: {
      title: "No completed phases yet",
      body: "Phases you finish are listed here with the revenue and ROAS they earned.",
    },
    All: {
      title: "Your ladder is being set up",
      body: "You work through phases one at a time, each with its own budget and its own guaranteed return. Your first phase appears here once it is ready.",
    },
  };
  const empty = EMPTY[filter];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa]"
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
        <header className="sticky top-0 z-20 flex h-[67px] shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-sm">
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            aria-label="Toggle navigation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100">
            <List size={18} />
          </button>
          <h1 className="shrink-0 text-[15px] font-semibold text-[#191234]">Campaigns</h1>

          <CommandPalette />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* A brand does not create campaigns — the ladder is already
                theirs. The only thing to start is the phase that has
                unlocked, so this is the fund CTA and nothing when the
                ladder has nothing waiting. */}
            {nextDue && (
              <button onClick={() => open(nextDue.id)}
                className="flex items-center gap-2 rounded-xl bg-[#4D2FB0] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#3F2596] sm:px-4">
                <Lightning size={13} weight="fill" />
                <span className="hidden sm:inline">{nextDue.due!.label} — {fmtUSD(nextDue.due!.amount)}</span>
                <span className="sm:hidden">Fund</span>
              </button>
            )}
            <NotificationCenter />
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4D2FB0] text-xs font-medium text-white">
                ME
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.06]">
                  <div className="border-b border-black/[0.05] px-4 pb-2 pt-3">
                    <p className="text-xs font-semibold text-neutral-700">Mostafa Elnagar</p>
                    <p className="text-[11px] text-neutral-400">Admin</p>
                  </div>
                  <button onClick={() => router.push("/")}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div aria-live="polite" role="status" className="sr-only">{announce}</div>

          {/* § HEADLINES — what's running, what needs paying, what needs
              judging: three panels in one row on a wide screen. */}
          <div className={`grid gap-4 ${panelGrid}`}>

            {/* Live — live-phase revenue only, never a lifetime total */}
            <section
              className="animate-fade-in flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white px-5 py-5 shadow-sm"
              style={{ animationDelay: "0s" }}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-green-600">
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${live ? "animate-live bg-green-500" : "bg-neutral-300"}`} />
                {live ? "Running now" : "Nothing running"}
              </p>

              {live ? (
                <>
                  <p className="mt-2 text-[32px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                    {fmtUSD(live.rev)}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    of <span className="font-semibold tabular-nums">{fmtUSD(live.revTarget!)}</span> on{" "}
                    <span className="font-semibold text-neutral-600">{phaseTitle(live.phaseNo)}</span>
                  </p>

                  {/* mt-auto pins the meter to the bottom so all three panels
                      in the row end on the same line. */}
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        Toward the 80% unlock line
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-[#4D2FB0]">{live.revPct}%</span>
                    </div>
                    {/* The notch belongs here as much as on the card: this is
                        the number that decides whether the next phase opens. */}
                    <div
                      role="img"
                      aria-label={`${phaseTitle(live.phaseNo)} has earned ${fmtUSD(live.rev)} of its ${fmtUSD(live.revTarget!)} target, ${live.revPct} percent. ${
                        (live.revPct ?? 0) >= 80
                          ? "Past the 80% unlock line."
                          : `${80 - (live.revPct ?? 0)} percentage points below the 80% unlock line.`
                      }`}
                      className="relative h-1.5 rounded-full bg-[#EFEBFA]"
                    >
                      <div className="bar-fill keyline-grad h-full rounded-full"
                        style={{ width: `${Math.min(live.revPct ?? 0, 100)}%`, "--bd": ".2s" } as React.CSSProperties} />
                      <span aria-hidden="true" className={`unlock-notch ${(live.revPct ?? 0) >= 80 ? "unlock-notch--crossed" : ""}`} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-[32px] font-bold leading-none text-neutral-300">—</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    No phase is running. Phases run one at a time.
                  </p>
                  <div className="mt-auto pt-5">
                    <p className="text-[11px] font-medium text-neutral-400">
                      {count("Ready") > 0
                        ? "Fund the unlocked phase below to start it."
                        : "Your next phase unlocks when the one before it crosses 80%."}
                    </p>
                  </div>
                </>
              )}
            </section>

            {/* Phases waiting on you */}
            {actions.length > 0 && (
              <section
                className="animate-fade-in flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm"
                style={{ animationDelay: ".07s" }}
              >
                {/* Sequential phases mean this can only ever hold one row,
                    so it is titled in the singular rather than counted. */}
                <p className="px-5 pb-2 pt-5 text-[11px] font-bold uppercase tracking-wide text-[#7C5CE0]">
                  Waiting on you
                </p>
                {actions.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => open(c.id)}
                    aria-label={`${c.due!.label}, ${fmtUSD(c.due!.amount)} plus 5% VAT. ${c.due!.reason}. Open phase.`}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50 ${
                      i > 0 ? "border-t border-black/[0.06]" : "border-t border-black/[0.06]"
                    }`}
                  >
                    <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#4D2FB0]/[0.1] text-[#4D2FB0]">
                      <Lightning size={17} weight="fill" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" style={{ color: INK }}>{phaseTitle(c.phaseNo)}</span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">{c.due!.reason}</span>
                    </span>
                    {/* The pay modal charges this amount plus 5% VAT, so the
                        pill says so rather than promising the smaller price. */}
                    <span className="flex shrink-0 items-baseline gap-1 rounded-full bg-[#4D2FB0] px-3 py-1.5 text-xs font-semibold tabular-nums text-white">
                      {fmtUSD(c.due!.amount)}
                      <span className="text-[10px] font-medium text-white/70">+ VAT</span>
                    </span>
                    <CaretRight size={14} weight="bold" aria-hidden="true" className="shrink-0 text-neutral-300" />
                  </button>
                ))}
              </section>
            )}

            {/* Ads waiting on you — the ladder owns what waits on you, and
                finished ads need you as much as an unfunded phase does.
                Nothing here has posted; drafts belong to the running phase. */}
            {adQueue.length > 0 && (
              <section
                className="animate-fade-in flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm"
                style={{ animationDelay: ".1s" }}
              >
                <p className="flex items-center gap-1.5 px-5 pb-2 pt-5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Ads waiting on you · {adsWaiting}
                </p>
                {adQueue.map(({ c, waiting }, i) => (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/campaigns/ads?c=${c.id}`)}
                    aria-label={`${waiting.length} ads waiting on you for ${phaseTitle(c.phaseNo)}. Nothing publishes until you like or dislike it. Open ad review.`}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-neutral-50 ${
                      i > 0 ? "border-t border-black/[0.06]" : "border-t border-black/[0.06]"
                    }`}
                  >
                    <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                      {waiting.slice(0, 3).map((a) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img key={a.id} src={a.img} alt="" loading="lazy"
                          className="h-9 w-9 rounded-[10px] bg-neutral-200 object-cover object-top ring-2 ring-white" />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" style={{ color: INK }}>
                        {waiting.length} ads waiting on you
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500">
                        {phaseTitle(c.phaseNo)} · Nothing publishes until you like or dislike it
                      </span>
                    </span>
                    <CaretRight size={14} weight="bold" aria-hidden="true" className="shrink-0 text-neutral-300" />
                  </button>
                ))}
              </section>
            )}
          </div>

          {/* § FILTER */}
          <div className="flex flex-wrap items-center gap-2 pb-5 pt-6"
            role="group" aria-label="Filter campaigns by status">
            {STATUS_FILTERS.map((f) => (
              <button key={f}
                onClick={() => {
                  setFilter(f);
                  const n = f === "All" ? roster.length : count(f as CampaignStatus);
                  setAnnounce(`Showing ${n} ${f === "All" ? "" : FILTER_LABEL[f].toLowerCase() + " "}campaign${n === 1 ? "" : "s"}`);
                }}
                aria-pressed={filter === f}
                className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "border border-[#4D2FB0] bg-[#4D2FB0]/[0.06] text-[#4D2FB0]"
                    : "border border-black/[0.09] bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                }`}>
                {FILTER_LABEL[f]}
                <span className={`ml-1.5 text-[11px] tabular-nums ${filter === f ? "text-[#4D2FB0]" : "text-neutral-400"}`}>
                  {f === "All" ? roster.length : count(f as CampaignStatus)}
                </span>
              </button>
            ))}
          </div>

          {/* § LIST */}
          <div key={filter}>
            {cards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {cards.map((c, i) => <CampaignCard key={c.id} c={c} i={i} onOpen={open} />)}
              </div>
            )}

            {completed.length > 0 && (
              <CompletedBlock
                rows={completed}
                delay={0.04 + cards.length * 0.06}
                showEyebrow={filter === "All"}
                onOpen={open}
              />
            )}

            {shown.length === 0 && (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                {filter === "All" && (
                  <span aria-hidden="true" className="mb-5 grid h-[72px] w-[72px] place-items-center rounded-full border-[5px] border-[#EDE9FB]">
                    <Megaphone size={26} weight="fill" className="text-[#CFC4F0]" />
                  </span>
                )}
                <p className="text-lg font-bold" style={{ color: INK }}>{empty.title}</p>
                <p className="mt-1.5 max-w-sm text-xs text-neutral-500">{empty.body}</p>
                {empty.cta && (
                  <button onClick={empty.act}
                    className="mt-6 inline-flex items-center rounded-full bg-[#4D2FB0]/[0.08] px-4 py-2 text-xs font-semibold transition-colors hover:bg-[#4D2FB0]/[0.14]"
                    style={{ color: BRAND }}>
                    {empty.cta}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
