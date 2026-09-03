"use client";

/* ------------------------------------------------------------------ */
/* Campaign detail — the web port of the mobile detail route.          */
/*                                                                     */
/* Mobile stacks the money, the live ads, the ledger and the pay CTA   */
/* in one narrow column. A desktop browser has room for two, so the    */
/* left column carries the explanation (money → drafts → ledger) and   */
/* the right rail carries the decision (fund the phase) plus delivery. */
/*                                                                     */
/* Order still matters inside the left column: money → the four-figure */
/* glance → AD REVIEW → LIVE ADS → phase performance. Review outranks  */
/* the live record because it is the thing that needs you today, and   */
/* the record is the thing that explains itself.                       */
/*                                                                     */
/* The pay flow stays modal — that one IS a confirmation.              */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CaretRight, CheckCircle, CircleNotch, Clock, Lightning,
  List, LockSimple, SignOut, ThumbsUp, ThumbsDown,
} from "@phosphor-icons/react";
import Sidebar from "../../components/Sidebar";
import NotificationCenter from "../../components/NotificationCenter";
import CommandPalette from "../../components/CommandPalette";
import StatusBadge from "../../components/StatusBadge";
import {
  adCreator, fmtUSD, nextPhase, phaseHasStarted, phaseTitle, vatOn, withVat,
  REVIEW_WINDOW_DAYS,
  type Ad, type Campaign,
} from "../../lib/campaigns";
import { useCampaign, useRoster, fundPhase } from "../../lib/funding";
import { useAdsFor, useWaitingFor } from "../../lib/adSignals";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";

const CARD = "rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)]";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em]";

/* Ring geometry. The radius is the only figure to set: the dash length the
   arc is drawn against derives from it, so the arc can never be measured
   with a stale circumference. */
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;


