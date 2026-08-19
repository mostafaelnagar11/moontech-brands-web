"use client";

/* ------------------------------------------------------------------ */
/* Campaign detail — the web port of the mobile detail route.          */
/*                                                                     */
/* Mobile stacks the money, the ad review, the ledger and the pay CTA  */
/* in one narrow column. A desktop browser has room for two, so the    */
/* left column carries the explanation (money → drafts → ledger) and   */
/* the right rail carries the decision (fund the phase) plus delivery. */
/*                                                                     */
/* Order still matters inside the left column: ad review sits ABOVE    */
/* the phase ledger, because the drafts are the thing that needs you   */
/* today and the ledger is the thing that explains the money.          */
/*                                                                     */
/* The pay flow stays modal — that one IS a confirmation.              */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CaretRight, Check, CheckCircle, CircleNotch, Clock, Lightning,
  List, LockSimple, Plus, SignOut, ThumbsUp, ThumbsDown,
} from "@phosphor-icons/react";
import Sidebar from "../../components/Sidebar";
import NotificationCenter from "../../components/NotificationCenter";
import CommandPalette from "../../components/CommandPalette";
import StatusBadge from "../../components/StatusBadge";
import { adCreator, fmtUSD, PHASE_NAMES, type Campaign } from "../../lib/campaigns";
import { useCampaign, fundPhase } from "../../lib/funding";
import { useAdsFor, useWaitingFor } from "../../lib/adSignals";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";

const CARD = "rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)]";
const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.14em]";

