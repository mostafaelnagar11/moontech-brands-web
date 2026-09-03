"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  List, MagnifyingGlass, ArrowLeft, ArrowRight, CheckCircle, ArrowUpRight, MapPin, SignOut,
  ThumbsUp, ThumbsDown, InstagramLogo, TiktokLogo, YoutubeLogo, Check, Minus, X,
  ArrowCounterClockwise, type Icon,
} from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import NotificationCenter from "../components/NotificationCenter";
import { useActiveBrand } from "../lib/brand";
import {
  CREATOR_PASS_REASONS, creatorPassReasonLabel, NOTE_MAX, viewThrough, pct1, median,
  fmtCount,
} from "../lib/campaigns";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const INK = "#191234";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
type Signal = "waiting" | "liked" | "passed";
type Platform = "Instagram" | "TikTok" | "YouTube";

interface Post { img: string; views: string; type: string }
/* One account the creator actually holds. The handle travels WITH the
   platform because the same person is @ghalya.mu2 on TikTok and @ghalya.mu
   on Instagram — deriving the second from the first sends a brand to a
   stranger's profile, or to nobody. */
interface Account { platform: Platform; handle: string }
interface Creator {
  id: number; initials: string; name: string; handle: string; niche: string;
  platform: Platform; followers: number; score: number; gcAudience: number;
  avgViews: number; totalPosts: number; contentQuality: "Premium" | "High" | "Medium";
  brandConflict: string; location: string; topCountries: string; audienceAge: string;
  audienceGender: string; postFreq: string; activeSince: string; status: Signal;
  colors: [string, string]; bio: string; avatar: string; posts: Post[];
  /* Primary first — `platform` and `handle` above are this list's head. */
  accounts: Account[];
}