/* ------------------------------------------------------------------ */
/* One draft, as a card.                                               */
/*                                                                     */
/* Shared by BOTH ad sections, so the tile a liked ad gets under "Live  */
/* ads" and the tile a waiting one gets under "Ad review" cannot drift  */
/* apart. Each card opens the review ON that ad.                        */
/*                                                                     */
/* What the cards do NOT carry is an engagement pair. A waiting ad has   */
/* not published, so a like count would be invented — and per-creator    */
/* counts are exactly what the design review took off the screen. The    */
/* badge is the format, and the footer is who made it.                  */
/*                                                                     */
/* A DECLINE IS DIMMED, NOT KILLED. `muted` is the whole difference: the */
/* photo drops back and the caption says so in words. No black cross, no */
/* strikethrough — a dislike is reversible and the review screen still   */
/* offers "Like instead", so the tile must not read as a closed door.    */
/* ------------------------------------------------------------------ */
function AdTile({ ad, onOpen }: { ad: Ad; onOpen: () => void }) {
  const c = adCreator(ad);
  const muted = ad.signal === "disliked";
  return (
    <button
      onClick={onOpen}
      aria-label={`${c.name}, ${ad.format} for ${ad.platform}. ${
        ad.signal === "none"
          ? "Waiting on you."
          : ad.signal === "liked"
            ? "Liked — publishing."
            : "Not publishing. You can still like it instead."
      } Open the review on this ad.`}
      className="group relative block aspect-[9/14] w-[132px] shrink-0 overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-black/[0.06] transition hover:ring-2 hover:ring-[#4D2FB0]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.img} alt="" loading="lazy"
        className={`h-full w-full object-cover object-top transition-opacity ${muted ? "opacity-[0.45] group-hover:opacity-80" : ""}`} />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <span aria-hidden="true" className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
        {ad.format}
      </span>
      {/* Liked gets the green tick of a decision that produced work.
          Declined gets a pale, unfilled marker — visible enough to tell the
          two apart on one shelf, quiet enough not to look final. */}
      {ad.signal !== "none" && (
        <span
          aria-hidden="true"
          className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full ${
            ad.signal === "liked" ? "bg-[#059669] text-white" : "bg-white/85 text-neutral-500"
          }`}
        >
          {ad.signal === "liked"
            ? <ThumbsUp size={11} weight="fill" />
            : <ThumbsDown size={11} weight="fill" />}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-2 px-2.5 text-left">
        <span className="block truncate text-[12px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
          {c.name.split(" ")[0]}
        </span>
        {muted && (
          <span className="block truncate text-[10px] font-semibold text-white/75 [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
            Not publishing
          </span>
        )}
      </span>
    </button>
  );
}


/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
/* Tailwind only sees literal class strings, so the column count is a
   lookup rather than an interpolation. */
const GLANCE_COLS: Record<number, string> = {
  1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4",
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const detail = useCampaign(params.id);
  /* The brand's own ladder — this phase's siblings, in order. */
  const roster = useRoster();

  const [activeNav, setActiveNav]       = useState("Campaigns");
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [payOpen, setPayOpen]   = useState(false);
  const [payState, setPayState] = useState<"idle" | "processing" | "done">("idle");
  const [announce, setAnnounce] = useState("");

  /* The modal bills off a SNAPSHOT of the due phase, not off detail.due:
     funding clears `due`, and the receipt still has to say what was paid. */
  const [payDue, setPayDue] = useState<Campaign["due"]>(null);

  /* Ad decisions come from the shared store, so liking every draft in the
     review route and coming back no longer claims they still wait on you. */
  const drafts  = useAdsFor(params.id);
  const waiting = useWaitingFor(params.id);
  const liked    = drafts.filter((a) => a.signal === "liked");
  const disliked = drafts.filter((a) => a.signal === "disliked");

  const cid    = detail?.id;
  const cphase = detail?.phaseNo;

  /* The payment SUCCEEDS here, so this is where the phase gets funded.
     Done / Escape / backdrop are pure dismissals — a user who reads the
     receipt and presses Escape has still paid. fundPhase is idempotent
     and the effect bails once payState is "done", so neither the funding
     nor the announcement can fire twice. */
  useEffect(() => {
    if (payState !== "processing" || !cid || !cphase || !payDue) return;
    const t = window.setTimeout(() => {
      /* The record that is paid for is the record that changes. A phase
         carries its own `due`, so the id and the money can never point
         at two different campaigns. */
      fundPhase(cid);
      setAnnounce(`${phaseTitle(cphase)} funded and now live.`);
      setPayState("done");
    }, 1400);
    return () => window.clearTimeout(t);
  }, [payState, payDue, cid, cphase]);

  /* Escape closes the pay dialog — a modal on the web owes you a key. */
  useEffect(() => {
    if (!payOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPayOpen(false); setPayState("idle"); setPayDue(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payOpen]);

  /* An unknown id is a dead end, not a crash — send them back to the list. */
  useEffect(() => {
    if (!detail) router.replace("/campaigns");
  }, [detail, router]);

  if (!detail) return null;

  /* Two states. Funding a phase gives it its target immediately —
     budget × the multiple guaranteed on it — so anything that has run,
     or is running, is metered. A phase that has not run has no target
     and no revenue worth printing. */
  const pct = detail.revPct;
  const target = detail.revTarget;
  const metered = pct !== null && target !== null;

  /* The successor, for the "nothing waiting on you" copy — a lookup, not
     a comparison against a fixed ladder length. */
  const after = nextPhase(detail, roster);

  /* Performance figures. ROAS is recomputed from this phase's own money
     rather than read off the stored string, so the bar and the label can
     never disagree with each other. */
  const roasNum = detail.budget > 0 ? detail.rev / detail.budget : 0;
  const guaranteeMet = roasNum >= detail.guaranteedRoas;
  /* The ruler is measured in MULTIPLES of the phase's own budget. Its top
     end is whichever is larger — what was promised or what was actually
     returned — plus headroom, so the guarantee tick and the fill both
     always sit inside the track. */
  const rulerMax = Math.max(detail.guaranteedRoas, roasNum) * 1.12;

  /* Built BEFORE the grid so the column count comes from the array rather
     than being hardcoded. A fixed lg:grid-cols-4 outlived the tile it was
     sized for and left a quarter of the row empty — the grid follows the
     tiles, never the other way round. */
  const tiles = [
    { k: "Influencers live", v: String(detail.creators), sub: "matched to this phase" },
    { k: "Budget deployed",  v: fmtUSD(detail.budget),   sub: "this phase's own money" },
    /* Only when there is a queue to count. A phase with no drafts on file
       would print "Live ads 0", which reads as "nothing ran" — and the
       stored adsLive that could contradict it is exactly the figure this
       page refuses to believe. No queue, no tile. */
    ...(drafts.length > 0
      ? [{ k: "Live ads", v: String(liked.length), sub: "liked drafts, publishing" }]
      : []),
  ];
  /* What the guarantee is worth in money on this phase. Identical to
     revTarget for a funded phase — which is exactly why the ruler must
     not also print a percentage. */
  const guaranteeTarget = detail.budget * detail.guaranteedRoas;

  const due = detail.due;
  const amount = payDue?.amount ?? 0;
  const vat = vatOn(amount);
  const total = amount + vat;

  /* Pure dismissal. The money already moved when the payment succeeded. */
  function dismiss() {
    setPayOpen(false);
    setPayState("idle");
    setPayDue(null);
  }

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* Shared gradient defs — the pay receipt's confirmation ring uses these. */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#4D2FB0" /><stop offset="55%" stopColor="#9B7BF0" />
            <stop offset="100%" stopColor="#F4A8D8" />
          </linearGradient>
        </defs>
      </svg>

      <Sidebar
        collapsed={collapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex h-[67px] shrink-0 items-center gap-3 bg-white/80 backdrop-blur-sm border-b border-black/[0.06] px-4 sticky top-0 z-20">
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            aria-label="Toggle navigation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>

          <button
            onClick={() => router.push("/campaigns")}
            aria-label="Back to campaigns"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-neutral-500 hover:border-neutral-300 hover:text-[#191234] transition-colors">
            <ArrowLeft size={15} weight="bold" />
          </button>

          <h1 className="text-[15px] font-semibold text-[#191234] shrink-0 truncate">{phaseTitle(detail.phaseNo)}</h1>

          <CommandPalette />

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* No create action: a brand does not make campaigns, and the
                one thing to do on this page — funding it — already has a
                primary button in the rail. */}
            <NotificationCenter />
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
                aria-label="Account menu"
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
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-medium text-[#D70015] hover:bg-[#D70015]/[0.07] transition-colors">
                    <SignOut size={13} weight="bold" />Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <p aria-live="polite" role="status" className="sr-only">{announce}</p>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">

            {/* ══════════════ LEFT — the money, the drafts, the ledger ══════════════ */}
            <div className="min-w-0 space-y-5">

              {/* ── The money this campaign has made ── */}
              <section className={`${CARD} p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={detail.status} />
                  <span className="text-xs text-neutral-500">{detail.dates}</span>
                  {/* A phase that has not run has no ROAS — printing the
                      placeholder as "— ROAS" reads like a broken number.
                      What it does have is the multiple it is promised. */}
                  <span className="ml-auto rounded-full bg-[#F6F4FC] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#4D2FB0]">
                    {detail.rev > 0 ? `${detail.roas} ROAS` : `${detail.guaranteedRoas}× guaranteed`}
                  </span>
                </div>

                {metered ? (
                  <>
                    <div className="mt-5 flex items-baseline justify-between gap-2">
                      <p className="text-[34px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                        {fmtUSD(detail.rev)}
                      </p>
                    </div>
                    {/* ONE progress instrument on the page. The ring in the
                        rail owns the percentage and the 80% mark, so this card
                        keeps only the fact — a bar here made two things draw
                        the same number two ways, three inches apart. */}
                    <p className="mt-2 text-xs text-neutral-500">of {fmtUSD(target)} phase target</p>
                  </>
                ) : (
                  /* Not started. Its revenue is $0 and its ROAS undefined,
                     so the honest headline is the money it will deploy and
                     what that money is promised to return. */
                  <>
                    <p className="mt-5 text-[34px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                      {fmtUSD(detail.budget)}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {detail.status === "Ready" ? "ready to deploy" : "reserved for this phase"} ·
                      metered against{" "}
                      <span className="font-semibold tabular-nums">
                        {fmtUSD(detail.budget * detail.guaranteedRoas)}
                      </span>{" "}
                      at your guaranteed {detail.guaranteedRoas}×
                    </p>
                  </>
                )}
              </section>

              {/* ── Threshold, verbatim from the shared data ── */}
              {detail.threshold && (
                <div className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
                  detail.thresholdGreen ? "bg-[#059669]/[0.08] text-[#047857]" : "bg-[#D70015]/[0.07] text-[#D70015]"
                }`}>
                  <Clock size={16} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                  {detail.threshold}
                </div>
              )}

              {/* ── PHASE AT A GLANCE ──
                   Four figures, each one read or multiplied straight out of
                   this phase's own record. The prototype this came from had
                   six: "Total Orders" and "Ads Scheduled" are in no model
                   anywhere in this app, so they are not here — a tile a brand
                   cannot check is worse than a tile it does not get.

                   Live ads reads the SAME liked count the Live ads section
                   below renders, off the same array, so the tile and the
                   section cannot disagree. ── */}
              {/* `creators` is null until a phase is funded and a phase that
                  has not started has no ads to count, so the grid is gated on
                  both. The "What this phase commits to" card further down
                  already states an unfunded phase's budget and target. */}
              {phaseHasStarted(detail) && detail.creators !== null && (
                <div className={`grid grid-cols-1 gap-3 ${GLANCE_COLS[tiles.length]}`}>
                  {tiles.map((m) => (
                    <div key={m.k} className={`${CARD} p-4`}>
                      <p className="text-[13px] font-medium text-neutral-500">{m.k}</p>
                      <p className="mt-2 text-[22px] sm:text-[24px] font-semibold leading-none tracking-tight tabular-nums"
                        style={{ color: INK }}>
                        {m.v}
                      </p>
                      <p className="mt-2.5 text-xs text-neutral-400">{m.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── THE ADS, IN TWO SECTIONS ──
                   One "Live ads" section used to hold the entire queue —
                   waiting, liked and declined in one strip — which is why the
                   name never fit: most of what it listed was not live. A LIKE
                   PUBLISHES AN AD, so the split is the model's own:

                     Ad review — waiting + declined. The work.
                     Live ads  — liked. The record of what is running.

                   Drafts are seeded against every phase that CAN run, so this
                   still has to ask whether the phase has actually STARTED: a
                   Ready or Locked phase showing creative would be claiming
                   work no creator has been briefed to do. Each section is then
                   gated on having something IN it — a phase with no likes yet
                   must not render an empty "Live ads" box. ── */}
              {phaseHasStarted(detail) && drafts.length > 0 && (
                <>
                  {/* ── AD REVIEW — a ROW, not a panel ──
                       The same compact shape the campaigns list uses for the
                       identical job: a stack of thumbnails, what is waiting,
                       and a chevron into the queue. A full panel here was a
                       second workstation on a page that already links to the
                       real one — the ledger it carried is condensed into the
                       one line underneath, which is all of it a brand reads
                       at a glance anyway. ── */}
                  {(waiting.length > 0 || disliked.length > 0) && (
                    <section>
                      <p className={`${EYEBROW} mb-2 text-[#7C5CE0]`}>Ad review</p>
                      <button
                        onClick={() => router.push(
                          `/campaigns/ads?c=${detail.id}&shelf=${waiting.length > 0 ? "waiting" : "disliked"}`,
                        )}
                        aria-label={waiting.length > 0
                          ? `${waiting.length} ads waiting on you. ${liked.length + disliked.length} of ${drafts.length} decided. A draft left undecided publishes on its own after ${REVIEW_WINDOW_DAYS} days. Open ad review.`
                          : `Every draft decided. ${disliked.length} not publishing. Open ad review to reopen a decline.`}
                        className={`${CARD} flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50`}
                      >
                        <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                          {(waiting.length > 0 ? waiting : disliked).slice(0, 3).map((a) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img key={a.id} src={a.img} alt="" loading="lazy"
                              className="h-9 w-9 rounded-[10px] bg-neutral-200 object-cover object-top ring-2 ring-white" />
                          ))}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold" style={{ color: INK }}>
                            {waiting.length > 0
                              ? `${waiting.length} ads waiting on you`
                              : "Every draft decided"}
                          </span>
                          {/* The ledger, condensed to the line it was always
                              read as: how much is done, and the rule that
                              governs what is not. */}
                          <span className="mt-0.5 block truncate text-xs text-neutral-500">
                            {liked.length + disliked.length} of {drafts.length} decided
                            {waiting.length > 0
                              ? ` · undecided drafts publish on their own after ${REVIEW_WINDOW_DAYS} days`
                              : disliked.length > 0
                                ? ` · ${disliked.length} not publishing — a decline can be reopened`
                                : ""}
                          </span>
                        </span>
                        <CaretRight size={14} weight="bold" aria-hidden="true" className="shrink-0 text-neutral-300" />
                      </button>
                    </section>
                  )}

                  {/* ── LIVE ADS — the liked ads, which is to say the running
                       ones. A RECORD, NOT A TO-DO: no review CTA and no
                       countdown, because everything on this card is already
                       published and there is nothing here left to decide. ── */}
                  {liked.length > 0 && (
                    <section>
                      <p className={`${EYEBROW} mb-2 text-[#7C5CE0]`}>Live ads</p>

                      <div className={`${CARD} p-4`}>
                        <div className="flex items-end justify-between gap-4 border-b border-black/[0.06] pb-4">
                          {/* The totals for this phase's creative: the whole
                              set first, then the two decisions that split it.
                              The set and the liked half carry the brand
                              colour together — they are the two figures a
                              brand reads this card for — and disliked stays
                              neutral behind them.

                              They are FIGURES, not routes — nothing here links
                              into Ad review, so the two flows still do not
                              cross. Every count reads the same arrays the
                              review row reads, so they cannot disagree. */}
                          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                            <div>
                              <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: BRAND }}>
                                {drafts.length}
                              </p>
                              <p className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: INK }}>
                                total ads
                              </p>
                            </div>
                            <div>
                              <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color: BRAND }}>
                                {liked.length}
                              </p>
                              <p className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: INK }}>
                                liked
                              </p>
                            </div>
                            <div>
                              <p className="text-[22px] font-bold leading-none tabular-nums text-neutral-400">
                                {disliked.length}
                              </p>
                              <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-400">
                                disliked
                              </p>
                            </div>
                          </div>
                          {/* Straight to the liked shelf. Landing the reviewer
                              on Waiting from here would answer a question
                              nobody asked. */}
                          <button
                            onClick={() => router.push(`/campaigns/ads?c=${detail.id}&shelf=liked`)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-[#4D2FB0] transition-colors hover:bg-[#4D2FB0]/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]/40"
                          >
                            View all
                            <CaretRight size={12} weight="bold" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                          {/* shelf=liked, not just ad=. Without it a liked ad
                              opened in the REVIEW flow — right ad, wrong
                              chrome: the "Ad review" title and the Waiting /
                              Disliked tabs, on a screen reached from Live ads.
                              Every link into that route has to name the flow
                              it belongs to, not only the ad. */}
                          {liked.slice(0, 8).map((a) => (
                            <AdTile key={a.id} ad={a}
                              onOpen={() => router.push(
                                `/campaigns/ads?c=${detail.id}&shelf=liked&ad=${a.id}`,
                              )} />
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* ── PHASE PERFORMANCE ──
                   The money card above answers "how far to the unlock line".
                   This answers the two questions it cannot: is this phase
                   delivering the multiple it PROMISED, and what is each
                   creator and each published ad actually returning.

                   Every figure divides two numbers this phase already owns.
                   Nothing here is estimated, and nothing repeats the
                   Delivery rail — that counts ads and crew, this rates them. */}
              {metered ? (
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} mb-4 text-[#7C5CE0]`}>Phase performance</p>

                  {/* THE RETURN RULER.
                      One visual, not two bars. The money this phase was GIVEN
                      is the unit: every tick is one more multiple of it, so
                      the distance the fill travels IS the return — no
                      division for the reader to do. The guarantee is a marked
                      tick on the same rule, which is why the separate
                      guarantee bar is gone: it was the same fact drawn twice.

                      The scale derives from whichever is larger, the actual or
                      the promise, so a phase that BEATS its guarantee still
                      fits (Phase 1 closed at 5.2x against 5x) and the fill can
                      never leave the track. */}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-500">
                        Return on the money deployed
                      </span>
                      <span className="text-[15px] font-bold tabular-nums" style={{ color: guaranteeMet ? "#047857" : INK }}>
                        {roasNum.toFixed(1)}&times;
                      </span>
                    </div>

                    <div
                      role="img"
                      aria-label={`${fmtUSD(detail.budget)} deployed returned ${fmtUSD(detail.rev)} — ${roasNum.toFixed(1)} times, against a guaranteed ${detail.guaranteedRoas} times.`}
                      className="relative mt-2.5 h-2.5 rounded-full bg-[#F1EFF7]"
                    >
                      {/* hairline tick per whole multiple — the scale itself */}
                      {Array.from({ length: Math.max(Math.floor(rulerMax), 1) }, (_, i) => i + 1)
                        .filter((m) => m / rulerMax < 0.99)
                        .map((m) => (
                          <span key={m} aria-hidden="true"
                            className="absolute top-0 h-full w-px bg-white/70"
                            style={{ left: `${(m / rulerMax) * 100}%` }} />
                        ))}

                      <div className={`h-full rounded-full ${guaranteeMet ? "bg-[#059669]" : "keyline-grad"}`}
                        style={{ width: `${Math.min((roasNum / rulerMax) * 100, 100)}%` }} />

                      {/* the promise, on the same rule as the result */}
                      <span aria-hidden="true"
                        className="absolute -top-1 h-[18px] w-[2px] rounded-full bg-[#191234]/45"
                        style={{ left: `${(detail.guaranteedRoas / rulerMax) * 100}%` }} />
                    </div>

                    {/* the guarantee label sits under its own tick */}
                    <div className="relative mt-1.5 h-4">
                      <span className="absolute whitespace-nowrap text-[10px] font-semibold text-neutral-500"
                        style={{
                          left: `${(detail.guaranteedRoas / rulerMax) * 100}%`,
                          transform: "translateX(-50%)",
                        }}>
                        {detail.guaranteedRoas}&times; guaranteed
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-black/[0.06] pt-2.5">
                      <span className="text-[11px] text-neutral-500">
                        <span className="font-semibold tabular-nums" style={{ color: INK }}>{fmtUSD(detail.budget)}</span> deployed
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        returned{" "}
                        <span className="font-semibold tabular-nums" style={{ color: INK }}>{fmtUSD(detail.rev)}</span>
                      </span>
                    </div>

                    {/* NOT a percentage. Because a phase's target IS its
                        budget times its guaranteed multiple, "% of target"
                        and "% of the guarantee" are the same ratio — so a
                        percentage here just restates the figure on the card
                        above and reads like a second, different 84%.
                        The gap in money is the one fact not already on the
                        page, and it is the one a brand can act on. */}
                    <p className={`mt-2.5 text-[11px] font-medium ${guaranteeMet ? "text-[#047857]" : "text-neutral-500"}`}>
                      {roasNum === 0
                        ? "Nothing earned yet — the guarantee is settled when the phase closes."
                        : guaranteeMet
                          ? `${fmtUSD(Math.round(detail.rev - guaranteeTarget))} past the ${detail.guaranteedRoas}\u00d7 guarantee.`
                          : `${fmtUSD(Math.round(guaranteeTarget - detail.rev))} more earned reaches the ${detail.guaranteedRoas}\u00d7 guarantee.`}
                    </p>
                  </div>

                  {/* Per-CREATOR efficiency, and only that. Each figure divides
                      two numbers this phase owns, so it cannot drift from it —
                      which is exactly what "revenue per live ad" could not
                      claim: it divided by the stored 125, a live count this
                      page no longer believes. */}
                  <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-black/[0.06] pt-4">
                    {[
                      { k: "Revenue per creator",
                        v: detail.creators ? fmtUSD(Math.round(detail.rev / detail.creators)) : "—" },
                      { k: "Cost per creator",
                        v: detail.creators ? fmtUSD(Math.round(detail.budget / detail.creators)) : "—" },
                    ].map((m) => (
                      <div key={m.k}>
                        <p className="text-[17px] font-bold leading-none tabular-nums" style={{ color: INK }}>{m.v}</p>
                        <p className="mt-1 text-[11px] leading-tight text-neutral-500">{m.k}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                /* Not funded: there is no performance to chart. What can be
                   stated honestly is the arithmetic of the offer. */
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} mb-4 text-[#7C5CE0]`}>What this phase commits to</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { k: "Budget", v: fmtUSD(detail.budget) },
                      { k: "Guarantee", v: `${detail.guaranteedRoas}×` },
                      { k: "Revenue target", v: fmtUSD(detail.budget * detail.guaranteedRoas) },
                    ].map((m) => (
                      <div key={m.k}>
                        <p className="text-[19px] font-bold leading-none tabular-nums" style={{ color: INK }}>{m.v}</p>
                        <p className="mt-1 text-[11px] leading-tight text-neutral-500">{m.k}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-black/[0.06] pt-3.5 text-xs text-neutral-500">
                    Creators are matched and drafts are cut once this phase is funded, so there is
                    nothing to measure until then.
                  </p>
                </section>
              )}

            </div>

            {/* ══════════════ RIGHT — the decision, then delivery ══════════════ */}
            <div className="min-w-0 space-y-5 xl:sticky xl:top-0 xl:self-start">

              {/* ── The action. It is the primary thing on this page, so on a
                   desktop it sits at the top of the rail, not below the stats. ── */}
              {due ? (
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} flex items-center gap-1.5 text-[#7C5CE0]`}>
                    <Lightning size={12} weight="fill" aria-hidden="true" />
                    Waiting on you · funding
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>{due.reason}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    You fund one phase at a time, and only once it has unlocked.
                  </p>
                  <button
                    onClick={() => { setPayDue(due); setPayOpen(true); setPayState("idle"); }}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#4D2FB0] px-4 py-3 text-[13px] font-semibold tabular-nums text-white hover:bg-[#3F2596] transition-colors">
                    {due.label} — {fmtUSD(due.amount)}
                  </button>
                  {/* The receipt bills amount + 5% VAT, so the button must not
                      be the only number the user sees before the modal. */}
                  <p className="mt-2 text-center text-[11px] tabular-nums text-neutral-500">
                    + 5% VAT · {fmtUSD(withVat(due.amount))} due today
                  </p>
                </section>
              ) : detail.status === "Live" ? (
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} text-[#7C5CE0]`}>Live</p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>
                    {phaseTitle(detail.phaseNo)}
                  </p>
                  {/* This card used to open "Nothing is waiting on you" and
                      then promise an unlock that had already happened. Both
                      halves have to be asked, in order: drafts genuinely
                      waiting outrank everything, and a successor that is
                      already Ready is unlocked, not pending.

                      The waiting COUNT is not in this sentence any more — the
                      ledger in Live ads carries it, and the button right below
                      names it again. One number, twice on a screen, is the
                      most it should ever appear. */}
                  <p className="mt-1 text-xs text-neutral-500">
                    {waiting.length > 0
                      ? "Nothing publishes until you decide."
                      : after && after.status === "Ready"
                        ? `${phaseTitle(after.phaseNo)} is unlocked and waiting on funding.`
                        : after
                          ? `Nothing is waiting on you. ${phaseTitle(after.phaseNo)} unlocks when this phase crosses 80%.`
                          : "Nothing is waiting on you. This is your last phase so far."}
                  </p>
                  {/* No Review button here. The Ad review section carries the
                      same CTA, word for word, sitting beside the creative it
                      acts on — this rail copy was the weaker of the two. The
                      sentence above still says drafts are waiting. */}
                  {after && after.status === "Ready" ? (
                    <button
                      onClick={() => router.push(`/campaigns/${after.id}`)}
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#4D2FB0] px-4 py-3 text-[13px] font-semibold tabular-nums text-white hover:bg-[#3F2596] transition-colors">
                      {after.due ? `${after.due.label} — ${fmtUSD(after.due.amount)}` : `Open ${phaseTitle(after.phaseNo)}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/creators")}
                      className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#4D2FB0]/25 bg-[#4D2FB0]/[0.06] px-4 py-3 text-[13px] font-semibold text-[#4D2FB0] hover:bg-[#4D2FB0]/[0.1] transition-colors">
                      View creators
                    </button>
                  )}
                </section>
              ) : null}

              {/* ── REVENUE PROGRESS ──
                   The same two numbers the money card carries, drawn as a
                   ring: the rail is where a brand looks for "how far in", and
                   a ring answers that at a glance where a 2px bar does not.

                   Both are narrowed here rather than read off `metered`,
                   because revTarget is null until a phase is funded — a Ready
                   or Locked phase renders nothing at all instead of a 0% donut
                   against a target it has not been given yet. ── */}
              {pct !== null && target !== null && (
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} text-[#7C5CE0]`}>Revenue progress</p>

                  <div className="mt-4 flex flex-col items-center">
                    <div className="relative h-[136px] w-[136px]">
                      <svg viewBox="0 0 120 120" className="h-full w-full" role="img"
                        aria-label={`${pct}% of this phase's ${fmtUSD(target)} revenue target — ${fmtUSD(detail.rev)} earned. The next phase unlocks at 80%.`}>
                        <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#EFEBFA" strokeWidth="10" />
                        {/* The ARC IS CLAMPED at one full turn while the label
                            below keeps the truth: Phase 1 closed at 104%, and
                            a second lap would read as 4%. Green once the
                            target is met, because that is what green means
                            everywhere else on this page. */}
                        <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="10" strokeLinecap="round"
                          stroke={pct >= 100 ? "#059669" : BRAND}
                          strokeDasharray={RING_C}
                          strokeDashoffset={RING_C * (1 - Math.min(pct, 100) / 100)}
                          transform="rotate(-90 60 60)" />
                        {/* THE 80% UNLOCK LINE — the number the phase turns
                            on, marked on the rule it is measured against. The
                            arc starts at twelve o'clock and runs clockwise, so
                            0.8 of a turn is 288 degrees from there. */}
                        <line x1="60" y1="2" x2="60" y2="16" strokeWidth="2.5" strokeLinecap="round"
                          stroke={pct >= 80 ? "#047857" : "#191234"}
                          strokeOpacity={pct >= 80 ? 1 : 0.35}
                          transform="rotate(288 60 60)" />
                      </svg>
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[27px] font-bold leading-none tabular-nums"
                          style={{ color: pct >= 100 ? "#047857" : INK }}>
                          {pct}%
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          achieved
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs tabular-nums text-neutral-500">
                      <span className="font-semibold" style={{ color: INK }}>{fmtUSD(detail.rev)}</span>{" "}
                      of {fmtUSD(target)}
                    </p>
                    <p className={`mt-1 text-[11px] font-medium ${pct >= 80 ? "text-[#047857]" : "text-neutral-500"}`}>
                      {pct >= 80
                        ? "Past the 80% unlock line"
                        : `${80 - pct} points to the 80% unlock line`}
                    </p>
                  </div>
                </section>
              )}

              {/* ── Delivery rail — the crew, and nothing else.
                     "Ads live 125/200" used to lead it. That pair is stored, not
                     computed, and this phase's queue holds eight drafts of which
                     one is liked, so the tile contradicted the section above it
                     by two orders of magnitude. The live count now comes only
                     from liked drafts, in one place. `detail.content` went the
                     same way earlier — 89 against 125 on one campaign, 142
                     against 96 on another. Both fields stay in the data, unread
                     here. Creators is real: it is what the money bought. ── */}
              {detail.creators !== null && (
                <section className={`${CARD} overflow-hidden`}>
                  <p className={`${EYEBROW} px-5 pt-4 pb-1 text-neutral-400`}>Delivery</p>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Creators</p>
                    <p className="text-[17px] font-semibold tabular-nums" style={{ color: INK }}>{detail.creators}</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Pay modal — a real confirmation, so it is a centred dialog.
             It bills off `payDue`, the snapshot taken when it opened: the
             moment the payment lands, detail.due is null. ── */}
      {payOpen && payDue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            aria-hidden="true"
            onClick={dismiss}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-dialog-title"
            className={`${CARD} animate-fade-in relative w-full max-w-md overflow-hidden shadow-xl shadow-black/10`}
          >
            {payState !== "done" ? (
              <div className="p-5">
                <h2 id="pay-dialog-title" className="text-[17px] font-bold" style={{ color: INK }}>
                  {payDue.label}
                </h2>

                <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.06]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-500">{phaseTitle(detail.phaseNo)} budget</span>
                    <span className="text-sm font-medium tabular-nums text-neutral-700">{fmtUSD(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
                    <span className="text-sm text-neutral-500">VAT (5%)</span>
                    <span className="text-sm font-medium tabular-nums text-neutral-700">{fmtUSD(vat)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#4D2FB0]/[0.04] px-4 py-4">
                    <span className="text-sm font-semibold" style={{ color: INK }}>Due today</span>
                    <span className="text-[19px] font-bold tabular-nums" style={{ color: BRAND }}>{fmtUSD(total)}</span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-neutral-500">
                  {phaseTitle(detail.phaseNo)} — {fmtUSD(amount)} deploys across your matched creators,
                  metered against {fmtUSD(amount * detail.guaranteedRoas)} at your guaranteed {detail.guaranteedRoas}×.
                </p>

                <div className="mt-4 rounded-2xl border border-black/[0.06] p-4">
                  <p className="mb-3 text-xs font-medium text-neutral-500">Payment method</p>
                  <div className="flex items-center gap-3 rounded-[14px] bg-[#4D2FB0]/[0.05] p-3 ring-2 ring-[#4D2FB0]">
                    <span aria-hidden="true" className="flex h-9 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#4D2FB0] to-violet-500 text-[10px] font-black tracking-[0.1em] text-white">
                      VISA
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: INK }}>•••• 4629</p>
                      <p className="text-[11px] text-neutral-500">Expires 08/27</p>
                    </div>
                    <CheckCircle size={20} weight="fill" aria-hidden="true" className="text-[#4D2FB0]" />
                  </div>
                </div>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                  <LockSimple size={12} weight="fill" aria-hidden="true" /> Processed securely by Mamo Pay
                </p>

                <button
                  disabled={payState === "processing"}
                  onClick={() => setPayState("processing")}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#4D2FB0] px-4 py-3 text-[13px] font-semibold tabular-nums text-white hover:bg-[#3F2596] disabled:opacity-70 transition-colors">
                  {payState === "processing" ? (
                    <span className="flex items-center gap-2">
                      <CircleNotch size={16} className="animate-spin" aria-hidden="true" /> Processing…
                    </span>
                  ) : (
                    `Fund ${fmtUSD(total)}`
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="h-[84px] w-[84px]">
                  <svg viewBox="0 0 84 84" className="h-full w-full" aria-hidden="true">
                    <circle cx="42" cy="42" r="38" fill="none" stroke="#EDE9FB" strokeWidth="6" />
                    <circle cx="42" cy="42" r="38" fill="none" stroke="url(#ringGrad)" strokeWidth="6"
                      strokeLinecap="round" transform="rotate(-90 42 42)" />
                    {/* Plain stroked check. It used to borrow .wc-check, which
                        the welcome overlay owns — that class parks the stroke
                        at dashoffset 1 under a delayed animation, so the tick
                        never drew here. No CSS dependency now. */}
                    <path d="M29 43l8.5 8.5L56 34" fill="none" stroke="#059669" strokeWidth="5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 id="pay-dialog-title" className="mt-6 text-[19px] font-bold" style={{ color: INK }}>
                  {phaseTitle(detail.phaseNo)} funded
                </h2>
                <p className="mt-1.5 text-xs text-neutral-500">
                  Deploying to matched creators. You&apos;ll get a notification as ads publish.
                </p>
                <button
                  onClick={dismiss}
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#4D2FB0] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#3F2596] transition-colors">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
