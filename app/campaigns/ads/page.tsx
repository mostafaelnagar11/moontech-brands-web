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
  ArrowLeft, CaretLeft, CaretRight, Check, Info, Keyboard,
  ThumbsDown, ThumbsUp, Warning, X,
  InstagramLogo, TiktokLogo, YoutubeLogo, type Icon,
} from "@phosphor-icons/react";
import {
  CAMPAIGNS, adChecks, adCreator, adHero, adsFor, estReach,
  type Ad, type AdSignal, type Platform,
} from "../../lib/campaigns";
import { setAdSignal, useAdsFor } from "../../lib/adSignals";

const BRAND = "#4D2FB0";
const BRAND_HOVER = "#3F2596";
const INK = "#191234";

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
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* The decisions live in the shared store, so the list is DERIVED — liking
     every draft and walking back to the campaign leaves it agreeing that
     nothing is waiting. Local state below is view-only. */
  const ads = useAdsFor(cid ?? "");

  /* Derived means a fresh array identity every render, so callbacks read the
     latest rows through a ref instead of closing over them — that keeps
     `rate`/`go`/the key handler stable and never one render stale. */
  const adsRef = useRef<Ad[]>(ads);
  adsRef.current = ads;

  /* Warm the next hero so navigation never lands on a grey box. Keyed on the
     image URL, not the array, since the array is rebuilt each render. */
  const nextImg = ads[sel + 1]?.img;
  useEffect(() => {
    if (!nextImg) return;
    const im = new window.Image();
    im.src = adHero(nextImg);
  }, [nextImg]);

  const ad: Ad | null = ads[sel] ?? null;
  const creator = ad ? adCreator(ad) : null;
  const decided = ads.filter((a) => a.signal !== "none").length;
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
    const after = adsRef.current.map((r) => (r.id === a.id ? { ...r, signal: to } : r));

    window.clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), id: a.id, name: c.name, to, from });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);

    /* Move to the next ad nobody has decided on. A decided ad stays in the
       queue — you can go back and change your mind until it publishes. */
    let next = -1;
    for (let k = 1; k <= after.length; k++) {
      const j = (i + k) % after.length;
      if (after[j].signal === "none") { next = j; break; }
    }
    if (next !== -1) setSel(next);

    setAnnounce(
      (to === "liked"
        ? `Liked. ${c.name}'s ad publishes within the hour and more of this phase's budget goes behind creative like it.`
        : "Disliked. This ad will not post, and we stop matching creative like it.") +
      (next === -1
        ? ` That's all ${after.length} decided.`
        : ` Showing ad ${next + 1} of ${after.length}.`)
    );
  }, []);

  const undo = useCallback(() => {
    if (!toast) return;
    window.clearTimeout(toastTimer.current);
    setAdSignal(toast.id, toast.from);
    const i = adsRef.current.findIndex((r) => r.id === toast.id);
    if (i >= 0) setSel(i);
    setAnnounce("Decision removed. The ad is waiting again.");
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
  if (!resolved || !cid || !ad || !creator) {
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
                  {campaign ? `${campaign.name} has` : "This campaign has"} no drafts to review.
                  New creative lands here the moment a creator finishes it.
                </>
              ) : (
                <>
                  The link points at a campaign that isn&apos;t on your roster, so there is
                  no creative to judge. Pick the campaign you meant and we&apos;ll open its
                  drafts.
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

  const checks = adChecks(ad);
  const flagged = checks.some((c) => !c.clean);
  const PIcon = PLAT_ICON[ad.platform];
  const atStart = sel === 0;
  const atEnd = sel === ads.length - 1;

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
      These three run on every draft before it reaches you, so a go-ahead is one tap
      rather than a review meeting. Nothing here has posted yet: Like publishes it and
      puts more of this phase&apos;s budget behind creative like it, Dislike keeps it
      offline and stops us matching its pattern.
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
          {sel + 1} of {ads.length} · {decided} decided
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <AllCampaignsLink />

          <span className="hidden items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/55 ring-1 ring-white/10 md:flex">
            <Keyboard size={13} weight="fill" aria-hidden="true" className="text-white/40" />
            ← → navigate · L like · D dislike · Esc exit
          </span>

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
          <section
            aria-label={`Ad ${sel + 1} of ${ads.length}. ${creator.name}, ${ad.format} for ${ad.platform}. ${
              ad.signal === "liked"
                ? "Liked — publishing."
                : ad.signal === "disliked"
                  ? "Disliked — will not post."
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
                        <ThumbsDown size={11} weight="fill" aria-hidden="true" /> Not posting
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
                    {ad.product} · est. {estReach(creator.followers)} reach · sent {ad.submitted}
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
              <button
                onClick={() => rate(ad, sel, "disliked")}
                aria-label={`Dislike ${creator.name}'s ad. It will not post.`}
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
            </div>
            <p className="mt-2.5 text-center text-[11px] font-medium text-white/40">
              Nothing posts until you react
            </p>
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
                    : `${toast.name}'s ad will not post.`}
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
        </div>

        {/* ── 3 · RIGHT RAIL — the checks, and the whole queue ── */}
        <aside className="hidden w-[320px] shrink-0 flex-col border-l border-white/10 lg:flex">
          <div className="shrink-0 border-b border-white/10 p-4">
            <h2 className="text-[13px] font-semibold text-white">Checked before it reached you</h2>
            <div className="mt-3">
              <CheckRows dark />
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/45">{explainer}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-[13px] font-semibold text-white">The queue</h2>
              <span className="text-[11px] font-medium tabular-nums text-white/40">
                {decided} of {ads.length} decided
              </span>
            </div>
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
              {ads.map((a, i) => {
                const c = adCreator(a);
                const current = i === sel;
                const state =
                  a.signal === "liked" ? "Publishing" : a.signal === "disliked" ? "Not posting" : "waiting";
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => go(i)}
                      aria-current={current ? "true" : undefined}
                      aria-label={`Ad ${i + 1} of ${ads.length}. ${c.name}, ${a.format} for ${a.platform}. ${
                        a.signal === "liked"
                          ? "Liked — publishing."
                          : a.signal === "disliked"
                            ? "Disliked — will not post."
                            : "Waiting on you."
                      }`}
                      className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                        current
                          ? "bg-white/[0.12] ring-1 ring-white/25"
                          : "hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.img}
                        alt=""
                        loading="lazy"
                        className="h-[52px] w-[39px] shrink-0 rounded-md bg-white/10 object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-white">{c.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-white/45">
                          {a.format} · {a.platform}
                        </span>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            a.signal === "liked"
                              ? "bg-[#059669]/20 text-[#4ADE9B]"
                              : a.signal === "disliked"
                                ? "bg-white/10 text-white/55"
                                : "bg-amber-400/15 text-amber-300"
                          }`}
                        >
                          {a.signal === "liked" && <ThumbsUp size={9} weight="fill" aria-hidden="true" />}
                          {a.signal === "disliked" && <ThumbsDown size={9} weight="fill" aria-hidden="true" />}
                          {state}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
