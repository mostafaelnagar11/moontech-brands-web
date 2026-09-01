"use client";

/* ------------------------------------------------------------------ */
/* Ad review — the desktop review workstation.                          */
/*                                                                     */
/* THESE ADS ARE NOT LIVE. The creator has finished the piece and sent  */
/* it in; nothing posts until the brand reacts. That is the whole       */
/* screen: the creative, large, and two verbs under it.                 */
/*                                                                     */
/* So there are no view counts here — an unpublished ad has not been    */
/* seen by anyone, and a number pretending otherwise would be the one   */
/* lie a reviewer would notice. What we can honestly show before it     */
/* posts is the creator's typical reach, derived from their audience     */
/* and labelled as an estimate.                                        */
/*                                                                     */
/* Like    → it publishes, and more of the phase budget goes behind     */
/*           creative like it.                                          */
/* Dislike → it never posts, and the matcher stops reaching for that    */
/*           pattern. It is the one decision with a second step —       */
/*           a dialog, because a decline can carry a note the CREATOR   */
/*           reads, and talking a brand out of declining its best       */
/*           match is worth one extra click.                            */
/*                                                                     */
/* Doing nothing is not a third verb. A draft nobody judges publishes   */
/* on its own after REVIEW_WINDOW_DAYS days: the phase is metered       */
/* against a guarantee it cannot deliver with work parked in a queue.   */
/* So the countdown sits on the creative it applies to, not in a        */
/* footnote — neutral until it is nearly gone, then red.                */
/*                                                                     */
/* WHY THIS IS NOT THE MOBILE REEL. On a phone the three automatic      */
/* checks hide behind an ⓘ, because a card on a full-bleed surface      */
/* would cover the thing being judged. A desktop viewport has room       */
/* beside the creative, so the checks and the whole queue live in a      */
/* permanent right rail: the reviewer sees what was verified and how     */
/* much work is left without moving anything. The rail collapses below   */
/* lg, and the ⓘ comes back in the top bar so small viewports still     */
/* reach the checks.                                                    */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  ArrowLeft, CaretLeft, CaretRight, Check, Info,
  ThumbsDown, ThumbsUp, Warning, X,
  InstagramLogo, TiktokLogo, YoutubeLogo, type Icon,
} from "@phosphor-icons/react";
import {
  CAMPAIGNS, HIGH_FIT, REVIEW_WINDOW_DAYS, adChecks, adCreator, adHero, adsFor,
  DECLINE_REASONS, declineReasonLabel, draftDaysLeft, fmtUSD, livePhase, phaseTitle,
  type Ad, type AdSignal, type Platform,
} from "../../lib/campaigns";
import { setAdSignal, useAdFeedback, useAdsFor, type AdFeedback } from "../../lib/adSignals";
import { useActiveBrandId } from "../../lib/brand";
import { useCampaign, useRoster } from "../../lib/funding";

const BRAND = "#4D2FB0";
const BRAND_HOVER = "#3F2596";
const INK = "#191234";
/* Long enough for a real reason, short enough to be read. The cap is the
   creator's attention, not a storage limit. */
const NOTE_MAX = 280;

/* ------------------------------------------------------------------ */
/* TWO FLOWS, ONE ROUTE — and they do not cross.                       */
/*                                                                     */
/* AD REVIEW is the work: drafts still waiting, and the ones declined   */
/* (a decline is reversible, so it stays reachable from here). It has   */
/* NO access to the liked shelf.                                        */
/*                                                                     */
/* LIVE ADS is the record: liked drafts, which is to say the ones       */
/* publishing. It has NO access to waiting or declined.                 */
/*                                                                     */
/* A like therefore MOVES an ad out of this flow and into the other —   */
/* which is exactly what a like does in the product. The undo toast is  */
/* how it comes back, not a tab.                                        */
/* ------------------------------------------------------------------ */
type Flow = "review" | "live";

const FLOW_TABS: Record<Flow, { key: AdSignal; label: string }[]> = {
  review: [
    { key: "none",     label: "Waiting" },
    { key: "disliked", label: "Disliked" },
  ],
  live: [
    { key: "liked",    label: "Live" },
  ],
};

const FLOW_TITLE: Record<Flow, string> = { review: "Ad review", live: "Live ads" };

const PLAT_ICON: Record<Platform, Icon> = {
  Instagram: InstagramLogo,
  TikTok: TiktokLogo,
  YouTube: YoutubeLogo,
};

/* `noted` means the decline carried something for the creator — reasons,
   a note, or both. It is what decides whether the receipt promises them an
   explanation or tells them none was given. */
type Toast = { key: number; id: string; name: string; to: AdSignal; from: AdSignal; noted: boolean };