const CREATORS_SEED: Creator[] = [
  { id: 1, initials: "JA", name: "Jawaher Alsuwaidi", handle: "@jawahralsuwaidi", niche: "Fashion", platform: "Instagram", followers: 78400, score: 93, gcAudience: 76, avgViews: 21600, totalPosts: 612, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 58%, KSA 19%, Kuwait 11%", audienceAge: "25–34 (64%)", audienceGender: "Female 81%", postFreq: "4–5x/week", activeSince: "2018", status: "waiting", colors: ["#2D1B6B", "#4A2BA0"], bio: "Emirati fashion and travel creator. Ounass finds, promo codes and the edit behind every trip.",
    avatar: "/creators/jawahralsuwaidi/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@jawahralsuwaidi" }, { platform: "TikTok", handle: "@jawahralsuwaidi" }],
    posts: [{ img: "/creators/jawahralsuwaidi/p1.jpg", views: "26K", type: "Reel" }, { img: "/creators/jawahralsuwaidi/p2.jpg", views: "19K", type: "Post" }, { img: "/creators/jawahralsuwaidi/p3.jpg", views: "31K", type: "Reel" }, { img: "/creators/jawahralsuwaidi/p4.jpg", views: "17K", type: "Post" }, { img: "/creators/jawahralsuwaidi/p5.jpg", views: "15K", type: "Story" }] },
  { id: 2, initials: "MB", name: "MakeupbyMemz", handle: "@makeupbymemz", niche: "Beauty", platform: "Instagram", followers: 135000, score: 88, gcAudience: 72, avgViews: 29800, totalPosts: 1840, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 47%, KSA 26%, Kuwait 10%", audienceAge: "22–32 (69%)", audienceGender: "Female 93%", postFreq: "6x/week", activeSince: "2017", status: "waiting", colors: ["#831843", "#BE185D"], bio: "Pro makeup artist and beauty creator. Owner of Anabella Al Sharq salon. 500K+ on TikTok.",
    avatar: "/creators/makeupbymemz/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@makeupbymemz" }, { platform: "TikTok", handle: "@makeupbymemz8" }],
    posts: [{ img: "/creators/makeupbymemz/p1.jpg", views: "34K", type: "Reel" }, { img: "/creators/makeupbymemz/p2.jpg", views: "27K", type: "Reel" }, { img: "/creators/makeupbymemz/p3.jpg", views: "41K", type: "Reel" }, { img: "/creators/makeupbymemz/p4.jpg", views: "22K", type: "Post" }, { img: "/creators/makeupbymemz/p5.jpg", views: "25K", type: "Reel" }] },
  { id: 3, initials: "OF", name: "Ola Farahat", handle: "@olafarahat", niche: "Luxury", platform: "Instagram", followers: 1300000, score: 90, gcAudience: 68, avgViews: 186000, totalPosts: 3410, contentQuality: "Premium", brandConflict: "Minor (Farfetch)", location: "UAE", topCountries: "UAE 44%, KSA 21%, Egypt 12%", audienceAge: "28–38 (56%)", audienceGender: "Female 76%", postFreq: "Daily", activeSince: "2013", status: "waiting", colors: ["#1A1A2E", "#3A3A5A"], bio: "Dubai-based luxury, travel and lifestyle. One of the region's longest-running fashion accounts.",
    avatar: "/creators/olafarahat/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@olafarahat" }],
    posts: [{ img: "/creators/olafarahat/p1.jpg", views: "212K", type: "Reel" }, { img: "/creators/olafarahat/p2.jpg", views: "168K", type: "Post" }, { img: "/creators/olafarahat/p3.jpg", views: "245K", type: "Reel" }, { img: "/creators/olafarahat/p4.jpg", views: "151K", type: "Post" }, { img: "/creators/olafarahat/p5.jpg", views: "174K", type: "Reel" }] },
  { id: 4, initials: "MM", name: "Mais Mustafa", handle: "@mais.mustafa", niche: "Lifestyle", platform: "TikTok", followers: 43600, score: 84, gcAudience: 63, avgViews: 18900, totalPosts: 286, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 39%, KSA 22%, Jordan 14%", audienceAge: "25–34 (61%)", audienceGender: "Female 88%", postFreq: "4x/week", activeSince: "2021", status: "waiting", colors: ["#0C4A6E", "#1D5F8A"], bio: "Fashion, lifestyle and motherhood. Short-form that people actually finish.",
    avatar: "/creators/mais.mustafa/avatar.jpg",
    accounts: [{ platform: "TikTok", handle: "@mais.mustafa" }],
    posts: [{ img: "/creators/mais.mustafa/p1.jpg", views: "24K", type: "Video" }, { img: "/creators/mais.mustafa/p2.jpg", views: "17K", type: "Video" }, { img: "/creators/mais.mustafa/p3.jpg", views: "29K", type: "Video" }, { img: "/creators/mais.mustafa/p4.jpg", views: "13K", type: "Video" }, { img: "/creators/mais.mustafa/p5.jpg", views: "11K", type: "Video" }] },
  { id: 5, initials: "AA", name: "Asma Al Azmi", handle: "@asmaalazmii_", niche: "Lifestyle", platform: "Instagram", followers: 18200, score: 79, gcAudience: 81, avgViews: 5400, totalPosts: 1120, contentQuality: "Medium", brandConflict: "None", location: "Kuwait", topCountries: "Kuwait 54%, KSA 21%, UAE 14%", audienceAge: "24–34 (66%)", audienceGender: "Female 90%", postFreq: "Daily", activeSince: "2019", status: "waiting", colors: ["#14532D", "#1A7A3F"], bio: "Kuwait-based creator. Perfume, restaurants and honest takes on everything she's sent.",
    avatar: "/creators/asmaalazmii_/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@asmaalazmii_" }],
    posts: [{ img: "/creators/asmaalazmii_/p1.jpg", views: "7K", type: "Reel" }, { img: "/creators/asmaalazmii_/p2.jpg", views: "5K", type: "Post" }, { img: "/creators/asmaalazmii_/p3.jpg", views: "8K", type: "Reel" }, { img: "/creators/asmaalazmii_/p4.jpg", views: "4K", type: "Post" }, { img: "/creators/asmaalazmii_/p5.jpg", views: "3K", type: "Story" }] },
  { id: 6, initials: "GA", name: "Ghaliah Alsharif", handle: "@ghalya.mu2", niche: "Beauty", platform: "TikTok", followers: 1100000, score: 95, gcAudience: 74, avgViews: 214000, totalPosts: 940, contentQuality: "Premium", brandConflict: "Minor (Sephora ambassador)", location: "KSA", topCountries: "KSA 61%, UAE 18%, Kuwait 8%", audienceAge: "20–30 (65%)", audienceGender: "Female 89%", postFreq: "5x/week", activeSince: "2018", status: "waiting", colors: ["#7C1D1D", "#991B1B"], bio: "Beauty and fashion out of Jeddah. Sephora ambassador. 570K more on Instagram.",
    avatar: "/creators/ghalya.mu2/avatar.jpg",
    accounts: [{ platform: "TikTok", handle: "@ghalya.mu2" }, { platform: "Instagram", handle: "@ghalya.mu" }],
    posts: [{ img: "/creators/ghalya.mu2/p1.jpg", views: "268K", type: "Video" }, { img: "/creators/ghalya.mu2/p2.jpg", views: "195K", type: "Video" }, { img: "/creators/ghalya.mu2/p3.jpg", views: "312K", type: "Video" }, { img: "/creators/ghalya.mu2/p4.jpg", views: "172K", type: "Video" }, { img: "/creators/ghalya.mu2/p5.jpg", views: "148K", type: "Video" }] },
  { id: 7, initials: "RK", name: "Rebecca Kassab Al Azar", handle: "@rebeccarkassab", niche: "Fashion", platform: "Instagram", followers: 331000, score: 86, gcAudience: 70, avgViews: 58400, totalPosts: 2260, contentQuality: "High", brandConflict: "Minor (The Smart Vendor)", location: "UAE", topCountries: "UAE 49%, KSA 18%, Lebanon 13%", audienceAge: "25–34 (60%)", audienceGender: "Female 80%", postFreq: "Daily", activeSince: "2016", status: "waiting", colors: ["#1A3A5C", "#2563EB"], bio: "Fashion, beauty and lifestyle from the UAE. Co-founder of The Smart Vendor.",
    avatar: "/creators/rebeccarkassab/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@rebeccarkassab" }],
    posts: [{ img: "/creators/rebeccarkassab/p1.jpg", views: "67K", type: "Post" }, { img: "/creators/rebeccarkassab/p2.jpg", views: "52K", type: "Reel" }, { img: "/creators/rebeccarkassab/p3.jpg", views: "78K", type: "Reel" }, { img: "/creators/rebeccarkassab/p4.jpg", views: "44K", type: "Reel" }, { img: "/creators/rebeccarkassab/p5.jpg", views: "51K", type: "Post" }] },
  { id: 8, initials: "DS", name: "Dima Sheikhly", handle: "@dimasheikhly", niche: "Luxury", platform: "Instagram", followers: 942000, score: 91, gcAudience: 64, avgViews: 121000, totalPosts: 2980, contentQuality: "Premium", brandConflict: "Competing (Namshi)", location: "UAE", topCountries: "UAE 41%, KSA 20%, Kuwait 9%", audienceAge: "27–40 (57%)", audienceGender: "Female 73%", postFreq: "4x/week", activeSince: "2014", status: "waiting", colors: ["#4C1D95", "#6D28D9"], bio: "Luxury fashion and travel. Front row in Milan, Venice and New York, back home in Dubai.",
    avatar: "/creators/dimasheikhly/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@dimasheikhly" }],
    posts: [{ img: "/creators/dimasheikhly/p1.jpg", views: "142K", type: "Post" }, { img: "/creators/dimasheikhly/p2.jpg", views: "108K", type: "Reel" }, { img: "/creators/dimasheikhly/p3.jpg", views: "165K", type: "Reel" }, { img: "/creators/dimasheikhly/p4.jpg", views: "96K", type: "Post" }, { img: "/creators/dimasheikhly/p5.jpg", views: "94K", type: "Reel" }] },
  { id: 9, initials: "PS", name: "Paola El Sitt", handle: "@paola.elsitt", niche: "Lifestyle", platform: "Instagram", followers: 1000000, score: 87, gcAudience: 67, avgViews: 168000, totalPosts: 1960, contentQuality: "Premium", brandConflict: "Minor (own brand, Joi)", location: "UAE", topCountries: "UAE 43%, KSA 17%, Lebanon 15%", audienceAge: "25–34 (62%)", audienceGender: "Female 84%", postFreq: "Daily", activeSince: "2015", status: "liked", colors: ["#064E3B", "#059669"], bio: "Food, wellness and everyday luxury. Founder of Joi, gut-friendly snacks and bread.",
    avatar: "/creators/paola.elsitt/avatar.jpg",
    accounts: [{ platform: "Instagram", handle: "@paola.elsitt" }],
    posts: [{ img: "/creators/paola.elsitt/p1.jpg", views: "195K", type: "Reel" }, { img: "/creators/paola.elsitt/p2.jpg", views: "152K", type: "Post" }, { img: "/creators/paola.elsitt/p3.jpg", views: "231K", type: "Reel" }, { img: "/creators/paola.elsitt/p4.jpg", views: "138K", type: "Reel" }, { img: "/creators/paola.elsitt/p5.jpg", views: "124K", type: "Post" }] },
  { id: 10, initials: "NR", name: "Noon Reviews", handle: "@skindew0", niche: "Beauty", platform: "TikTok", followers: 335600, score: 74, gcAudience: 79, avgViews: 96000, totalPosts: 1480, contentQuality: "High", brandConflict: "Competing (Boutiqaat)", location: "UAE", topCountries: "UAE 46%, Kuwait 24%, KSA 18%", audienceAge: "20–30 (70%)", audienceGender: "Female 92%", postFreq: "Daily", activeSince: "2020", status: "passed", colors: ["#78350F", "#92400E"], bio: "Skincare and beauty reviews out of the UAE. Codes, comparisons and what she'd buy twice.",
    avatar: "/creators/skindew0/avatar.jpg",
    accounts: [{ platform: "TikTok", handle: "@skindew0" }],
    posts: [{ img: "/creators/skindew0/p1.jpg", views: "118K", type: "Video" }, { img: "/creators/skindew0/p2.jpg", views: "87K", type: "Video" }, { img: "/creators/skindew0/p3.jpg", views: "141K", type: "Video" }, { img: "/creators/skindew0/p4.jpg", views: "74K", type: "Video" }, { img: "/creators/skindew0/p5.jpg", views: "62K", type: "Video" }] },
];