const VAT_RATE = 0.05;
const withVat = (n: number) => n + Math.round(n * VAT_RATE);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const detail = useCampaign(params.id);

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

  const cid   = detail?.id;
  const cname = detail?.name;

  /* The payment SUCCEEDS here, so this is where the phase gets funded.
     Done / Escape / backdrop are pure dismissals — a user who reads the
     receipt and presses Escape has still paid. fundPhase is idempotent
     and the effect bails once payState is "done", so neither the funding
     nor the announcement can fire twice. */
  useEffect(() => {
    if (payState !== "processing" || !cid || !payDue) return;
    const phase = payDue.phase;
    const t = window.setTimeout(() => {
      fundPhase(cid);
      setAnnounce(`Phase ${phase} funded. ${cname} is now live.`);
      setPayState("done");
    }, 1400);
    return () => window.clearTimeout(t);
  }, [payState, payDue, cid, cname]);

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

  /* Three states, not two. A phase funded a second ago is Live with no
     target yet: it has banked money but nothing measured, so it is
     neither `metered` nor `banked`. */
  const pct = detail.revPct;
  const target = detail.revTarget;
  const metered   = pct !== null && target !== null;
  const deploying = pct === null && detail.status === "Live";

  const due = detail.due;
  const amount = payDue?.amount ?? 0;
  const vat = Math.round(amount * VAT_RATE);
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

          <h1 className="text-[15px] font-semibold text-[#191234] shrink-0 truncate">{detail.name}</h1>

          <CommandPalette />

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={() => router.push("/campaigns/new")}
              className="flex items-center gap-2 rounded-xl bg-[#4D2FB0] px-3 sm:px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#3F2596] transition-colors">
              <Plus size={13} weight="bold" />
              <span className="hidden sm:inline">New campaign</span>
            </button>
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
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">
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
                  <span className="ml-auto rounded-full bg-[#F6F4FC] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#4D2FB0]">
                    {detail.roas} ROAS
                  </span>
                </div>

                {metered ? (
                  <>
                    <div className="mt-5 flex items-baseline justify-between gap-2">
                      <p className="text-[34px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                        {fmtUSD(detail.rev)}
                      </p>
                      <p className="text-base font-semibold tabular-nums text-[#4D2FB0]">{pct}%</p>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">of {fmtUSD(target)} phase target</p>
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Revenue against phase target"
                      className="relative mt-3 h-2 rounded-full bg-[#EFEBFA]"
                    >
                      <div className="bar-fill keyline-grad h-full rounded-full"
                        style={{ width: `${pct}%`, "--bd": "0.25s" } as React.CSSProperties} />
                      <span aria-hidden="true" className={`unlock-notch ${pct >= 80 ? "unlock-notch--crossed" : ""}`} />
                    </div>
                    <span className="sr-only">
                      {pct >= 80
                        ? "Past the 80% unlock line."
                        : `${80 - pct} percentage points below the 80% unlock line.`}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-[34px] font-bold leading-none tabular-nums" style={{ color: INK }}>
                      {detail.revLabel}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {deploying ? "revenue so far" : "revenue across completed phases"}
                    </p>
                  </>
                )}
              </section>

              {/* ── Threshold, verbatim from the shared data ── */}
              {detail.threshold && (
                <div className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
                  detail.thresholdGreen ? "bg-[#059669]/[0.08] text-[#047857]" : "bg-amber-50 text-amber-800"
                }`}>
                  <Clock size={16} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                  {detail.threshold}
                </div>
              )}

              {/* ── AD REVIEW — the entry point to the flow ──
                   Built as a card strip, the same shape as a creator's "Last 5
                   posts", because the thing being reviewed is creative and a
                   row of overlapping 40px thumbnails did not let you see any of
                   it. Each card opens the review ON that ad.

                   What the cards do NOT carry is the engagement pair those post
                   cards show. These ads have not published, so a like count
                   would be invented — and per-creator counts are exactly what
                   the design review took off the screen. The badge is the
                   format, and the footer is who made it. */}
              {drafts.length > 0 && (
                <section>
                  {/* No count row. The button underneath already names the
                      number that matters, and the ticks on the cards say which
                      ones are settled — three more figures up here were just
                      the same facts a second time. */}
                  <p className={`${EYEBROW} mb-2 text-[#7C5CE0]`}>Ad review</p>

                  <div className={`${CARD} p-4`}>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[...waiting, ...liked, ...disliked].slice(0, 8).map((a) => {
                        const c = adCreator(a);
                        return (
                          <button
                            key={a.id}
                            onClick={() => router.push(`/campaigns/ads?c=${detail.id}&ad=${a.id}`)}
                            aria-label={`${c.name}, ${a.format} for ${a.platform}. ${
                              a.signal === "none" ? "Waiting on you." : a.signal === "liked" ? "Liked — publishing." : "Disliked — will not publish."
                            } Open the review on this ad.`}
                            className="group relative block aspect-[9/14] w-[132px] shrink-0 overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-black/[0.06] transition hover:ring-2 hover:ring-[#4D2FB0]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.img} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                            <span aria-hidden="true" className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              {a.format}
                            </span>
                            {a.signal !== "none" && (
                              <span
                                aria-hidden="true"
                                className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-white ${
                                  a.signal === "liked" ? "bg-[#059669]" : "bg-black/60"
                                }`}
                              >
                                {a.signal === "liked"
                                  ? <ThumbsUp size={11} weight="fill" />
                                  : <ThumbsDown size={11} weight="fill" />}
                              </span>
                            )}
                            <span className="absolute inset-x-0 bottom-2 px-2.5 text-left">
                              <span className="block truncate text-[12px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
                                {c.name.split(" ")[0]}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => router.push(`/campaigns/ads?c=${detail.id}`)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2.5 text-[13px] font-semibold text-[#4D2FB0] transition-colors hover:bg-neutral-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]/40"
                    >
                      {waiting.length > 0 ? `Review ${waiting.length} waiting on you` : "Open ad review"}
                      <CaretRight size={13} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </section>
              )}

              {/* ── PHASE LEDGER ── */}
              <section>
                <p className={`${EYEBROW} mb-2 text-[#7C5CE0]`}>Phase ledger</p>
                <div className={`${CARD} overflow-hidden`}>
                  {detail.phases.map((p, j) => {
                    const state =
                      p === "Done" ? "Complete"
                        : p === "Active" ? "Live"
                        : due && due.phase === j + 1 ? "Ready to fund"
                        : `Locked until Phase ${j} crosses the 80% unlock line`;
                    const tone =
                      p === "Done" ? "text-[#047857]"
                        : p === "Active" ? "text-amber-700"
                        : due && due.phase === j + 1 ? "text-[#4D2FB0]"
                        : "text-neutral-500";
                    return (
                      <div key={j}
                        className={`flex items-center gap-3 px-5 py-4 ${j > 0 ? "border-t border-black/[0.06]" : ""}`}>
                        <span aria-hidden="true" className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                          p === "Done" ? "bg-[#059669] text-white"
                            : p === "Active" ? "bg-amber-400 text-white"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {p === "Done" ? <Check size={11} weight="bold" /> : j + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold" style={{ color: INK }}>
                            Phase {j + 1} · {PHASE_NAMES[j]}
                          </p>
                          <p className={`mt-0.5 text-xs ${tone}`}>{state}</p>
                          {p === "Active" && metered && (
                            <>
                              <p className="mt-1.5 text-[11px] tabular-nums text-neutral-500">
                                {fmtUSD(detail.rev)} of {fmtUSD(target)}
                              </p>
                              <div className="mt-1 h-1 w-full max-w-[180px] rounded-full bg-[#EFEBFA]">
                                <div className="keyline-grad h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums" style={{ color: INK }}>
                            {fmtUSD(detail.budgets[j])}
                          </p>
                          <p className="text-[11px] text-neutral-500">phase budget</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ══════════════ RIGHT — the decision, then delivery ══════════════ */}
            <div className="min-w-0 space-y-5 xl:sticky xl:top-0 xl:self-start">

              {/* ── The action. It is the primary thing on this page, so on a
                   desktop it sits at the top of the rail, not below the stats. ── */}
              {due ? (
                <section className={`${CARD} p-5`}>
                  <p className={`${EYEBROW} flex items-center gap-1.5 text-[#7C5CE0]`}>
                    <Lightning size={12} weight="fill" aria-hidden="true" />
                    Waiting on you · Phase {due.phase} funding
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: INK }}>{due.reason}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    You only fund the phase about to run.
                  </p>
                  <button
                    onClick={() => { setPayDue(due); setPayOpen(true); setPayState("idle"); }}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#4D2FB0] px-4 py-3 text-[13px] font-semibold tabular-nums text-white hover:bg-[#3F2596] transition-colors">
                    Fund Phase {due.phase} — {fmtUSD(due.amount)}
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
                    Phase {detail.phaseNo} · {detail.phaseName}
                  </p>
                  {/* Peak is the last phase — there is no next one to promise. */}
                  <p className="mt-1 text-xs text-neutral-500">
                    {detail.phaseNo < 3
                      ? "Nothing is waiting on you. The next phase unlocks at 80%."
                      : "Nothing is waiting on you. This is the final phase."}
                  </p>
                  <button
                    onClick={() => router.push("/creators")}
                    className="mt-4 flex w-full items-center justify-center rounded-xl border border-[#4D2FB0]/25 bg-[#4D2FB0]/[0.06] px-4 py-3 text-[13px] font-semibold text-[#4D2FB0] hover:bg-[#4D2FB0]/[0.1] transition-colors">
                    View creators
                  </button>
                </section>
              ) : null}

              {/* ── Delivery rail — two stats, stacked so they can breathe.
                     There used to be a third tile for `detail.content`, but that
                     number is stored, not computed: one campaign holds 89 against
                     125 ads live and another holds 142 against 96. Two different
                     numbers both labelled "ads" is worse than one, so the tile is
                     gone. The field stays in the data, unread here. ── */}
              {detail.adsLive !== null && (
                <section className={`${CARD} overflow-hidden`}>
                  <p className={`${EYEBROW} px-5 pt-4 pb-1 text-neutral-400`}>Delivery</p>
                  {[
                    { k: "Ads live", v: `${detail.adsLive}/${detail.adsTotal}` },
                    { k: "Creators", v: `${detail.creators}` },
                  ].map((m, i) => (
                    <div key={m.k}
                      className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{m.k}</p>
                      <p className="text-[17px] font-semibold tabular-nums" style={{ color: INK }}>{m.v}</p>
                    </div>
                  ))}
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
                  Fund Phase {payDue.phase}
                </h2>

                <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.06]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-500">Phase {payDue.phase} budget</span>
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
                  Phase {payDue.phase} · {detail.name} — {fmtUSD(amount)} deploys across your matched creators.
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
                  Phase {payDue.phase} funded
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
