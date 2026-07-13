"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  List, MagnifyingGlass, ArrowLeft, ArrowRight, CheckCircle, ArrowUpRight, MapPin, SignOut,
  ThumbsUp, ThumbsDown, InstagramLogo, TiktokLogo, YoutubeLogo, type Icon,
} from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import NotificationCenter from "../components/NotificationCenter";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";

/* Flag emojis for the country codes used in `topCountries`. */
const COUNTRY_FLAGS: Record<string, string> = {
  UAE: "🇦🇪", KSA: "🇸🇦", Kuwait: "🇰🇼", Qatar: "🇶🇦", Bahrain: "🇧🇭",
  Oman: "🇴🇲", Egypt: "🇪🇬", Jordan: "🇯🇴", Lebanon: "🇱🇧",
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
type Status = "pending" | "approved" | "rejected";
type Platform = "Instagram" | "TikTok" | "YouTube";

interface Post { img: string; views: string; type: string }
interface Creator {
  id: number; initials: string; name: string; handle: string; niche: string;
  platform: Platform; followers: number; score: number; gcAudience: number;
  avgViews: number; totalPosts: number; contentQuality: "Premium" | "High" | "Medium";
  brandConflict: string; location: string; topCountries: string; audienceAge: string;
  audienceGender: string; postFreq: string; activeSince: string; status: Status;
  colors: [string, string]; bio: string; avatar: string; posts: Post[];
}

const CREATORS_SEED: Creator[] = [
  { id: 1, initials: "LA", name: "Layla Al Rashid", handle: "@layla.style", niche: "Fashion", platform: "Instagram", followers: 84200, score: 92, gcAudience: 71, avgViews: 18400, totalPosts: 847, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 42%, KSA 29%, Kuwait 12%", audienceAge: "25–34 (62%)", audienceGender: "Female 78%", postFreq: "4–5x/week", activeSince: "2019", status: "pending", colors: ["#2D1B6B", "#4A2BA0"], bio: "Sharing everyday luxury & curated fashion from Dubai. Partner with brands that align with my aesthetic.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop", views: "22K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop", views: "18K", type: "Post" }, { img: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&h=400&fit=crop", views: "24K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop", views: "16K", type: "Post" }, { img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=400&fit=crop", views: "19K", type: "Story" }] },
  { id: 2, initials: "NA", name: "Nour Abdulkarim", handle: "@nourbeauty", niche: "Beauty", platform: "Instagram", followers: 52300, score: 87, gcAudience: 68, avgViews: 11200, totalPosts: 612, contentQuality: "High", brandConflict: "None", location: "KSA", topCountries: "KSA 55%, UAE 25%, Kuwait 9%", audienceAge: "22–32 (71%)", audienceGender: "Female 91%", postFreq: "6x/week", activeSince: "2020", status: "pending", colors: ["#831843", "#BE185D"], bio: "Beauty, skincare and honest reviews. Based in Riyadh. Only work with brands I actually use.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop", views: "14K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=400&fit=crop", views: "11K", type: "Post" }, { img: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300&h=400&fit=crop", views: "18K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&h=400&fit=crop", views: "13K", type: "Post" }] },
  { id: 3, initials: "SK", name: "Sara Al Khalifa", handle: "@saraxstyle", niche: "Luxury", platform: "Instagram", followers: 214000, score: 95, gcAudience: 82, avgViews: 42100, totalPosts: 1204, contentQuality: "Premium", brandConflict: "Minor (Farfetch)", location: "UAE", topCountries: "UAE 48%, KSA 22%, Bahrain 10%", audienceAge: "28–38 (58%)", audienceGender: "Female 74%", postFreq: "3x/week", activeSince: "2017", status: "pending", colors: ["#1A1A2E", "#3A3A5A"], bio: "Luxury fashion & travel. Building a community for women who appreciate the finer things. Dubai based.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop", views: "48K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=400&fit=crop", views: "41K", type: "Post" }, { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop", views: "55K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop", views: "38K", type: "Post" }, { img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop", views: "44K", type: "Story" }] },
  { id: 4, initials: "DM", name: "Dina Mostafa", handle: "@dinamode", niche: "Fashion", platform: "TikTok", followers: 128000, score: 89, gcAudience: 61, avgViews: 95400, totalPosts: 430, contentQuality: "High", brandConflict: "None", location: "Egypt", topCountries: "Egypt 38%, UAE 23%, KSA 18%", audienceAge: "18–28 (74%)", audienceGender: "Female 86%", postFreq: "Daily", activeSince: "2021", status: "pending", colors: ["#0C4A6E", "#1D5F8A"], bio: "Fashion hauls, outfit ideas & styling tips. Creating content my audience actually watches till the end.",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop", views: "112K", type: "Video" }, { img: "https://images.unsplash.com/photo-1549062573-27a9b2b8a3b1?w=300&h=400&fit=crop", views: "89K", type: "Video" }, { img: "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=300&h=400&fit=crop", views: "124K", type: "Video" }, { img: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=300&h=400&fit=crop", views: "78K", type: "Video" }, { img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=400&fit=crop", views: "96K", type: "Video" }] },
  { id: 5, initials: "RM", name: "Rania Mansour", handle: "@raniamansour", niche: "Lifestyle", platform: "Instagram", followers: 38700, score: 81, gcAudience: 73, avgViews: 8200, totalPosts: 520, contentQuality: "Medium", brandConflict: "None", location: "KSA", topCountries: "KSA 60%, UAE 20%, Jordan 10%", audienceAge: "24–34 (65%)", audienceGender: "Female 82%", postFreq: "3–4x/week", activeSince: "2020", status: "pending", colors: ["#14532D", "#1A7A3F"], bio: "Everyday moments, home & family life. Authentic content for the modern GCC woman.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=400&fit=crop", views: "8K", type: "Post" }, { img: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&h=400&fit=crop", views: "11K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=400&fit=crop", views: "7K", type: "Post" }, { img: "https://images.unsplash.com/photo-1484327973588-c31f829103fe?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=400&fit=crop", views: "6K", type: "Story" }] },
  { id: 6, initials: "HK", name: "Hana Khalid", handle: "@hanakofficial", niche: "Beauty", platform: "YouTube", followers: 92000, score: 84, gcAudience: 65, avgViews: 24500, totalPosts: 218, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 44%, KSA 28%, Kuwait 11%", audienceAge: "20–30 (68%)", audienceGender: "Female 88%", postFreq: "2x/week", activeSince: "2018", status: "pending", colors: ["#7C1D1D", "#991B1B"], bio: "Deep-dive beauty reviews, tutorials & honest brand callouts. 5 years of content, millions of views.",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop", views: "28K", type: "Video" }, { img: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=400&fit=crop", views: "31K", type: "Video" }, { img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=400&fit=crop", views: "22K", type: "Video" }, { img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=400&fit=crop", views: "19K", type: "Video" }, { img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=400&fit=crop", views: "25K", type: "Video" }] },
  { id: 7, initials: "AJ", name: "Amira Jaber", handle: "@amira.j", niche: "Fitness", platform: "Instagram", followers: 47500, score: 78, gcAudience: 69, avgViews: 9100, totalPosts: 388, contentQuality: "Medium", brandConflict: "None", location: "UAE", topCountries: "UAE 52%, KSA 24%, Bahrain 8%", audienceAge: "22–32 (70%)", audienceGender: "Female 79%", postFreq: "4x/week", activeSince: "2021", status: "pending", colors: ["#1A3A5C", "#2563EB"], bio: "Personal trainer & wellness creator. Helping women build strength without the gym intimidation.",
    avatar: "https://images.unsplash.com/photo-1563306406-e66174fa3787?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop", views: "11K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop", views: "8K", type: "Post" }, { img: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=300&h=400&fit=crop", views: "14K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&h=400&fit=crop", views: "9K", type: "Post" }, { img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=400&fit=crop", views: "7K", type: "Story" }] },
  { id: 8, initials: "LN", name: "Lina Naser", handle: "@linastyle_ae", niche: "Luxury", platform: "Instagram", followers: 310000, score: 91, gcAudience: 77, avgViews: 58000, totalPosts: 1620, contentQuality: "Premium", brandConflict: "Competing (Namshi)", location: "UAE", topCountries: "UAE 51%, KSA 24%, Kuwait 9%", audienceAge: "27–40 (54%)", audienceGender: "Female 71%", postFreq: "3x/week", activeSince: "2016", status: "pending", colors: ["#4C1D95", "#6D28D9"], bio: "Luxury fashion, interior design and travel. One of UAE's earliest luxury lifestyle creators.",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=400&fit=crop", views: "68K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=300&h=400&fit=crop", views: "54K", type: "Post" }, { img: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=400&fit=crop", views: "72K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", views: "61K", type: "Post" }, { img: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&h=400&fit=crop", views: "58K", type: "Story" }] },
  { id: 9, initials: "SA", name: "Sana Abadi", handle: "@sana.ae", niche: "Fashion", platform: "Instagram", followers: 61200, score: 88, gcAudience: 74, avgViews: 13800, totalPosts: 705, contentQuality: "High", brandConflict: "None", location: "UAE", topCountries: "UAE 46%, KSA 30%, Kuwait 12%", audienceAge: "24–34 (67%)", audienceGender: "Female 83%", postFreq: "5x/week", activeSince: "2020", status: "approved", colors: ["#064E3B", "#059669"], bio: "Styling tips, wardrobe essentials and conscious fashion from Dubai.",
    avatar: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop", views: "16K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=300&h=400&fit=crop", views: "13K", type: "Post" }, { img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop", views: "18K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop", views: "12K", type: "Post" }, { img: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=300&h=400&fit=crop", views: "14K", type: "Story" }] },
  { id: 10, initials: "MI", name: "Maya Ibrahim", handle: "@mayai_bh", niche: "Lifestyle", platform: "Instagram", followers: 29800, score: 73, gcAudience: 45, avgViews: 5600, totalPosts: 298, contentQuality: "Medium", brandConflict: "None", location: "Bahrain", topCountries: "Bahrain 38%, KSA 22%, UAE 17%", audienceAge: "20–30 (72%)", audienceGender: "Female 87%", postFreq: "3x/week", activeSince: "2022", status: "rejected", colors: ["#78350F", "#92400E"], bio: "Bahrain-based lifestyle creator covering food, culture and everyday moments.",
    avatar: "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=160&h=160&fit=crop&crop=faces",
    posts: [{ img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=400&fit=crop", views: "6K", type: "Post" }, { img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=400&fit=crop", views: "5K", type: "Reel" }, { img: "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=300&h=400&fit=crop", views: "7K", type: "Post" }, { img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300&h=400&fit=crop", views: "4K", type: "Post" }, { img: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=400&fit=crop", views: "5K", type: "Story" }] },
];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}

// Parse a "22K" / "1.1M" style count back into a number.
function parseCount(s: string): number {
  const m = s.trim().match(/^([\d.]+)\s*([KM]?)$/i);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  return u === "M" ? v * 1_000_000 : u === "K" ? v * 1000 : v;
}

// Platforms a creator is active on — primary first, plus a deterministic
// set of others so profiles show as multi-platform.
function platformsFor(c: Creator): Platform[] {
  const others = (["Instagram", "TikTok", "YouTube"] as Platform[]).filter((p) => p !== c.platform);
  if (c.id % 3 === 0) return [c.platform];
  if (c.id % 2 === 0) return [c.platform, others[0]];
  return [c.platform, others[0], others[1]];
}

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Liked" },
  { key: "rejected", label: "Disliked" },
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
  c, pendingList, onPrev, onNext, onDecide,
}: {
  c: Creator;
  pendingList: Creator[];
  onPrev: () => void;
  onNext: () => void;
  onDecide: (id: number, d: Status) => void;
}) {
  const slug = c.handle.replace("@", "");
  const plat = PLAT[c.platform];
  const platUrl = plat.url(slug);
  const platforms = platformsFor(c);
  const isPending = c.status === "pending";
  const idx = pendingList.findIndex((x) => x.id === c.id);
  const hasPrev = idx > 0, hasNext = idx >= 0 && idx < pendingList.length - 1;

  const topCountries = c.topCountries.split(",").map((seg) => {
    const [code, ...rest] = seg.trim().split(" ");
    return { code, pct: rest.join(" ") };
  });

  const insights: { ok: boolean; node: React.ReactNode }[] = [
    {
      ok: true,
      node: (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>Top countries:</span>
          {topCountries.map((f, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-[13px] leading-none">{COUNTRY_FLAGS[f.code] ?? f.code}</span>
              <span>{f.pct}</span>
            </span>
          ))}
        </span>
      ),
    },
    { ok: c.contentQuality !== "Medium", node: `${c.contentQuality} content quality` },
    { ok: true, node: `Active since ${c.activeSince} · ${c.postFreq}` },
  ];

  const scoreColor = c.score >= 90 ? BRAND : c.score >= 80 ? "#059669" : "#D97706";
  const scoreLabel = c.score >= 90 ? "Excellent" : c.score >= 80 ? "Good" : "Fair";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-7 pt-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              {isPending && idx >= 0 ? `${idx + 1} of ${pendingList.length} pending` : `Viewing ${c.status === "rejected" ? "disliked" : "liked"} profile`}
            </div>
            {isPending && (
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
              <div className="inline-flex items-start gap-2 rounded-xl border border-[#4D2FB0]/12 bg-[#4D2FB0]/[0.05] px-3 py-2">
                <span className="shrink-0 text-xs opacity-50">✶</span>
                <span className="text-xs leading-relaxed text-neutral-600">{c.bio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status banner */}
        {c.status === "approved" && (
          <div className="mx-7 mb-6 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle size={16} weight="fill" className="text-green-600" />
            <span className="flex-1 text-[13px] font-semibold text-green-800">Liked — eligible for Ounass campaigns</span>
            <button onClick={() => onDecide(c.id, "rejected")}
              className="rounded-lg border border-green-200 px-2.5 py-1 text-xs text-neutral-500 transition hover:bg-white">Revoke</button>
          </div>
        )}
        {c.status === "rejected" && (
          <div className="mx-7 mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-red-600">✕</span>
            <span className="flex-1 text-[13px] font-semibold text-red-800">Disliked — not assigned to any campaign</span>
            <button onClick={() => onDecide(c.id, "approved")}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-[#4D2FB0] transition hover:bg-white">Like</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-5 px-7">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { lbl: "Brand Fit", val: `${c.score}%`, sub: scoreLabel, color: scoreColor, subCls: "text-neutral-400" },
              { lbl: "Avg. followers", val: fmt(c.followers), sub: "across platforms", color: INK, subCls: "text-neutral-400" },
              { lbl: "Avg views", val: fmt(c.avgViews), sub: "per post", color: INK, subCls: "text-neutral-400" },
              { lbl: "Total posts", val: c.totalPosts.toLocaleString(), sub: `since ${c.activeSince}`, color: INK, subCls: "text-neutral-400" },
            ].map((m) => (
              <div key={m.lbl} className="rounded-2xl border border-black/[0.06] bg-neutral-50/70 p-4">
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{m.lbl}</div>
                <div className="mt-1.5 text-[24px] font-semibold tabular-nums leading-none" style={{ color: m.color }}>{m.val}</div>
                <div className={`mt-1.5 text-[11px] ${m.subCls}`}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why we recommend */}
        <div className="mb-5 px-7">
          <div className="rounded-2xl border border-[#4D2FB0]/12 bg-[#4D2FB0]/[0.04] p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-xs">✶</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#4D2FB0]">Why we recommend</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${ins.ok ? "bg-green-100 text-green-600" : "bg-red-50 text-red-600"}`}>
                    <span className="text-[9px] font-bold">{ins.ok ? "✓" : "✕"}</span>
                  </span>
                  <span className="text-xs text-neutral-600">{ins.node}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Last 5 posts */}
        <div className={`px-7 ${isPending ? "mb-6" : "mb-8"}`}>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Last 5 posts</div>
          <div className="grid grid-cols-5 gap-2">
            {c.posts.map((p, i) => {
              const likes = parseCount(p.views);
              const comments = Math.max(1, Math.round(likes * 0.035));
              return (
                <a key={i} href={platUrl} target="_blank" rel="noopener noreferrer"
                  className="relative block aspect-[9/14] cursor-pointer overflow-hidden rounded-xl bg-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="post" loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">{p.type}</div>
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-start gap-2 px-2 text-[12px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95)]">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {fmt(likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      {fmt(comments)}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action bar (pending only) */}
      {isPending && (
        <div className="flex items-center gap-3 border-t border-black/[0.06] bg-white px-7 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-neutral-400">Make a decision</div>
            <div className="truncate text-xs text-neutral-500">Approval adds <strong className="text-neutral-700">{c.name}</strong> to your Ounass campaign pool</div>
          </div>
          <button onClick={() => onDecide(c.id, "rejected")}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-black/[0.1] bg-white px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 active:scale-[0.98]">
            <ThumbsDown size={16} weight="fill" /> Dislike
          </button>
          <button onClick={() => onDecide(c.id, "approved")}
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
  const [tab, setTab] = useState<Status>("pending");
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");

  const total = creators.length;
  const done = creators.filter((c) => c.status !== "pending").length;
  const progPct = total ? Math.round((done / total) * 100) : 0;

  const liveCount = (s: Status) => creators.filter((c) => c.status === s).length;
  // Live pending + believable lifetime totals for approved/skipped.
  const tabCount: Record<Status, number> = {
    pending: liveCount("pending"),
    approved: 620 + liveCount("approved"),
    rejected: 297 + liveCount("rejected"),
  };

  const tabList = creators.filter((c) => c.status === tab);
  const q = search.trim().toLowerCase();
  const shown = tabList.filter((c) => !q || c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q));
  const pendingList = creators.filter((c) => c.status === "pending");
  const selected = tabList.find((c) => c.id === selectedId) ?? tabList[0];

  function switchTab(t: Status) {
    setTab(t);
    setSearch("");
    const first = creators.find((c) => c.status === t);
    if (first) setSelectedId(first.id);
  }

  function decide(id: number, decision: Status) {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision } : c)));
    if (tab === "pending") {
      const remaining = pendingList.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedId(remaining[Math.min(pendingList.findIndex((c) => c.id === id), remaining.length - 1)].id);
    } else {
      // acting on an approved/skipped profile — keep it selected as it moves tabs
      setSelectedId(id);
    }
  }

  function navPrev() {
    const i = pendingList.findIndex((c) => c.id === selectedId);
    if (i > 0) setSelectedId(pendingList[i - 1].id);
  }
  function navNext() {
    const i = pendingList.findIndex((c) => c.id === selectedId);
    if (i >= 0 && i < pendingList.length - 1) setSelectedId(pendingList[i + 1].id);
  }

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
                    className="flex w-full items-center gap-2 px-4 py-3 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">
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
                    <div className="mt-0.5 text-[11px] text-neutral-400">{c.niche} · {fmt(c.followers)}</div>
                  </div>
                  {c.status === "approved" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
                  {c.status === "rejected" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />}
                </button>
              ))}
            </div>
          </aside>

          {/* Detail */}
          {selected ? (
            <Detail c={selected} pendingList={pendingList} onPrev={navPrev} onNext={navNext} onDecide={decide} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 bg-white p-10 text-center">
              <div className="text-[13px] font-semibold" style={{ color: INK }}>No creators here</div>
              <div className="text-xs text-neutral-400">Decisions you make will appear in the relevant tab.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