/* ------------------------------------------------------------------ */
/* Derived performance — parsed, never invented                        */
/* ------------------------------------------------------------------ */

/* Per-post view counts are display strings ("22K", "112K", "1.2M"), which
   is the only per-post reach the model carries. They are parsed rather
   than stored a second time so the tiles can never drift from the tiles
   on the posts themselves. Anything unparseable yields null, and a null
   makes the whole derived figure disappear — a median built on a guess is
   worse than no median at all. */
function parseViews(s: string): number | null {
  const m = s.trim().match(/^([\d.]+)\s*([KM])?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suffix = m[2]?.toUpperCase();
  return suffix === "M" ? n * 1_000_000 : suffix === "K" ? n * 1_000 : n;
}

/** Back to the same shape the post tiles use, so 16000 reads as "16K". */
const fmtViews = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${Math.round(n / 1_000)}K`
  : String(Math.round(n));

/** Every post view for one creator, or null if a single tile fails to parse. */
function postViews(c: Creator): number[] | null {
  const xs = c.posts.map((p) => parseViews(p.views));
  return xs.every((x): x is number => x !== null) ? xs : null;
}

/* The ONLY benchmark on this screen, and it is this brand's own matched
   roster — the median view-through across the ten creators here (~21%).
   No industry or platform figure exists in the model, so none is shown:
   an invented benchmark was deleted from the dashboard for exactly that
   reason and is not coming back through this door. */
/* Performance tiles are parked, not cut — the founder asked for them
   hidden for now. Flip to true to bring the section back. */
const SHOW_PERFORMANCE = false;

const ROSTER_MEDIAN_VT = median(CREATORS_SEED.map((c) => viewThrough(c.avgViews, c.followers)));

const TABS: { key: Signal; label: string }[] = [
  { key: "waiting", label: "Waiting" },
  { key: "liked", label: "Liked" },
  { key: "passed", label: "Disliked" },
];

const PLAT: Record<Platform, { Icon: Icon; url: (s: string) => string }> = {
  Instagram: { Icon: InstagramLogo, url: (s: string) => `https://instagram.com/${s}` },
  TikTok:    { Icon: TiktokLogo,    url: (s: string) => `https://tiktok.com/@${s}` },
  YouTube:   { Icon: YoutubeLogo,   url: (s: string) => `https://youtube.com/@${s}` },
};

