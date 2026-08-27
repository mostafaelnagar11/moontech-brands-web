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
  postsPerWeek,
} from "../lib/campaigns";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const INK = "#191234";

/* Flag emojis for the country codes used in `topCountries`. */
const COUNTRY_FLAGS: Record<string, string> = {
  UAE: "🇦🇪", KSA: "🇸🇦", Kuwait: "🇰🇼", Qatar: "🇶🇦", Bahrain: "🇧🇭",
  Oman: "🇴🇲", Egypt: "🇪🇬", Jordan: "🇯🇴", Lebanon: "🇱🇧",
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
type Signal = "waiting" | "liked" | "passed";
type Platform = "Instagram" | "TikTok" | "YouTube";

interface Post { img: string; views: string; type: string }
interface Creator {
  id: number; initials: string; name: string; handle: string; niche: string;
  platform: Platform; followers: number; score: number; gcAudience: number;
  avgViews: number; totalPosts: number; contentQuality: "Premium" | "High" | "Medium";
  brandConflict: string; location: string; topCountries: string; audienceAge: string;
  audienceGender: string; postFreq: string; activeSince: string; status: Signal;
  colors: [string, string]; bio: string; avatar: string; posts: Post[];
}

const CREATORS_SEED: Creator[] = [
  { id: 1, initials: "LA", name: "Layla Al Rashid", handle: "@layla.style", niche: "Fashion", platform: "Instagram", followers: 84200, score: 92, gcAudience: 71, avgViews: 18400, totalPosts: 847, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 42%, KSA 29%, Kuwait 12%", audienceAge: "25–34 (62%)", audienceGender: "Female 78%", postFreq: "4–5x/week", activeSince: "2019", status: "waiting", colors: ["#2D1B6B", "#4A2BA0"], bio: "Sharing everyday luxury & curated fashion from Dubai. Partner with brands that align with my aesthetic.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop", views: "22K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop", views: "18K", type: "Post" }, { img: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&h=400&fit=crop", views: "24K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop", views: "16K", type: "Post" }, { img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=400&fit=crop", views: "19K", type: "Story" }] },
  { id: 2, initials: "NA", name: "Nour Abdulkarim", handle: "@nourbeauty", niche: "Beauty", platform: "Instagram", followers: 52300, score: 87, gcAudience: 68, avgViews: 11200, totalPosts: 612, contentQuality: "High", brandConflict: "None", location: "KSA", topCountries: "KSA 55%, UAE 25%, Kuwait 9%", audienceAge: "22–32 (71%)", audienceGender: "Female 91%", postFreq: "6x/week", activeSince: "2020", status: "waiting", colors: ["#831843", "#BE185D"], bio: "Beauty, skincare and honest reviews. Based in Riyadh. Only work with brands I actually use.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop", views: "14K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=400&fit=crop", views: "11K", type: "Post" }, { img: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300&h=400&fit=crop", views: "18K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&h=400&fit=crop", views: "13K", type: "Post" }] },
  { id: 3, initials: "SK", name: "Sara Al Khalifa", handle: "@saraxstyle", niche: "Luxury", platform: "Instagram", followers: 214000, score: 95, gcAudience: 82, avgViews: 42100, totalPosts: 1204, contentQuality: "Premium", brandConflict: "Minor (Farfetch)", location: "UAE", topCountries: "UAE 48%, KSA 22%, Bahrain 10%", audienceAge: "28–38 (58%)", audienceGender: "Female 74%", postFreq: "3x/week", activeSince: "2017", status: "waiting", colors: ["#1A1A2E", "#3A3A5A"], bio: "Luxury fashion & travel. Building a community for women who appreciate the finer things. Dubai based.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop", views: "48K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=400&fit=crop", views: "41K", type: "Post" }, { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop", views: "55K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop", views: "38K", type: "Post" }, { img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop", views: "44K", type: "Story" }] },
  { id: 4, initials: "DM", name: "Dina Mostafa", handle: "@dinamode", niche: "Fashion", platform: "TikTok", followers: 128000, score: 89, gcAudience: 61, avgViews: 95400, totalPosts: 430, contentQuality: "High", brandConflict: "None", location: "Egypt", topCountries: "Egypt 38%, UAE 23%, KSA 18%", audienceAge: "18–28 (74%)", audienceGender: "Female 86%", postFreq: "Daily", activeSince: "2021", status: "waiting", colors: ["#0C4A6E", "#1D5F8A"], bio: "Fashion hauls, outfit ideas & styling tips. Creating content my audience actually watches till the end.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop", views: "112K", type: "Video" }, { img: "https://images.unsplash.com/photo-1549062573-27a9b2b8a3b1?w=300&h=400&fit=crop", views: "89K", type: "Video" }, { img: "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=300&h=400&fit=crop", views: "124K", type: "Video" }, { img: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=400&fit=crop", views: "78K", type: "Video" }, { img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=400&fit=crop", views: "96K", type: "Video" }] },
  { id: 5, initials: "RM", name: "Rania Mansour", handle: "@raniamansour", niche: "Lifestyle", platform: "Instagram", followers: 38700, score: 81, gcAudience: 73, avgViews: 8200, totalPosts: 520, contentQuality: "Medium", brandConflict: "None", location: "KSA", topCountries: "KSA 60%, UAE 20%, Jordan 10%", audienceAge: "24–34 (65%)", audienceGender: "Female 82%", postFreq: "3–4x/week", activeSince: "2020", status: "waiting", colors: ["#14532D", "#1A7A3F"], bio: "Everyday moments, home & family life. Authentic content for the modern GCC woman.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=400&fit=crop", views: "8K", type: "Post" }, { img: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&h=400&fit=crop", views: "11K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=400&fit=crop", views: "7K", type: "Post" }, { img: "https://images.unsplash.com/photo-1484327973588-c31f829103fe?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=400&fit=crop", views: "6K", type: "Story" }] },
  { id: 6, initials: "HK", name: "Hana Khalid", handle: "@hanakofficial", niche: "Beauty", platform: "YouTube", followers: 92000, score: 84, gcAudience: 65, avgViews: 24500, totalPosts: 218, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 44%, KSA 28%, Kuwait 11%", audienceAge: "20–30 (68%)", audienceGender: "Female 88%", postFreq: "2x/week", activeSince: "2018", status: "waiting", colors: ["#7C1D1D", "#991B1B"], bio: "Deep-dive beauty reviews, tutorials & honest brand callouts. 5 years of content, millions of views.",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop", views: "28K", type: "Video" }, { img: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=400&fit=crop", views: "31K", type: "Video" }, { img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=400&fit=crop", views: "22K", type: "Video" }, { img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=400&fit=crop", views: "19K", type: "Video" }, { img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=400&fit=crop", views: "25K", type: "Video" }] },
  { id: 7, initials: "AJ", name: "Amira Jaber", handle: "@amira.j", niche: "Fitness", platform: "Instagram", followers: 47500, score: 78, gcAudience: 69, avgViews: 9100, totalPosts: 388, contentQuality: "Medium", brandConflict: "None", location: "UAE", topCountries: "UAE 52%, KSA 24%, Bahrain 8%", audienceAge: "22–32 (70%)", audienceGender: "Female 79%", postFreq: "4x/week", activeSince: "2021", status: "waiting", colors: ["#1A3A5C", "#2563EB"], bio: "Personal trainer & wellness creator. Helping women build strength without the gym intimidation.",
    avatar: "https://images.unsplash.com/photo-1563306406-e66174fa3787?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop", views: "11K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop", views: "8K", type: "Post" }, { img: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=300&h=400&fit=crop", views: "14K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=400&fit=crop", views: "7K", type: "Story" }] },
  { id: 8, initials: "LN", name: "Lina Naser", handle: "@linastyle_ae", niche: "Luxury", platform: "Instagram", followers: 310000, score: 91, gcAudience: 77, avgViews: 58000, totalPosts: 1620, contentQuality: "Premium", brandConflict: "Competing (Namshi)", location: "UAE", topCountries: "UAE 51%, KSA 24%, Kuwait 9%", audienceAge: "27–40 (54%)", audienceGender: "Female 71%", postFreq: "3x/week", activeSince: "2016", status: "waiting", colors: ["#4C1D95", "#6D28D9"], bio: "Luxury fashion, interior design and travel. One of UAE's earliest luxury lifestyle creators.",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=400&fit=crop", views: "68K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=300&h=400&fit=crop", views: "54K", type: "Post" }, { img: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=400&fit=crop", views: "72K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", views: "61K", type: "Post" }, { img: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&h=400&fit=crop", views: "58K", type: "Story" }] },
  { id: 9, initials: "SA", name: "Sana Abadi", handle: "@sana.ae", niche: "Fashion", platform: "Instagram", followers: 61200, score: 88, gcAudience: 74, avgViews: 13800, totalPosts: 705, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 46%, KSA 30%, Kuwait 12%", audienceAge: "24–34 (67%)", audienceGender: "Female 83%", postFreq: "5x/week", activeSince: "2020", status: "liked", colors: ["#064E3B", "#059669"], bio: "Styling tips, wardrobe essentials and conscious fashion from Dubai.",
    avatar: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop", views: "16K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=300&h=400&fit=crop", views: "13K", type: "Post" }, { img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop", views: "18K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop", views: "12K", type: "Post" }, { img: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=300&h=400&fit=crop", views: "14K", type: "Story" }] },
  { id: 10, initials: "MI", name: "Maya Ibrahim", handle: "@mayai_bh", niche: "Lifestyle", platform: "Instagram", followers: 29800, score: 73, gcAudience: 45, avgViews: 5600, totalPosts: 298, contentQuality: "Medium", brandConflict: "None", location: "Bahrain", topCountries: "Bahrain 38%, KSA 22%, UAE 17%", audienceAge: "20–30 (72%)", audienceGender: "Female 87%", postFreq: "3x/week", activeSince: "2022", status: "passed", colors: ["#78350F", "#92400E"], bio: "Bahrain-based lifestyle creator covering food, culture and everyday moments.",
    avatar: "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=400&fit=crop", views: "6K", type: "Post" }, { img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=400&fit=crop", views: "5K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=300&h=400&fit=crop", views: "7K", type: "Post" }, { img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300&h=400&fit=crop", views: "4K", type: "Post" }, { img: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=400&fit=crop", views: "5K", type: "Story" }] },
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

/** "25–34 (62%)" or "25–34" → [25, 34]. null when there is no range to read. */
function ageRange(s: string): [number, number] | null {
  const m = s.match(/(\d+)\s*[–-]\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

// Platforms a creator is active on — primary first, plus a deterministic
// set of others so profiles show as multi-platform.
function platformsFor(c: Creator): Platform[] {
  const others = (["Instagram", "TikTok", "YouTube"] as Platform[]).filter((p) => p !== c.platform);
  if (c.id % 3 === 0) return [c.platform];
  if (c.id % 2 === 0) return [c.platform, others[0]];
  return [c.platform, others[0], others[1]];
}

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
  const platforms = platformsFor(c);
  const isWaiting = c.status === "waiting";
  const idx = waitingList.findIndex((x) => x.id === c.id);
  const hasPrev = idx > 0, hasNext = idx >= 0 && idx < waitingList.length - 1;

  const topCountries = c.topCountries.split(",").map((seg) => {
    const [code, ...rest] = seg.trim().split(" ");
    return { code, pct: rest.join(" ") };
  });

  /* ── The confidence checklist ──
     Every row is a criterion THIS brand set, the creator's own figure
     against it, and whether it clears. A row that does not clear is still
     shown, in neutral: the matcher already weighed it, so it is context,
     not an alert. Red on this screen means "needs your action" and nothing
     the matcher has already priced in qualifies. ── */
  const vt = viewThrough(c.avgViews, c.followers);
  const ppw = postsPerWeek(c.postFreq);
  const rival = c.brandConflict.match(/\(([^)]+)\)/)?.[1];

  /* Markets are checked as coverage: the brand named the markets it sells
     into, so a market missing from her top three is a real gap — but the
     wording says "not in her top three" rather than "no audience there",
     because the model only carries three countries per creator. */
  const marketsHit = criteria.markets.filter((m) => topCountries.some((t) => t.code === m));
  const marketsMissed = criteria.markets.filter((m) => !marketsHit.includes(m));

  /* Age is checked as how much of the BRAND'S buyer band she reaches, not
     how wide her own band is — a creator whose audience is 18–28 overlaps
     a 25–34 buyer by three years, and that is a third of the buyer, not a
     match. Half the band is the bar; an unreadable band never passes on
     optimism. */
  const cAge = ageRange(c.audienceAge);
  const bAge = ageRange(criteria.ageBand);
  const ageOverlap = cAge && bAge
    ? [Math.max(cAge[0], bAge[0]), Math.min(cAge[1], bAge[1])] as const
    : null;
  const ageCovered = ageOverlap ? Math.max(ageOverlap[1] - ageOverlap[0], 0) : 0;
  const ageBandSpan = bAge ? bAge[1] - bAge[0] : 0;
  const ageOk = ageBandSpan > 0 && ageCovered / ageBandSpan >= 0.5;

  const checks: { label: string; ok: boolean; node: React.ReactNode }[] = [
    {
      label: "Region",
      ok: c.gcAudience >= criteria.minGccAudience,
      node: `${c.gcAudience}% of her audience is in the Gulf · you asked for ${criteria.minGccAudience}%+`,
    },
    {
      label: "Markets",
      ok: marketsMissed.length === 0,
      /* The flag treatment is deliberate and stays: a country list reads
         faster as flags than as three-letter codes. */
      node: (
        <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>
            {marketsHit.length} of your {criteria.markets.length}{" "}
            {criteria.markets.length === 1 ? "market" : "markets"} — her top countries:
          </span>
          {topCountries.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className="text-[13px] leading-none">{COUNTRY_FLAGS[f.code] ?? f.code}</span>
              <span>{f.pct}</span>
            </span>
          ))}
          {marketsMissed.length > 0 && (
            <span className="text-neutral-500">
              · {marketsMissed.join(", ")} not in her top three
            </span>
          )}
        </span>
      ),
    },
    {
      label: "Buyer age",
      ok: ageOk,
      /* "Overlaps", not "meets": this line has to read the same whether
         the row cleared or not — the tick is what says which. */
      node: ageOverlap && ageCovered > 0
        ? ageCovered === ageBandSpan
          ? `Her audience skews ${c.audienceAge} · covers your ${criteria.ageBand} buyer`
          : `Her audience skews ${c.audienceAge} · overlaps your ${criteria.ageBand} buyer at ${ageOverlap[0]}–${ageOverlap[1]}`
        : `Her audience skews ${c.audienceAge} · your buyer is ${criteria.ageBand}`,
    },
    {
      label: "Reach",
      ok: vt >= criteria.minViewThrough,
      node: `${pct1(vt)} of her audience watches · you asked for ${pct1(criteria.minViewThrough)}+`,
    },
    {
      label: "Cadence",
      ok: ppw !== null && ppw >= criteria.minPostsPerWeek,
      node: ppw === null
        ? `She posts ${c.postFreq} — not a weekly figure we can check against ${criteria.minPostsPerWeek}+ a week`
        : `${c.postFreq} · you asked for ${criteria.minPostsPerWeek}+ a week`,
    },
    {
      label: "Exclusivity",
      ok: !rival,
      node: rival
        ? `Also publishes for ${rival} · logged, not blocking`
        : "No competing brand in her recent work",
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
                {platforms.map((pf) => {
                  const P = PLAT[pf];
                  return (
                    <a key={pf} href={P.url(slug)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 no-underline transition hover:border-[#4D2FB0]/30 hover:text-[#4D2FB0]">
                      <P.Icon size={13} weight="fill" /> {pf}
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
