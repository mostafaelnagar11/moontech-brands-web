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
/*           pattern.                                                   */
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
  ArrowLeft, CaretLeft, CaretRight, Check, Info,
  ThumbsDown, ThumbsUp, Warning, X,
  InstagramLogo, TiktokLogo, YoutubeLogo, type Icon,
} from "@phosphor-icons/react";
import {
  CAMPAIGNS, adChecks, adCreator, adHero, adsFor,
  type Ad, type AdSignal, type Platform,
} from "../../lib/campaigns";
import { setAdSignal, useAdsFor } from "../../lib/adSignals";

const BRAND = "#4D2FB0";
const BRAND_HOVER = "#3F2596";
const INK = "#191234";

const TABS: { key: AdSignal; label: string }[] = [
  { key: "none",     label: "Waiting" },
  { key: "liked",    label: "Liked" },
  { key: "disliked", label: "Disliked" },
];

const PLAT_ICON: Record<Platform, Icon> = {
  Instagram: InstagramLogo,
  TikTok: TiktokLogo,
  YouTube: YoutubeLogo,
};

type Toast = { key: number; id: string; name: string; to: AdSignal; from: AdSignal };

export default function CampaignAdsPage() {
  const router = useRouter();

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
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [announce, setAnnounce] = useState("");

  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("c");
    /* An UNKNOWN ?c= resolves to nothing. It must never fall back to another
       campaign: silently substituting one means a reviewer rates Spring
       2026's creative believing it belongs to the campaign they asked for,
       and a like publishes it. No id at all is a different case — the route
       was opened without context, so the first campaign with drafts is a
       fair default. */
    const id = q
      ? (CAMPAIGNS.some((c) => c.id === q) ? q : null)
      : CAMPAIGNS.find((c) => adsFor(c.id).length > 0)?.id ?? null;
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
  const campaign = cid ? CAMPAIGNS.find((c) => c.id === cid) ?? null : null;

  const go = useCallback((i: number) => {
    setSel((s) => (i < 0 || i >= adsRef.current.length ? s : i));
  }, []);

  const back = useCallback(() => {
    router.push(cid ? `/campaigns/${cid}` : "/campaigns");
  }, [router, cid]);

  /* Takes the ad it acts on, because a queue row can rate an ad that is
     not the one on the stage — there is no single "current" to infer. */
  const rate = useCallback((a: Ad, i: number, to: "liked" | "disliked") => {
    const c = adCreator(a);
    const from = a.signal;
    setAdSignal(a.id, to);

    /* Where to go next is computed from the list WITH this decision applied —
       reading the rows we rendered from would hand the reviewer back the ad
       they just rated. */
    const after = allRef.current.map((r) => (r.id === a.id ? { ...r, signal: to } : r));

    window.clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), id: a.id, name: c.name, to, from });
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
        : "Disliked. This ad will not publish, and we stop matching ads like it.") +
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

  /* ── Keyboard — the affordance a desktop reviewer expects ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
      else if (k === "d") { e.preventDefault(); rate(cur, sel, "disliked"); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, infoOpen, go, rate, undo, back]);

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
        aria-label={campaign ? `Back to ${campaign.name}` : "Back to all campaigns"}
        className="flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden="true" className="shrink-0" />
        <span className="max-w-[190px] truncate text-[12.5px] font-semibold">
          Back to {campaign?.name ?? "campaigns"}
        </span>
      </button>
      <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-white/10 sm:block" />
      <div className="hidden min-w-0 shrink-0 sm:block">
        <p className="text-[15px] font-semibold leading-tight text-white">Ad review</p>
        <p className="truncate text-[11px] leading-tight text-white/50">
          {campaign?.name ?? "Campaign"}
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
              {cid ? "Nothing waiting on you" : "We can't find that campaign"}
            </p>
            <p className="mt-2 max-w-[440px] text-sm leading-relaxed text-white/60">
              {cid ? (
                <>
                  {campaign ? `${campaign.name} has` : "This campaign has"} no ads to review.
                  New ads land here the moment a creator finishes one.
                </>
              ) : (
                <>
                  The link points at a campaign that isn&apos;t one of your campaigns, so there are
                  no ads to review. Pick the campaign you meant and we&apos;ll open its
                  ads.
                </>
              )}
            </p>
            <button
              onClick={back}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {cid ? "Back to campaign" : "All campaigns"}
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
              c.clean ? "bg-[#059669]" : "bg-amber-500"
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

  const explainer = (
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
          <div role="tablist" aria-label="Ad review shelves" className="flex items-center gap-1 rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10">
            {TABS.map((t) => {
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
                flagged ? "bg-amber-400" : "bg-[#34C759]"
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
                {tab === "none" ? "Every ad here has been decided. New ones land the moment a creator finishes them."
                  : tab === "liked" ? "Ads you like publish within the hour and collect here."
                  : "Ads you dislike never publish. They collect here so you can change your mind."}
              </p>
              {counts.none > 0 && tab !== "none" && (
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
                  className="block max-h-[calc(100vh-212px)] max-w-full rounded-2xl bg-white/[0.04] object-contain shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
                />

                {/* Only DECIDED ads wear a pill — it is the receipt for a
                    click, and the only way to tell, coming back, what you
                    already did. "Waiting on you" is the default state and the
                    counter in the top bar already carries it. */}
                {ad.signal !== "none" && (
                  <div className="absolute left-3 top-3">
                    {ad.signal === "liked" ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-[#059669] px-3 py-1.5 text-[11px] font-bold text-white">
                        <ThumbsUp size={11} weight="fill" aria-hidden="true" /> Publishing
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                        <ThumbsDown size={11} weight="fill" aria-hidden="true" /> Not publishing
                      </span>
                    )}
                  </div>
                )}

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
          <div className="flex h-[112px] shrink-0 flex-col justify-center border-t border-white/10 px-6">
            <div className="mx-auto flex w-full max-w-[460px] items-stretch gap-3">
              {ad.signal === "none" ? (
                <>
                  <button
                    onClick={() => rate(ad, sel, "disliked")}
                    aria-label={`Dislike ${creator.name}'s ad. It will not publish.`}
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
              ) : (
                /* One button, no state pill: the shelf you are standing on
                   names the state, and the creative carries its own pill. */
                <button
                  onClick={() => rate(ad, sel, ad.signal === "liked" ? "disliked" : "liked")}
                  aria-label={ad.signal === "liked"
                    ? `Dislike ${creator.name}'s ad instead. It will not publish.`
                    : `Like ${creator.name}'s ad instead. It publishes within the hour.`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3.5 text-[14px] font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {ad.signal === "liked"
                    ? <><ThumbsDown size={18} weight="fill" aria-hidden="true" /> Dislike instead</>
                    : <><ThumbsUp size={18} weight="fill" aria-hidden="true" /> Like instead</>}
                </button>
              )}
            </div>
            {ad.signal === "none" && (
              <p className="mt-2.5 text-center text-[11px] font-medium text-white/40">
                Nothing publishes until you like or dislike it
              </p>
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
                    : `${toast.name}'s ad will not publish.`}
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
          </div>
        </div>
      )}
    </div>
  );
}