/* ------------------------------------------------------------------ */
/* Detail workspace                                                    */
/* ------------------------------------------------------------------ */
function Detail({
  c, waitingList, onPrev, onNext, onDecide, onAskPass, onUndoPass, passInfo,
}: {
  c: Creator;
  waitingList: Creator[];
  onPrev: () => void;
  onNext: () => void;
  onDecide: (id: number, d: Signal) => void;
  onAskPass: (c: Creator) => void;
  onUndoPass: (id: number) => void;
  passInfo?: { reasons: string[]; note: string };
}) {
  /* The checklist below is checked against THIS brand's criteria, not a
     house threshold — so switching brands in the sidebar changes what
     "matched" means, which is the whole point of storing criteria per
     brand. */
  const { criteria } = useActiveBrand();
  const slug = c.handle.replace("@", "");
  const plat = PLAT[c.platform];
  const platUrl = plat.url(slug);
  const isWaiting = c.status === "waiting";
  const idx = waitingList.findIndex((x) => x.id === c.id);
  const hasPrev = idx > 0, hasNext = idx >= 0 && idx < waitingList.length - 1;

  /* Still read by the parked performance section below. */
  const vt = viewThrough(c.avgViews, c.followers);

  /* ── THE FOUR SIGNALS ──
     One row per thing the matcher extracts from a profile, each against
     what THIS brand asked for. The list used to run to six, and two of
     those — buyer age and cadence — were measured against criteria the
     matcher never reads, so the checklist was describing work that was
     not happening.

     A row that does not clear is still shown, in neutral: the matcher
     already weighed it, so it is context, not an alert. Red on this
     screen means "needs your action", and nothing already priced into
     the fit score qualifies. ── */
  const nicheOk = criteria.niches.some(
    (n) => n.toLowerCase() === c.niche.toLowerCase(),
  );
  const checks: { label: string; ok: boolean; node: React.ReactNode }[] = [
    {
      label: "Platform",
      ok: criteria.platforms.includes(c.platform),
      node: criteria.platforms.includes(c.platform)
        ? `${c.platform} · one of the platforms you asked for`
        : `${c.platform} · you asked for ${criteria.platforms.join(" or ")}`,
    },
    {
      label: "Followers",
      ok: c.followers >= criteria.minFollowers,
      node: `${fmtCount(c.followers)} followers · you asked for ${fmtCount(criteria.minFollowers)}+`,
    },
    {
      label: "Profile",
      /* The niche IS the profile signal the matcher reads. Phrased as what
         her profile is either way, so the line reads the same cleared or
         not — the tick is what says which. */
      ok: nicheOk,
      node: nicheOk
        ? `${c.niche} · you are buying ${criteria.niches.join(", ")}`
        : `${c.niche} · no strong ${criteria.niches.join("/").toLowerCase()} signal`,
    },
    {
      label: "Region",
      ok: c.gcAudience >= criteria.minGccAudience,
      node: `${c.gcAudience}% of her audience is in the Gulf · you asked for ${criteria.minGccAudience}%+`,
    },
  ];
  const cleared = checks.filter((k) => k.ok).length;

  /* ── Performance ──
     View-through is the honest headline: there is no like or comment data
     in the model, so no "engagement rate" is computed here — one would
     have to be invented. Followers appear nowhere on this screen as a
     figure; they are only the denominator below. */
  const views = postViews(c);
  const typical = views ? median(views) : null;
  const lo = views ? Math.min(...views) : null;
  const hi = views ? Math.max(...views) : null;

  const scoreLabel = c.score >= 90 ? "Excellent" : c.score >= 80 ? "Good" : "Fair";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-7 pt-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              {isWaiting && idx >= 0 ? `${idx + 1} of ${waitingList.length} waiting on you` : `Viewing ${c.status === "passed" ? "disliked" : "liked"} profile`}
            </div>
            {isWaiting && (
              <div className="flex gap-1.5">
                <button onClick={onPrev} disabled={!hasPrev}
                  className={`flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-xs transition ${hasPrev ? "text-neutral-700 hover:bg-neutral-50" : "cursor-default text-neutral-300"}`}>
                  <ArrowLeft size={12} weight="bold" /> Prev
                </button>
                <button onClick={onNext} disabled={!hasNext}
                  className={`flex items-center gap-1 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-xs transition ${hasNext ? "text-neutral-700 hover:bg-neutral-50" : "cursor-default text-neutral-300"}`}>
                  Next <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-5 flex items-start gap-4">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[20px]" style={{ background: c.colors[0] }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] font-bold tracking-tight" style={{ color: INK }}>{c.name}</h2>
                {c.accounts.map((acc) => {
                  const P = PLAT[acc.platform];
                  return (
                    <a key={acc.platform} href={P.url(acc.handle.replace("@", ""))}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 no-underline transition hover:border-[#4D2FB0]/30 hover:text-[#4D2FB0]">
                      <P.Icon size={13} weight="fill" /> {acc.platform}
                      <ArrowUpRight size={10} weight="bold" className="opacity-60" />
                    </a>
                  );
                })}
                <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                  <MapPin size={12} weight="fill" /> {c.location}
                </span>
              </div>
              <div className="mb-2.5 text-xs text-neutral-400">{c.handle} · {c.niche}</div>
              {/* The bio is the creator's own sentence, so it reads as prose
                  rather than as a callout. The tinted box and the ✶ that used
                  to frame it were decoration around text that needed none. */}
              <p className="max-w-[62ch] text-xs leading-relaxed text-neutral-600">{c.bio}</p>
            </div>
            {/* Brand fit — pinned to the right of the header */}
            <div className="flex h-[96px] w-[96px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#059669] text-center">
              <div className="text-[9px] font-semibold uppercase tracking-wide text-white/70">Brand fit</div>
              <div className="mt-1 text-[26px] font-bold tabular-nums leading-none text-white">{c.score}%</div>
              <div className="mt-1 text-[10px] font-medium text-white/80">{scoreLabel}</div>
            </div>
          </div>
        </div>

        {/* Signal banner */}
        {c.status === "liked" && (
          <div className="mx-7 mb-6 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle size={16} weight="fill" className="text-[#047857]" />
            <span className="flex-1 text-[13px] font-semibold text-[#047857]">Liked — we&apos;ll match more creators like her</span>
            <button onClick={() => onAskPass(c)}
              className="rounded-lg border border-green-200 px-2.5 py-1 text-xs text-neutral-500 transition hover:bg-white">Dislike</button>
          </div>
        )}
        {/* A pass is a MATCHING SIGNAL, so it is drawn as one: ink on
            neutral, never the red that means "needs your action", and
            always with the way back out of it. Nothing here blocks the
            person — MoonTech simply stops reaching for profiles like
            hers. */}
        {c.status === "passed" && (
          <div className="mx-7 mb-6 rounded-xl border border-black/[0.06] bg-neutral-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex-1 text-[13px] font-semibold" style={{ color: INK }}>
                Passed — we&apos;ll stop matching creators like her
              </span>
              <button onClick={() => onUndoPass(c.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50">
                <ArrowCounterClockwise size={12} weight="bold" /> Undo
              </button>
              <button onClick={() => onDecide(c.id, "liked")}
                className="rounded-lg border border-black/[0.1] bg-white px-2.5 py-1 text-xs font-medium text-[#4D2FB0] transition hover:bg-neutral-50">Like instead</button>
            </div>
            {/* What the brand actually told the matcher, echoed back. A
                signal you cannot read afterwards is one you cannot
                correct. */}
            {passInfo && passInfo.reasons.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-black/[0.06] pt-2.5">
                {passInfo.reasons.map((id) => (
                  <li key={id} className="flex items-start gap-2 text-[12px] leading-snug text-neutral-600">
                    <Check size={12} weight="bold" aria-hidden="true" className="mt-1 shrink-0 text-neutral-400" />
                    {creatorPassReasonLabel(id)}
                  </li>
                ))}
              </ul>
            )}
            {passInfo?.note && (
              <p className="mt-2 rounded-xl bg-white p-3 text-[12px] leading-relaxed text-neutral-600">
                &ldquo;{passInfo.note}&rdquo;
              </p>
            )}
            <p className="mt-2 text-[11px] leading-snug text-neutral-500">
              A tuning signal, not a decision about her. Undo it any time.
            </p>
          </div>
        )}

        {/* Why we matched — the brand's own criteria, checked */}
        <div className="mb-5 px-7">
          <div className="rounded-2xl border border-[#4D2FB0]/12 bg-[#4D2FB0]/[0.04] p-4">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs">✶</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#4D2FB0]">Why we matched</span>
              <span className="text-[11px] font-semibold tabular-nums text-neutral-500">
                {cleared} of {checks.length} clear
              </span>
            </div>
            <p className="mb-3 text-[11.5px] leading-snug text-neutral-500">
              These are the criteria you set for this brand, checked against her actual numbers.
            </p>
            <div className="flex flex-col gap-2">
              {checks.map((k) => (
                <div key={k.label} className="flex items-start gap-2.5">
                  {/* Green tick = cleared. A row that did not clear is
                      neutral and still shown — hiding it would leave the
                      brand confident for reasons it cannot see. */}
                  <span className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                    k.ok ? "bg-[#059669]/10 text-[#047857]" : "bg-black/[0.05] text-neutral-400"
                  }`}>
                    {k.ok
                      ? <Check size={10} weight="bold" aria-hidden="true" />
                      : <Minus size={10} weight="bold" aria-hidden="true" />}
                  </span>
                  <span className="w-[74px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {k.label}
                  </span>
                  <span className={`min-w-0 flex-1 text-xs leading-relaxed ${k.ok ? "text-neutral-600" : "text-neutral-500"}`}>
                    {k.node}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance — engagement and reach, no vanity figures.
            Hidden behind SHOW_PERFORMANCE for now. Gated rather than
            deleted deliberately: the JSX stays in the tree so the
            derived figures above it (postViews, median, view-through)
            stay referenced and cannot rot, and turning it back on is
            one word. */}
        {SHOW_PERFORMANCE && (
          <div className="mb-5 px-7">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Performance</div>
            {/* Two up until the viewport is genuinely wide: the detail pane is
                a column beside the rail, so four tiles here shred every label
                into three lines. */}
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">View-through</div>
                <div className="mt-1 text-[22px] font-bold tabular-nums leading-none" style={{ color: INK }}>{pct1(vt)}</div>
                <div className="mt-1.5 text-[11px] leading-snug text-neutral-500">
                  of her audience actually watches
                </div>
                {/* The comparison is the roster, named as the roster. No
                    industry or platform benchmark exists in this model, so
                    none is claimed. */}
                <div className={`mt-1.5 text-[11px] font-medium leading-snug ${
                  vt >= ROSTER_MEDIAN_VT ? "text-[#047857]" : "text-neutral-500"
                }`}>
                  {vt >= ROSTER_MEDIAN_VT ? "Above" : "Below"} {pct1(ROSTER_MEDIAN_VT)} median across your matched creators
                </div>
              </div>
              {/* Both derived tiles come from the SAME parsed post views, so
                  if one string is unreadable neither is shown. */}
              {typical !== null && lo !== null && hi !== null && (
                <>
                  <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Typical views per post</div>
                    <div className="mt-1 text-[22px] font-bold tabular-nums leading-none" style={{ color: INK }}>{fmtViews(typical)}</div>
                    <div className="mt-1.5 text-[11px] leading-snug text-neutral-500">median of her last 5 posts</div>
                  </div>
                  <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Consistency</div>
                    <div className="mt-1 text-[18px] font-bold tabular-nums leading-none" style={{ color: INK }}>
                      {fmtViews(lo)} – {fmtViews(hi)}
                    </div>
                    <div className="mt-1.5 text-[11px] leading-snug text-neutral-500">
                      lowest to highest of those 5 — the spread, not a score
                    </div>
                  </div>
                </>
              )}
              <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Gulf audience</div>
                <div className="mt-1 text-[22px] font-bold tabular-nums leading-none" style={{ color: INK }}>{c.gcAudience}%</div>
                <div className="mt-1.5 text-[11px] leading-snug text-neutral-500">of her audience is in the region</div>
              </div>
            </div>
          </div>
        )}

        {/* Last 5 posts */}
        <div className={`px-7 ${isWaiting ? "mb-6" : "mb-8"}`}>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Last 5 posts</div>
          <div className="grid grid-cols-5 gap-2">
            {c.posts.map((p, i) => (
              <a key={i} href={platUrl} target="_blank" rel="noopener noreferrer"
                className="relative block aspect-[9/14] cursor-pointer overflow-hidden rounded-xl bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={`${c.name} — ${p.type}`} loading="lazy" className="h-full w-full object-cover" />
                {/* The like and comment pair used to sit here over a gradient.
                    Both are gone, and the gradient with them — it existed only
                    to keep that white text legible. What is back is the view
                    count, which is real per-post reach rather than a vanity
                    figure, and it is the same data the Performance tiles above
                    are derived from. */}
                <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">{p.type}</div>
                <div className="absolute bottom-1.5 left-1.5 inline-flex items-center rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-white">{p.views} views</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Action bar (pending only) */}
      {isWaiting && (
        <div className="flex items-center gap-3 border-t border-black/[0.06] bg-white px-7 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-neutral-400">Waiting on you</div>
            <div className="truncate text-xs text-neutral-500">Liking <strong className="text-neutral-700">{c.name}</strong> tunes who MoonTech matches you with</div>
          </div>
          {/* Dislike asks first. A like is one click — it costs nothing to
              be wrong about — but a pass teaches the matcher to stop
              reaching for a whole kind of creator, and that is worth one
              question. */}
          <button onClick={() => onAskPass(c)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-black/[0.1] bg-white px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 active:scale-[0.98]">
            <ThumbsDown size={16} weight="fill" /> Dislike
          </button>
          <button onClick={() => onDecide(c.id, "liked")}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#4D2FB0] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F2596] active:scale-[0.98]">
            <ThumbsUp size={16} weight="fill" /> Like
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function CreatorsPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Creators");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [creators, setCreators] = useState<Creator[]>(CREATORS_SEED);
  const [tab, setTab] = useState<Signal>("waiting");
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");

  const total = creators.length;
  const done = creators.filter((c) => c.status !== "waiting").length;
  const progPct = total ? Math.round((done / total) * 100) : 0;

  /* Every count on this screen comes from the same ten creators. The tab
     counts used to carry hardcoded lifetime offsets (+620 liked, +297
     passed) on top of the live figure, which made the header contradict
     itself in the same row: "2 of 10 reviewed" beside "Liked 621". There
     is no decision history in the model, so none is displayed. */
  const tabCount: Record<Signal, number> = {
    waiting: creators.filter((c) => c.status === "waiting").length,
    liked: creators.filter((c) => c.status === "liked").length,
    passed: creators.filter((c) => c.status === "passed").length,
  };

  const tabList = creators.filter((c) => c.status === tab);
  const q = search.trim().toLowerCase();
  const shown = tabList.filter((c) => !q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q));
  const waitingList = creators.filter((c) => c.status === "waiting");
  const selected = tabList.find((c) => c.id === selectedId) ?? tabList[0];

  function switchTab(t: Signal) {
    setTab(t);
    setSearch("");
    const first = creators.find((c) => c.status === t);
    if (first) setSelectedId(first.id);
  }

  function decide(id: number, decision: Signal) {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision } : c)));
    if (tab === "waiting") {
      const remaining = waitingList.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedId(remaining[Math.min(waitingList.findIndex((c) => c.id === id), remaining.length - 1)].id);
    } else {
      // acting on a decided profile — keep it selected as it moves tabs
      setSelectedId(id);
    }
  }

  function navPrev() {
    const i = waitingList.findIndex((c) => c.id === selectedId);
    if (i > 0) setSelectedId(waitingList[i - 1].id);
  }
  function navNext() {
    const i = waitingList.findIndex((c) => c.id === selectedId);
    if (i >= 0 && i < waitingList.length - 1) setSelectedId(waitingList[i + 1].id);
  }

  /* ── The pass, in two steps ──
     Sibling of the ad decline dialog, and gated the same way: at least one
     reason, an optional note, Escape cancels. What it does is different.
     An ad decline stops something publishing; this is a MATCHING SIGNAL —
     the brand never preapproves or blocks a creator, so the question is
     "what should we stop reaching for", never "is she in or out". ── */
  const [passing, setPassing] = useState<Creator | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  /* The reasons live beside the roster rather than on it, so undoing a
     signal is a delete and leaves nothing behind. */
  const [passNotes, setPassNotes] = useState<Record<number, { reasons: string[]; note: string }>>({});
  const passBox = useRef<HTMLDivElement | null>(null);
  const noteBox = useRef<HTMLTextAreaElement | null>(null);

  const askPass = (c: Creator) => { setReasons([]); setNote(""); setPassing(c); };

  /* Cancel. Escape and the scrim both land here, and neither may pass —
     the point of the dialog is that this is the easy exit. */
  const closePass = useCallback(() => {
    setPassing(null);
    setReasons([]);
    setNote("");
  }, []);

  const toggleReason = (id: string) =>
    setReasons((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  /* At least one reason is required. The note is not: the reasons are what
     the matcher can act on, and free text is the exception. */
  const canPass = reasons.length > 0;

  function confirmPass() {
    if (!passing || reasons.length === 0) return;
    setPassNotes((p) => ({ ...p, [passing.id]: { reasons, note: note.trim() } }));
    decide(passing.id, "passed");
    closePass();
  }

  /* Undo returns her to Waiting and forgets the reasons — a signal has to
     be as easy to withdraw as it was to give. */
  function undoPass(id: number) {
    setPassNotes((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    decide(id, "waiting");
  }

  /* Focus trap, autofocus and focus restore. The trap is not decoration:
     a Tab that escaped the card would land on the Like button behind the
     scrim — the one click this dialog exists to slow down. The element to
     restore to is read BEFORE focus moves, and only restored if it is
     still in the document: the button that opened this often becomes a
     different button once the signal lands. */
  useEffect(() => {
    const box = passBox.current;
    if (!passing || !box) return;
    const restore = document.activeElement as HTMLElement | null;
    noteBox.current?.focus();

    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !box) return;
      const stops = Array.from(
        box.querySelectorAll<HTMLElement>("textarea, input:not([disabled]), button:not([disabled])")
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
  }, [passing]);

  /* Escape cancels, even from inside the textarea. It never passes. */
  useEffect(() => {
    if (!passing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); closePass(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [passing, closePass]);

  return (
    <div className="flex h-screen overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <Sidebar
        collapsed={collapsed}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Slim chrome */}
        <header className="flex h-[67px] shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/90 px-4 backdrop-blur-sm">
          <button
            onClick={() => { if (window.innerWidth < 768) setMobileOpen((o) => !o); else setCollapsed((o) => !o); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100">
            <List size={18} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: INK }}>Creators</span>
            <div className="ml-3 hidden items-center gap-2 sm:flex">
              <div className="h-1 w-[120px] overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full rounded-full bg-[#4D2FB0] transition-all duration-500" style={{ width: `${progPct}%` }} />
              </div>
              <span className="whitespace-nowrap text-[11px] text-neutral-400">{done} of {total} reviewed</span>
            </div>
          </div>
          {/* Tabs + actions */}
          <div className="flex items-center gap-2.5">
            <div className="flex gap-0.5 rounded-lg bg-neutral-100 p-0.5">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => switchTab(t.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    tab === t.key ? "bg-[#4D2FB0] text-white" : "text-neutral-500 hover:text-neutral-700"
                  }`}>
                  {t.label} <span className={tab === t.key ? "opacity-70" : "opacity-50"}>{tabCount[t.key]}</span>
                </button>
              ))}
            </div>
            <NotificationCenter />
            <div className="relative">
              <button onClick={() => setUserMenuOpen((o) => !o)}
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

        {/* Two-column body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[300px_1fr]">
          {/* Queue */}
          <aside className="hidden flex-col overflow-y-auto border-r border-black/[0.06] bg-[#FAFAFA] md:flex">
            <div className="sticky top-0 z-[2] border-b border-black/[0.06] bg-[#FAFAFA]/95 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 shadow-sm">
                <MagnifyingGlass size={13} className="shrink-0 text-neutral-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search creators…"
                  className="w-full bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              {shown.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-neutral-400">No creators match your filters.</div>
              ) : shown.map((c) => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    c.id === selected?.id ? "bg-white shadow-sm ring-1 ring-black/[0.06]" : "hover:bg-white/70"
                  }`}>
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ background: c.colors[0] }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold" style={{ color: INK }}>{c.name}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-400">{c.niche}</div>
                  </div>
                  {c.status === "liked" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
                  {c.status === "passed" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />}
                </button>
              ))}
            </div>
          </aside>

          {/* Detail */}
          {selected ? (
            <Detail c={selected} waitingList={waitingList} onPrev={navPrev} onNext={navNext}
              onDecide={decide} onAskPass={askPass} onUndoPass={undoPass}
              passInfo={passNotes[selected.id]} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 bg-white p-10 text-center">
              <div className="text-[13px] font-semibold" style={{ color: INK }}>No creators here</div>
              <div className="text-xs text-neutral-400">Decisions you make will appear in the relevant tab.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── THE PASS DIALOG ──
             The only two-step decision on this screen. It asks what to stop
             matching — never whether the person is allowed here — because
             the brand does not preapprove creators; MoonTech matches them.
             Confirm is one button, Cancel is the other, and Escape is
             Cancel: the easy exit is the one that changes nothing. ── */}
      {passing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div aria-hidden="true" onClick={closePass} className="absolute inset-0" />
          <div
            ref={passBox}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pass-title"
            className="relative max-h-full w-full max-w-[520px] overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
          >
            <h2 id="pass-title" className="pr-9 text-[17px] font-bold" style={{ color: INK }}>
              Why isn&apos;t {passing.name} a match?
            </h2>
            {/* The subtitle carries the whole model of this screen: a signal
                tunes matching, and it does not stand between the creator
                and the platform. */}
            <p className="mt-1 pr-9 text-[12.5px] leading-snug text-neutral-500">
              This tunes who MoonTech matches you with. It isn&apos;t a decision about her — she keeps
              working with every other brand, and you can undo it any time.
            </p>
            <button
              onClick={closePass}
              aria-label="Cancel, leave her in matching"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Reasons, not a blank box. Each one is measured against the
                brand's criteria, so the matcher gets something it can act
                on. Two columns so all six fit without a scroll. */}
            <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CREATOR_PASS_REASONS.map((r) => {
                const on = reasons.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-[12.5px] leading-snug transition-colors ${
                      on ? "border-[#4D2FB0] bg-[#4D2FB0]/[0.05]" : "border-black/[0.08] bg-white hover:border-black/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleReason(r.id)}
                      className="mt-px h-4 w-4 shrink-0 accent-[#4D2FB0]"
                    />
                    <span style={{ color: on ? "#4D2FB0" : INK }}>{r.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="pass-note" className="text-[12.5px] font-semibold" style={{ color: INK }}>
                  Anything else? <span className="font-medium text-neutral-400">Optional</span>
                </label>
                {/* The limit is stated, not discovered when typing stops. */}
                <span className={`text-[11px] font-medium tabular-nums ${
                  note.length >= NOTE_MAX ? "text-[#D70015]" : "text-neutral-400"
                }`}>
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id="pass-note"
                ref={noteBox}
                value={note}
                maxLength={NOTE_MAX}
                rows={2}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add anything that would sharpen the matching…"
                className="mt-1.5 w-full resize-none rounded-xl border border-black/[0.06] bg-[#fafafa] p-3 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 focus:border-[#4D2FB0] focus:ring-2 focus:ring-[#4D2FB0]/25"
                style={{ color: INK }}
              />
            </div>

            <div className="mt-4 flex items-stretch gap-2.5">
              <button
                onClick={closePass}
                className="flex flex-1 items-center justify-center rounded-xl bg-white px-4 py-3 text-[13px] font-semibold ring-1 ring-black/[0.08] transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]"
                style={{ color: INK }}
              >
                Cancel
              </button>
              {/* Ink, not red: red on this screen means needs-your-action,
                  and a tuning signal is not an alarm. Disabled until a
                  reason is ticked — a signal with nothing attached teaches
                  the matcher nothing, which is what this dialog exists to
                  prevent. */}
              <button
                onClick={confirmPass}
                disabled={!canPass}
                aria-disabled={!canPass}
                title={canPass ? undefined : "Pick at least one reason"}
                className={`flex flex-[1.5] items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0] ${
                  canPass ? "bg-[#191234] text-white hover:bg-[#191234]/90" : "cursor-not-allowed bg-neutral-100 text-neutral-400"
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