export default function CampaignAdsPage() {
  const router = useRouter();

  /* The active brand's ladder, and the one phase of it that is RUNNING —
     phases run in sequence, so there is at most one. The no-param fallback
     below opens it, and it is read through a ref because that effect runs
     once on mount, before a brand switch could change the answer. */
  const brandId = useActiveBrandId();
  const roster = useRoster();
  const live = livePhase(brandId, roster);
  const liveRef = useRef(live);
  liveRef.current = live;

  /* ?c= is read in an effect, exactly as app/campaigns/page.tsx does, so
     this route never needs a Suspense boundary. `resolved` separates "the
     effect has not run yet" (skeleton) from "the effect ran and found no
     campaign to review" (the real empty state) — without it an unknown id
     would sit under a loading shimmer forever. */
  const [cid, setCid] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [sel, setSel] = useState(0);
  /* Which shelf the reviewer is standing on. Keyed by the signal value itself
     so the filter is a comparison rather than a lookup table. */
  const [tab, setTab] = useState<AdSignal>("none");
  /* Which flow this page was entered on. Set once from ?shelf= — the two
     never mix, so nothing in the UI can switch it. */
  const [flow, setFlow] = useState<Flow>("review");
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [announce, setAnnounce] = useState("");
  /* The decline being confirmed. It carries the ad AND the index it was
     started from, because the click that confirms it happens a render later
     and `sel` may have moved by then — `rate` needs the index it acts on. */
  const [decline, setDecline] = useState<{ ad: Ad; i: number } | null>(null);
  const [note, setNote] = useState("");
  /* Reason ids, not free text: the creator gets something to act on, and a
     decline stays measured against the brief both sides agreed to. */
  const [reasons, setReasons] = useState<readonly string[]>([]);
  const toggleReason = useCallback((id: string) => {
    setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }, []);

  const toastTimer = useRef<number | undefined>(undefined);
  const declineBox = useRef<HTMLDivElement | null>(null);
  const noteBox = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* ?shelf= opens the reviewer on a specific shelf, so the phase detail can
       send "Live ads" to the liked work and "Ad review" to the queue. An
       unknown or absent value keeps the default (Waiting), which is the only
       shelf with work on it. */
    const shelf = params.get("shelf");
    if (shelf === "liked") { setFlow("live"); setTab("liked"); }
    else if (shelf === "disliked") setTab("disliked");
    const q = params.get("c");
    /* An UNKNOWN ?c= resolves to nothing. It must never fall back to another
       phase: silently substituting one means a reviewer rates Phase 3's
       creative believing it belongs to the phase they asked for, and a like
       publishes it. A KNOWN id is honoured whichever brand's ladder it sits
       on, so a deep link stays valid across a brand switch.

       No id at all is a different case — the route was opened without
       context, so we open the active brand's LIVE phase: drafts are cut for
       whatever is running, and only one phase runs at a time. Taking "the
       first phase that has drafts" instead used to reach past this brand
       into another one's ladder, which no screen may do. */
    const id = q
      ? (CAMPAIGNS.some((c) => c.id === q) ? q : null)
      : liveRef.current?.id ?? null;
    setCid(id);
    setResolved(true);

    /* ?ad= — the detail page's card strip opens the review ON the card that was
       clicked, which may sit on any shelf. Resolve it against the seed data
       (the store has no overrides yet on a cold load) so the tab and the index
       are right on first paint rather than after a flash of the Waiting shelf. */
    const wanted = new URLSearchParams(window.location.search).get("ad");
    if (!id || !wanted) return;
    const rows = adsFor(id);
    const target = rows.find((a) => a.id === wanted);
    if (!target) return;
    setTab(target.signal);
    setSel(Math.max(0, rows.filter((a) => a.signal === target.signal).findIndex((a) => a.id === wanted)));
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* The decisions live in the shared store, so the list is DERIVED — liking
     every draft and walking back to the campaign leaves it agreeing that
     nothing is waiting. Local state below is view-only. */
  const ads = useAdsFor(cid ?? "");

  /* Derived means a fresh array identity every render, so callbacks read the
     latest rows through a ref instead of closing over them — that keeps
     `rate`/`go`/the key handler stable and never one render stale. */
  /* The tab is a FILTER, and `sel` indexes the filtered list — never `ads`.
     One rule makes the whole screen predictable: a decision removes the ad
     from the shelf you are standing on (waiting -> liked, liked -> disliked),
     so `sel` stays where it is and the next ad slides under it, the way an
     inbox behaves. The clamp below is what stops that walking off the end. */
  const shown = ads.filter((a) => a.signal === tab);
  const counts = {
    none: ads.filter((a) => a.signal === "none").length,
    liked: ads.filter((a) => a.signal === "liked").length,
    disliked: ads.filter((a) => a.signal === "disliked").length,
  };

  const adsRef = useRef<Ad[]>(shown);
  adsRef.current = shown;
  const allRef = useRef<Ad[]>(ads);
  allRef.current = ads;
  const tabRef = useRef<AdSignal>(tab);
  tabRef.current = tab;

  useEffect(() => {
    if (sel > 0 && sel >= shown.length) setSel(Math.max(0, shown.length - 1));
  }, [shown.length, sel]);

  /* Warm the next hero so navigation never lands on a grey box. Keyed on the
     image URL, not the array, since the array is rebuilt each render. */
  const nextImg = shown[sel + 1]?.img;
  useEffect(() => {
    if (!nextImg) return;
    const im = new window.Image();
    im.src = adHero(nextImg);
  }, [nextImg]);

  const ad: Ad | null = shown[sel] ?? null;
  const creator = ad ? adCreator(ad) : null;
  /* Funding applied and looked up across brands, so a phase funded on the
     detail route reads back with the budget it is actually spending. */
  const campaign = useCampaign(cid ?? "") ?? null;
  /* What the brand told this creator, if anything. Read for every ad — a
     hook cannot be called conditionally — and shown only on the decided
     shelves, where a brand comes back asking what it actually sent. */
  const stageFeedback = useAdFeedback(ad?.id ?? "");

  const go = useCallback((i: number) => {
    setSel((s) => (i < 0 || i >= adsRef.current.length ? s : i));
  }, []);

  const back = useCallback(() => {
    router.push(cid ? `/campaigns/${cid}` : "/campaigns");
  }, [router, cid]);

  /* Takes the ad it acts on, because a queue row can rate an ad that is
     not the one on the stage — there is no single "current" to infer.
     `feedback` only ever arrives with a decline, and it is the one thing on
     this screen a person outside the company reads. Every path still lands
     here, so the announcement and the undo receipt stay in one place. */
  const rate = useCallback((a: Ad, i: number, to: "liked" | "disliked", feedback?: AdFeedback) => {
    const c = adCreator(a);
    const from = a.signal;
    const noted = !!feedback && (feedback.reasons.length > 0 || feedback.note.trim().length > 0);
    setAdSignal(a.id, to, feedback);

    /* Where to go next is computed from the list WITH this decision applied —
       reading the rows we rendered from would hand the reviewer back the ad
       they just rated. */
    const after = allRef.current.map((r) => (r.id === a.id ? { ...r, signal: to } : r));

    window.clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), id: a.id, name: c.name, to, from, noted });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);

    /* The rated ad leaves this shelf, so holding `sel` still lands on the ad
       that took its place. `remaining` is counted from the list WITH the
       decision applied — reading the rendered rows would announce a number
       that is one render stale. */
    const remaining = after.filter((r) => r.signal === tabRef.current).length;
    if (i >= remaining) setSel(Math.max(0, remaining - 1));

    setAnnounce(
      (to === "liked"
        ? `Liked. ${c.name}'s ad publishes within the hour and more of this phase's budget goes behind ads like it.`
        : `Disliked. This ad will not publish, and we stop matching ads like it.${
            noted ? ` Your reasons go to ${c.name}.` : ` ${c.name} is told it will not run, with no reason given.`
          }`) +
      (remaining === 0
        ? " That is the last one on this shelf."
        : ` ${remaining} left here.`)
    );
  }, []);

  const undo = useCallback(() => {
    if (!toast) return;
    window.clearTimeout(toastTimer.current);
    setAdSignal(toast.id, toast.from);
    /* The ad returns to whichever shelf it came from, which is usually not the
       one being looked at — so follow it, or the undo appears to do nothing. */
    const restored = allRef.current
      .map((r) => (r.id === toast.id ? { ...r, signal: toast.from } : r))
      .filter((r) => r.signal === toast.from);
    setTab(toast.from);
    const i = restored.findIndex((r) => r.id === toast.id);
    setSel(i >= 0 ? i : 0);
    setAnnounce(
      toast.from === "none"
        ? "Decision removed. The ad is waiting on you again."
        : "Decision changed back."
    );
    setToast(null);
  }, [toast]);

  /* ── The decline, in two steps ──
     Every route to "disliked" comes through here — the verb row, the flip on
     an already-liked ad, and the D shortcut — so neither the confirmation nor
     the note can be skipped by reaching for the keyboard instead. A like is
     still one click: it costs nothing to be wrong about, and it is the
     decision the queue exists to collect. */
  const askDecline = useCallback((a: Ad, i: number) => {
    setNote("");
    setReasons([]);
    setDecline({ ad: a, i });
  }, []);

  /* Cancel. Escape and the scrim both land here, and neither may decline —
     the whole point of the dialog is that this button is the easy one. */
  const closeDecline = useCallback(() => {
    setDecline(null);
    setNote("");
    setReasons([]);
  }, []);

  /* At least one reason is required. The note is not: reasons are the
     mechanism — they tell the creator what to change — and free text on
     top of them is the exception, not the ask. */
  const canDecline = reasons.length > 0;

  const confirmDecline = useCallback(() => {
    if (!decline || reasons.length === 0) return;
    rate(decline.ad, decline.i, "disliked", { reasons, note });
    setDecline(null);
    setNote("");
    setReasons([]);
  }, [decline, note, reasons, rate]);

  /* Focus trap, autofocus and focus restore for the decline dialog.
     The trap is not decoration here: a Tab that escaped the card would land
     on the Like button sitting behind the scrim — the one click this dialog
     exists to slow down. The element to restore to is read BEFORE focus
     moves into the textarea, and only restored if it is still in the
     document: the button that opened this often becomes a different button
     once the decision lands. */
  useEffect(() => {
    const box = declineBox.current;
    if (!decline || !box) return;
    const restore = document.activeElement as HTMLElement | null;
    noteBox.current?.focus();

    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !box) return;
      const stops = Array.from(
        box.querySelectorAll<HTMLElement>("textarea, button:not([disabled])")
      );
      if (stops.length === 0) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const at = document.activeElement;
      if (!box.contains(at)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", onTab);
    return () => {
      window.removeEventListener("keydown", onTab);
      if (restore && document.body.contains(restore)) restore.focus();
    };
  }, [decline]);

  /* ── Keyboard — the affordance a desktop reviewer expects ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      /* The decline dialog owns the keyboard while it is up, and it has to
         own it BEFORE the field guard below: Escape must cancel even from
         inside the textarea, and nothing else may reach an ad the reviewer
         is halfway through declining. Escape here CANCELS — it never
         declines. */
      if (decline) {
        if (e.key === "Escape") { e.preventDefault(); closeDecline(); }
        return;
      }

      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      /* The checks modal owns the keyboard while it is up: Escape closes it
         rather than leaving the route, and a stray L does not rate an ad the
         reviewer cannot currently see. */
      if (infoOpen) {
        if (e.key === "Escape") { e.preventDefault(); setInfoOpen(false); }
        return;
      }

      if (e.key === "Escape") { e.preventDefault(); back(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(sel + 1); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(sel - 1); return; }

      const k = e.key.toLowerCase();
      if (k === "u") { e.preventDefault(); undo(); return; }
      const cur = adsRef.current[sel];
      if (!cur) return;
      if (k === "l") { e.preventDefault(); rate(cur, sel, "liked"); }
      /* Not on a liked ad: the verb row no longer offers it, and a
         shortcut that still did would be the one way to un-publish. */
      else if (k === "d" && cur.signal !== "liked") { e.preventDefault(); askDecline(cur, sel); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, infoOpen, decline, go, rate, undo, back, askDecline, closeDecline]);

  /* ------------------------------------------------------------------ */
  /* Chrome shared by every state                                        */
  /* ------------------------------------------------------------------ */
  /* This route is a deliberate focus mode — no sidebar, no notifications, no
     palette — so the way OUT has to be spelled out rather than implied by a
     bare arrow: the button names its destination, the hint chip lists Esc,
     and a second link reaches the roster so no state is a dead end. */
  const TopBar = ({ children }: { children?: React.ReactNode }) => (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
      <button
        onClick={back}
        aria-label={campaign ? `Back to ${phaseTitle(campaign.phaseNo)}` : "Back to all campaigns"}
        className="flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden="true" className="shrink-0" />
        <span className="max-w-[190px] truncate text-[12.5px] font-semibold">
          Back to {campaign ? phaseTitle(campaign.phaseNo) : "campaigns"}
        </span>
      </button>
      <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" />
      <div className="hidden min-w-0 shrink-0 sm:block">
        <p className="text-[15px] font-semibold leading-tight text-white">{FLOW_TITLE[flow]}</p>
        {/* The back link already names the phase, so repeating it here said
            nothing twice. This carries the fact a like actually spends
            against: THIS phase's budget, which is the only budget behind
            anything published from this queue. */}
        <p className="truncate text-[11px] leading-tight text-white/50">
          {campaign ? `${fmtUSD(campaign.budget)} phase budget` : "No phase selected"}
        </p>
      </div>
      {children}
    </header>
  );

  /* Shown beside the hint chip, and in the empty state's own bar. */
  const AllCampaignsLink = () => (
    <Link
      href="/campaigns"
      className="hidden shrink-0 rounded-xl px-2.5 py-1.5 text-[11.5px] font-semibold text-white/60 underline decoration-white/25 underline-offset-[3px] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:block"
    >
      All campaigns
    </Link>
  );

  /* ── Resolving, the unknown-campaign state, and the real empty state ── */
  /* The hard empty state is for a campaign with NO ads. An empty SHELF is not
     this: it keeps the whole chrome, because a reviewer who lands on an empty
     Disliked tab needs the tabs to get back out. */
  if (!resolved || !cid || ads.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-neutral-950"
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <TopBar>
          <span className="ml-auto flex items-center">
            <AllCampaignsLink />
          </span>
        </TopBar>
        {!resolved ? (
          <div className="min-h-0 flex-1 p-6">
            <div aria-hidden="true" className="h-full rounded-2xl bg-white/[0.04]" />
          </div>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-2xl font-bold text-white">
              {cid ? "Nothing waiting on you" : "We can't find that phase"}
            </p>
            <p className="mt-2 max-w-[440px] text-sm leading-relaxed text-white/60">
              {cid ? (
                <>
                  {campaign ? `${phaseTitle(campaign.phaseNo)} has` : "This phase has"} no ads to
                  review. New ads land here the moment a creator finishes one.
                </>
              ) : (
                <>
                  This link points at a phase we can&apos;t find, so there are no ads to review.
                  Open the phase you meant from your campaigns and we&apos;ll show the drafts
                  waiting on it.
                </>
              )}
            </p>
            <button
              onClick={back}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {cid ? "Back to phase" : "All campaigns"}
            </button>
          </main>
        )}
      </div>
    );
  }

  const checks = ad ? adChecks(ad) : [];
  const flagged = checks.some((c) => !c.clean);
  /* An empty shelf has no ad, so this cannot be read at the top level the way
     it was before the tabs existed — that is what crashed the Liked shelf the
     moment its last ad was flipped away. Falls back to a real component so it
     stays a valid JSX type; the stage that renders it is behind a guard. */
  const PIcon = PLAT_ICON[ad?.platform ?? "Instagram"];
  const atStart = sel === 0;
  const atEnd = sel === shown.length - 1;

  /* The review window, for the draft on the stage and for the one being
     declined. `null` means the submitted string did not parse, and then
     NOTHING is rendered: a guessed deadline on a screen that publishes by
     itself would be the single most expensive wrong number here. */
  const daysLeft = ad && ad.signal === "none" ? draftDaysLeft(ad.submitted) : null;
  const dAd = decline?.ad ?? null;
  const dCreator = dAd ? adCreator(dAd) : null;
  /* At or above HIGH_FIT the matcher rated this person a strong fit, so the
     dialog leads with that instead of the reason box. Below it, the same
     framing on every decline would be crying wolf. */
  const dStrong = dCreator ? dCreator.fit >= HIGH_FIT : false;

  /* The three checks — same rows in the rail and in the small-viewport modal,
     so the two can never drift apart. */
  const CheckRows = ({ dark }: { dark: boolean }) => (
    <div className={dark ? "space-y-2" : "overflow-hidden rounded-2xl bg-white"}>
      {checks.map((c, i) => (
        <div
          key={c.label}
          className={
            dark
              ? "flex items-start gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10"
              : `flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-black/[0.06]" : ""}`
          }
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${
              c.clean ? "bg-[#059669]" : "bg-[#D70015]/[0.07]0"
            }`}
          >
            {c.clean ? <Check size={12} weight="bold" /> : <Warning size={12} weight="fill" />}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block text-[12.5px] font-semibold leading-snug ${dark ? "text-white" : ""}`}
              style={dark ? undefined : { color: INK }}
            >
              {c.label}
            </span>
            <span className={`mt-0.5 block text-[11.5px] leading-snug ${dark ? "text-white/55" : "text-neutral-500"}`}>
              {c.detail}
            </span>
          </span>
        </div>
      ))}
    </div>
  );

  /* What the brand actually sent, echoed back on the decided shelves. A
     decision has to be auditable after the fact — the Liked and Disliked
     shelves are where a brand returns to ask what a creator was told, and the
     note is the only part of that the creative does not carry. It renders in
     the rail AND inside the ⓘ, because below lg the ⓘ *is* the rail: without
     the second copy the audit trail would vanish at 1023px. A like clears the
     note in the store, so in practice this is the Disliked shelf. */
  const NoteBack = ({ dark }: { dark: boolean }) => {
    if (!ad || !creator || ad.signal === "none" || !stageFeedback) return null;
    const { reasons: sent, note: extra } = stageFeedback;
    return (
      <div className={dark ? "shrink-0 border-t border-white/10 p-4" : "mt-3 rounded-2xl bg-white p-4"}>
        <h2
          className={`text-[13px] font-semibold ${dark ? "text-white" : ""}`}
          style={dark ? undefined : { color: INK }}
        >
          Sent to {creator.name}
        </h2>
        {/* The reasons are the audit trail. A brand coming back to ask what
            it actually told a creator needs the checkboxes, not just the
            free text — the free text was the optional part. */}
        {sent.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {sent.map((id) => (
              <li
                key={id}
                className={`flex items-start gap-2 text-[12px] leading-snug ${
                  dark ? "text-white/75" : "text-neutral-600"
                }`}
              >
                <Check
                  size={12}
                  weight="bold"
                  aria-hidden="true"
                  className={`mt-1 shrink-0 ${dark ? "text-white/40" : "text-neutral-400"}`}
                />
                {declineReasonLabel(id)}
              </li>
            ))}
          </ul>
        )}
        {extra && (
          <p
            className={
              dark
                ? "mt-2.5 rounded-xl bg-white/[0.04] p-3 text-[12px] leading-relaxed text-white/75 ring-1 ring-white/10"
                : "mt-2.5 rounded-xl bg-[#fafafa] p-3 text-[12px] leading-relaxed text-neutral-600"
            }
          >
            &ldquo;{extra}&rdquo;
          </p>
        )}
        <p className={`mt-2 text-[11px] leading-snug ${dark ? "text-white/40" : "text-neutral-500"}`}>
          Sent word for word with the decision.
        </p>
      </div>
    );
  };

  /* Flow-aware: the review copy explains the two verbs, which is the whole
     job there. Live ads has no verbs — the like already happened — so
     explaining Dislike in that flow described a control that is not on the
     screen. There it says what the checks meant for work that shipped. */
  const explainer = flow === "live" ? (
    <>
      These three ran on every ad before it reached you, so publishing was one
      click rather than a review meeting. Everything here is live and spending
      this phase&apos;s budget — a like cannot be pulled back.
    </>
  ) : (
    <>
      These three run on every ad before it reaches you, so a like is one click
      rather than a review meeting. Nothing here has published yet: Like publishes it and
      puts more of this phase&apos;s budget behind ads like it, Dislike keeps it
      from publishing and stops us matching its pattern.
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <div aria-live="polite" role="status" className="sr-only">{announce}</div>

      {/* ── 1 · TOP BAR ── */}
      <TopBar>
        <p className="mx-auto shrink-0 text-center text-[12px] font-medium tabular-nums text-white/70">
          {shown.length === 0 ? "Nothing here" : `${sel + 1} of ${shown.length}`}
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* ── THE THREE SHELVES ──
               Same three words and the same pill idiom the creators screen
               already uses, adapted to this dark bar. The counts live on the
               pills, which is why the counter beside them carries position
               only. They sit where "All campaigns" and the keyboard legend
               used to: the top-left back link is already the way out, and the
               shortcuts still work without a chip announcing them. */}
          {/* A single-shelf flow gets no tablist — one tab is a label, not a
              choice. Live ads shows its count instead; the title already
              names it. */}
          {FLOW_TABS[flow].length > 1 ? (
          <div role="tablist" aria-label={`${FLOW_TITLE[flow]} shelves`} className="flex items-center gap-1 rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10">
            {FLOW_TABS[flow].map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => { setTab(t.key); setSel(0); }}
                  className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    on ? "bg-white text-neutral-900" : "text-white/60 hover:text-white"
                  }`}
                >
                  {t.label}
                  <span className={`tabular-nums ${on ? "text-neutral-400" : "text-white/35"}`}>
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
          ) : (
            /* One shelf: state the count plainly where the tabs would be. */
            <span className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 text-[12.5px] font-semibold text-white/70 ring-1 ring-white/10">
              {FLOW_TABS[flow][0].label}
              <span className="tabular-nums text-white/35">{counts[FLOW_TABS[flow][0].key]}</span>
            </span>
          )}

          {/* The rail carries the checks on wide viewports; below lg they
              come back behind the ⓘ, as on the phone. */}
          <button
            onClick={() => setInfoOpen(true)}
            aria-label={flagged
              ? "What we checked before this reached you — one advisory logged"
              : "What we checked before this reached you"}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
          >
            <Info size={19} weight="fill" />
            <span
              aria-hidden="true"
              className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-neutral-950 ${
                flagged ? "bg-[#D70015]" : "bg-[#34C759]"
              }`}
            />
          </button>
        </div>
      </TopBar>

      <div className="flex min-h-0 flex-1">
        {/* ── 2 · CENTER STAGE ── */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {!ad || !creator ? (
            <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-xl font-bold text-white">
                {tab === "none" ? "Nothing waiting on you"
                  : tab === "liked" ? "No likes yet"
                  : "No dislikes yet"}
              </p>
              <p className="mt-2 max-w-[420px] text-sm leading-relaxed text-white/55">
                {tab === "none" ? "Every draft here has been decided. New ones land the moment a creator finishes them."
                  : tab === "liked" ? "Nothing from this phase is live yet. Ads you like in Ad review publish within the hour and collect here."
                  : "Drafts you decline never publish. They collect here so you can change your mind."}
              </p>
              {/* Only inside the review flow. Live ads has no route to the
                  waiting shelf, so offering one would be a dead end. */}
              {flow === "review" && counts.none > 0 && tab !== "none" && (
                <button
                  onClick={() => { setTab("none"); setSel(0); }}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {counts.none} waiting on you
                </button>
              )}
            </main>
          ) : (
          <>
          <section
            aria-label={`Ad ${sel + 1} of ${shown.length}. ${creator.name}, ${ad.format} for ${ad.platform}. ${
              ad.signal === "liked"
                ? "Liked — publishing."
                : ad.signal === "disliked"
                  ? "Disliked — will not publish."
                  : daysLeft !== null
                    ? `Waiting on you. Publishes on its own in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} if you do not decide.`
                    : "Waiting on you."
            }`}
            className="relative min-h-0 flex-1"
          >
            {/* Mouse users get the same movement the arrow keys give. */}
            <button
              onClick={() => go(sel - 1)}
              disabled={atStart}
              aria-label="Previous ad"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              onClick={() => go(sel + 1)}
              disabled={atEnd}
              aria-label="Next ad"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <CaretRight size={18} weight="bold" />
            </button>

            {/* The box shrink-wraps the photograph, because the caption is
                anchored to the box and any letterbox inside it would float the
                caption off the bottom of the creative. The image is capped in
                LENGTHS, not percentages, so a replaced element scales itself
                correctly on whichever axis binds: 212px = the 60px top bar +
                the 112px verb row + this container's 40px of padding. */}
            <div className="flex h-full items-center justify-center px-16 py-5">
              <div key={ad.id} className="animate-fade-in relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={adHero(ad.img)}
                  alt={`Still from ${creator.name}'s ${ad.format.toLowerCase()} reviewing the ${ad.product}`}
                  decoding="async"
                  className="block max-h-[calc(100vh-264px)] max-w-full rounded-2xl bg-white/[0.04] object-contain shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
                />

                {/* NO PILLS ON THE CREATIVE.

                    All three said something the screen already says: the
                    shelf you are standing on names Waiting / Liked /
                    Disliked, the top-bar tabs carry the counts, and the verb
                    row says a liked ad has gone to publish. A green
                    "Publishing" badge, a black "Not publishing" kill mark
                    and a countdown stacked on top of that were three
                    receipts for one fact, printed over the one thing the
                    reviewer is here to look at.

                    The review window is still stated — once, in the line
                    under the verbs, and again on the phase detail. It is a
                    policy about every draft, not a property of this image. */}

                {/* The identity, the caption and the honest meta line — on the
                    media, over a scrim, every string carrying .ad-shadow. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-20">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator.avatar}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-full bg-neutral-700 object-cover ring-2 ring-white/70"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="ad-shadow block truncate text-[14px] font-semibold text-white">
                        {creator.name}
                      </span>
                      <span className="ad-shadow block truncate text-[11px] font-medium text-white/80">
                        {creator.handle}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        <PIcon size={11} weight="fill" aria-hidden="true" /> {ad.platform}
                      </span>
                      <span className="flex items-center rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                        {ad.format}
                      </span>
                    </span>
                  </div>

                  <p className="ad-shadow mt-3 text-[14px] font-medium leading-snug text-white">
                    {ad.caption}
                  </p>

                  {/* No view count. Nothing here has posted. */}
                  <p className="ad-shadow mt-2 text-[11px] font-medium text-white/70">
                    {ad.product}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── The two verbs ── */}
          {/* A fixed 112px so the stage's own height is deterministic — the
              image cap above is written against it. */}
          {/* HEIGHT IS COUPLED to the image cap below (max-h-[calc(100vh-264px)]).
              264 = this row + the top bar and its padding. The window notice
              was added inside this row without growing it, so it sat flush on
              the viewport edge and read as cut off. Change one of these two
              numbers and you must change the other. pb-5 keeps the notice off
              the bottom edge. */}
          <div className="flex h-[164px] shrink-0 flex-col justify-center border-t border-white/10 px-6 pb-5">
            <div className="mx-auto flex w-full max-w-[460px] items-stretch gap-3">
              {ad.signal === "none" ? (
                <>
                  <button
                    onClick={() => askDecline(ad, sel)}
                    aria-label={`Dislike ${creator.name}'s ad. Opens a dialog to confirm and leave a reason.`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3.5 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    <ThumbsDown size={18} weight="fill" aria-hidden="true" /> Dislike
                  </button>
                  <button
                    onClick={() => rate(ad, sel, "liked")}
                    aria-label={`Like ${creator.name}'s ad. It publishes within the hour.`}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BRAND_HOVER; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BRAND; }}
                    style={{ backgroundColor: BRAND }}
                    className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  >
                    <ThumbsUp size={18} weight="fill" aria-hidden="true" /> Like
                  </button>
                </>
              ) : ad.signal === "liked" ? (
                /* A liked ad has already gone to publish, so there is
                   nothing to reverse and no button here. The asymmetry is
                   the point: a DISLIKED ad never published, so it can still
                   be liked, while "dislike instead" on a live ad would
                   promise an un-publish the product cannot do. The row keeps
                   its fixed height — the stage's image cap is written
                   against it — and says why it is empty. */
                <p className="flex flex-1 items-center justify-center text-center text-[13px] leading-snug text-white/45">
                  Already sent to publish — a like can&apos;t be pulled back.
                </p>
              ) : (
                /* Disliked, and it never published, so it is still likeable.
                   One button, no state pill: the shelf you are standing on
                   names the state, and the creative carries its own pill. */
                <button
                  onClick={() => rate(ad, sel, "liked")}
                  aria-label={`Like ${creator.name}'s ad instead. It publishes within the hour.`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3.5 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  <ThumbsUp size={18} weight="fill" aria-hidden="true" /> Like instead
                </button>
              )}
            </div>
            {/* THE WINDOW, GIVEN WEIGHT.
                This was 11px grey centred text and it is the one consequence
                on the screen that lands whether the brand acts or not: ignore
                the queue and the draft publishes anyway. It is also specific
                to the draft on screen — daysLeft, not the policy — because
                "10 days" as a house rule is background, while "this one goes
                live in 10 days" is a decision.

                Red only inside the last two days, per the one-red rule:
                before that it is a standing term, not an alert. */}
            {ad.signal === "none" && (
              <div className="mt-3 flex justify-center">
                <span
                  className={`inline-flex max-w-[560px] items-start gap-2 rounded-xl px-3.5 py-2.5 text-left ring-1 ${
                    daysLeft !== null && daysLeft <= 2
                      ? "bg-[#D70015]/[0.14] text-white ring-[#D70015]/50"
                      : "bg-white/[0.07] text-white/80 ring-white/15"
                  }`}
                >
                  <Clock size={15} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                  <span className="text-[12.5px] font-semibold leading-snug">
                    {daysLeft === null
                      ? `Undecided drafts publish on their own after ${REVIEW_WINDOW_DAYS} days.`
                      : daysLeft === 0
                        ? "This draft publishes today unless you decide."
                        : `This draft publishes on its own in ${daysLeft} ${daysLeft === 1 ? "day" : "days"} unless you decide.`}
                    <span className="ml-1 font-medium text-white/50">
                      A phase can&apos;t hit its guarantee with work sitting in a queue.
                    </span>
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* ── Undo receipt — inside the stage column so it centres on the
                 creative rather than on the viewport, and sits ABOVE the verb
                 row rather than covering the two buttons. ── */}
          {toast && (
            <div key={toast.key} className="pointer-events-none absolute inset-x-0 bottom-[132px] z-30 flex justify-center px-4">
              <div className="undo-toast pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl bg-black/85 p-3 text-white ring-1 ring-white/15 backdrop-blur-xl">
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    toast.to === "liked" ? "bg-[#059669]" : "bg-white/15"
                  }`}
                >
                  {toast.to === "liked"
                    ? <ThumbsUp size={14} weight="fill" />
                    : <ThumbsDown size={14} weight="fill" />}
                </span>
                <p className="min-w-0 flex-1 text-[12.5px] font-medium">
                  {toast.to === "liked"
                    ? `${toast.name}'s ad publishes within the hour.`
                    : `${toast.name}'s ad will not publish.${toast.noted ? " Your reasons go with it." : ""}`}
                </p>
                <button
                  onClick={undo}
                  className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Undo
                </button>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* ── 3 · RIGHT RAIL — the checks. The queue list that used to sit
                 below them is gone: the tabs name every shelf, the arrows and
                 the counter carry position, and a 6-row list of the same
                 thumbnails already on the stage was the third thing on screen
                 saying where you are. ── */}
        <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-white/10 lg:flex">
          <div className={`shrink-0 p-4 ${ad ? "" : "hidden"}`}>
            <h2 className="text-[13px] font-semibold text-white">Checked before it reached you</h2>
            <div className="mt-3">
              <CheckRows dark />
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/45">{explainer}</p>
          </div>

          <NoteBack dark />
        </aside>
      </div>

      {/* ── ⓘ — the checks, for viewports too narrow for the rail ── */}
      {infoOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checked before it reached you"
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 lg:hidden"
          onClick={() => setInfoOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in w-full max-w-[480px] rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold" style={{ color: INK }}>
                Checked before it reached you
              </h2>
              <button
                onClick={() => setInfoOpen(false)}
                aria-label="Close"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-600"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <CheckRows dark={false} />
            <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-neutral-500">{explainer}</p>
            <NoteBack dark={false} />
          </div>
        </div>
      )}

      {/* ── THE DECLINE ──
             The only two-step decision on the screen, and it earns the step
             three times over: a strong match is worth a second look, the
             reason is written to a person, and the reviewer has to know that
             before typing rather than after sending. Confirm is one button,
             Cancel is the other, and Escape is Cancel — the easy exit is the
             one that does not decline. ── */}
      {decline && dAd && dCreator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div aria-hidden="true" onClick={closeDecline} className="absolute inset-0" />
          <div
            ref={declineBox}
            role="dialog"
            aria-modal="true"
            aria-labelledby="decline-title"
            className="animate-fade-in relative max-h-full w-full max-w-[500px] overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
          >
            <h2 id="decline-title" className="pr-9 text-[17px] font-bold" style={{ color: INK }}>
              Why is this not right?
            </h2>
            {/* The disclosure lives in the subtitle, where it also earns its
                place: the creator seeing the reason is the POINT of asking
                for one, not a warning bolted on beside the field. */}
            <p className="mt-1 pr-9 text-[12.5px] leading-snug text-neutral-500">
              {dCreator.name} sees your reason, so they know what to change.
            </p>
            <button
              onClick={closeDecline}
              aria-label="Cancel, keep this ad waiting on you"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
            >
              <X size={16} weight="bold" />
            </button>

            {/* The fit is CONTEXT, not the headline. It used to be a tinted
                panel with a filled badge above the reasons, which gave a
                second-look prompt more weight than the thing the dialog is
                actually for. One quiet line, at the size of the subtitle it
                sits under — the score is the only emphasis it needs. */}
            {/* Readable, but still a line rather than a panel. It was a
                tinted box with a filled badge (too loud, it outranked the
                reasons), then neutral-400 at 11.5px (too quiet to register).
                This is the middle: the claim in ink, the score in brand
                purple, no container. */}
            {dStrong && (
              <p className="mt-2 pr-9 text-[12.5px] leading-snug text-neutral-500">
                <span className="font-semibold" style={{ color: INK }}>
                  One of your strongest matches
                </span>{" "}
                ·{" "}
                <span className="font-bold tabular-nums" style={{ color: BRAND }}>
                  {dCreator.fit}
                </span>{" "}
                brand fit
              </p>
            )}

            {/* Reasons, not a blank box. Every label is measured against the
                BRIEF rather than taste, because "I don't like it" gives a
                creator nothing to act on while "the caption doesn't carry
                the brief's messaging" is a re-cut they can make. Two
                columns so all six fit without a scroll. */}
            <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DECLINE_REASONS.map((r) => {
                const on = reasons.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-[12.5px] leading-snug transition-colors ${
                      on
                        ? "border-[#4D2FB0] bg-[#4D2FB0]/[0.05]"
                        : "border-black/[0.08] bg-white hover:border-black/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleReason(r.id)}
                      className="mt-px h-4 w-4 shrink-0 accent-[#4D2FB0]"
                    />
                    <span style={{ color: on ? BRAND : INK }}>{r.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="decline-note" className="text-[12.5px] font-semibold" style={{ color: INK }}>
                  Anything else?{" "}
                  <span className="font-medium text-neutral-400">Optional</span>
                </label>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    note.length >= NOTE_MAX ? "text-[#D70015]" : "text-neutral-400"
                  }`}
                >
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id="decline-note"
                ref={noteBox}
                value={note}
                maxLength={NOTE_MAX}
                rows={2}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the creator…"
                className="mt-1.5 w-full resize-none rounded-xl border border-black/[0.06] bg-[#fafafa] p-3 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 focus:border-[#4D2FB0] focus:ring-2 focus:ring-[#4D2FB0]/25"
                style={{ color: INK }}
              />
            </div>

            {/* The 10-day window is NOT restated here. It describes what
                happens when the brand does NOT decide, and this dialog only
                exists because they are deciding right now — so in here it is
                a paragraph that cannot apply. It stays on the review screen,
                on the drafts it actually governs. */}

            <div className="mt-4 flex items-stretch gap-2.5">
              <button
                onClick={closeDecline}
                className="flex flex-1 items-center justify-center rounded-xl bg-white px-4 py-3 text-[13px] font-semibold ring-1 ring-black/[0.08] transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
                style={{ color: INK }}
              >
                Cancel
              </button>
              {/* Ink, not purple and not red: purple is the Like verb three
                  inches behind this card, and the red belongs to the closing
                  window. This is the serious button, not an alarm. */}
              {/* Disabled until a reason is picked — a decline with nothing
                  attached is the thing this dialog exists to prevent. */}
              <button
                onClick={confirmDecline}
                disabled={!canDecline}
                aria-disabled={!canDecline}
                title={canDecline ? undefined : "Pick at least one reason"}
                className={`flex flex-[1.5] items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0] ${
                  canDecline
                    ? "bg-[#191234] text-white hover:bg-[#191234]/90"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                }`}
              >
                <ThumbsDown size={16} weight="fill" aria-hidden="true" /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
