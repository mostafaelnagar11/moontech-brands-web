/* ------------------------------------------------------------------ */
/* Campaign + ad model — ported from the MoonTech mobile app so both    */
/* clients agree on every number, name and image.                       */
/*                                                                      */
/* PHASE_TRACKER on the dashboard is the spine: the campaign names,      */
/* their revenue strings and ROAS values are adopted verbatim. Budgets   */
/* follow the wizard's 10/30/60 split, and each ROAS is rev ÷ spend —    */
/* the numbers derive, they aren't decorative.                           */
/*                                                                      */
/* NOTE — the campaigns screen must NEVER print a portfolio revenue      */
/* total. $34,940 is the lifetime figure owned by the dashboard hero;    */
/* summing this roster gives a different number.                         */
/* ------------------------------------------------------------------ */

export type CampaignStatus = "Live" | "Ready" | "Ended";
export type PhaseState = "Done" | "Active" | "Pending";
export type Platform = "Instagram" | "TikTok" | "YouTube";

export const PHASE_NAMES = ["Warm-up", "Scale", "Peak"] as const;

/* The creators an ad can come from. Avatars and post images are
   byte-identical to app/creators/page.tsx, so the review stage paints
   from a cache the creators screen has already warmed. */
export interface AdCreator {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  platform: Platform;
  brandConflict: string;
}

export const AD_CREATORS: AdCreator[] = [
  { id: 1, name: "Layla Al Rashid", handle: "@layla.style", followers: 84200, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces" },
  { id: 2, name: "Nour Abdulkarim", handle: "@nourbeauty", followers: 52300, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=160&h=160&fit=crop&crop=faces" },
  { id: 3, name: "Sara Al Khalifa", handle: "@saraxstyle", followers: 214000, platform: "Instagram", brandConflict: "Minor (Farfetch)",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=160&h=160&fit=crop&crop=faces" },
  { id: 4, name: "Dina Mostafa", handle: "@dinamode", followers: 128000, platform: "TikTok", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=160&h=160&fit=crop&crop=faces" },
  { id: 5, name: "Rania Mansour", handle: "@raniamansour", followers: 38700, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=160&h=160&fit=crop&crop=faces" },
  { id: 6, name: "Hana Khalid", handle: "@hanakofficial", followers: 92000, platform: "YouTube", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=160&h=160&fit=crop&crop=faces" },
  { id: 7, name: "Amira Jaber", handle: "@amira.j", followers: 47500, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1563306406-e66174fa3787?w=160&h=160&fit=crop&crop=faces" },
  { id: 8, name: "Lina Naser", handle: "@linastyle_ae", followers: 310000, platform: "Instagram", brandConflict: "Competing (Namshi)",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=160&h=160&fit=crop&crop=faces" },
  { id: 9, name: "Sana Abadi", handle: "@sana.ae", followers: 61200, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=160&h=160&fit=crop&crop=faces" },
  { id: 10, name: "Maya Ibrahim", handle: "@mayai_bh", followers: 29800, platform: "Instagram", brandConflict: "None",
    avatar: "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=160&h=160&fit=crop&crop=faces" },
];

const byId = (id: number) => AD_CREATORS.find((c) => c.id === id)!;

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */
export interface Campaign {
  id: string;
  name: string;
  dates: string;
  status: CampaignStatus;
  phases: [PhaseState, PhaseState, PhaseState];
  phaseNo: 1 | 2 | 3;
  phaseName: "Warm-up" | "Scale" | "Peak";
  budgets: [number, number, number];             // 10/30/60 of total budget
  rev: number;
  revLabel: string;
  revTarget: number | null;                      // null when the phase hasn't run
  revPct: number | null;
  roas: string;
  threshold: string | null;
  thresholdGreen: boolean;
  due: { label: string; phase: 2 | 3; amount: number; reason: string } | null;
  creators: number | null;
  adsLive: number | null;
  adsTotal: number | null;
  content: number | null;
  faces: AdCreator[];
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: "spring-2026", name: "Spring 2026", dates: "Apr 1 – May 30, 2026",
    status: "Live", phases: ["Active", "Pending", "Pending"],
    phaseNo: 1, phaseName: "Warm-up", budgets: [1000, 3000, 6000],
    rev: 840, revLabel: "$840", revTarget: 1000, revPct: 84, roas: "0.84×",
    threshold: "80% unlock line crossed — Phase 2 unlocks soon", thresholdGreen: true,
    due: { label: "Fund Phase 2", phase: 2, amount: 3000,
           reason: "Phase 2 unlocked — Phase 1 hit 84%" },
    creators: 24, adsLive: 125, adsTotal: 200, content: 89,
    faces: [byId(1), byId(3), byId(9)],
  },
  {
    id: "ramadan-flash", name: "Ramadan Flash", dates: "Mar 10 – Apr 20, 2026",
    status: "Live", phases: ["Done", "Active", "Pending"],
    phaseNo: 2, phaseName: "Scale", budgets: [500, 1500, 3000],
    rev: 3840, revLabel: "$3,840", revTarget: 5000, revPct: 77, roas: "1.9×",
    threshold: "On pace — 80% unlock line 3 days away", thresholdGreen: false,
    due: null,
    creators: 38, adsLive: 96, adsTotal: 150, content: 142,
    faces: [byId(2), byId(4), byId(6)],
  },
  {
    id: "brand-launch", name: "Brand Launch", dates: "Feb 2 – Jun 30, 2026",
    status: "Ready", phases: ["Done", "Done", "Pending"],
    phaseNo: 3, phaseName: "Peak", budgets: [265, 795, 1590],
    rev: 5400, revLabel: "$5,400", revTarget: null, revPct: null, roas: "5.1×",
    threshold: null, thresholdGreen: false,
    due: { label: "Fund Phase 3", phase: 3, amount: 1590,
           reason: "Phases 1 & 2 complete — 5.1× ROAS delivered" },
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [byId(5), byId(7), byId(8)],
  },
  {
    id: "summer-push", name: "Summer Push", dates: "Apr 12 – Sep 30, 2025",
    status: "Ended", phases: ["Done", "Done", "Done"],
    phaseNo: 3, phaseName: "Peak", budgets: [183, 549, 1098],
    rev: 11340, revLabel: "$11,340", revTarget: null, revPct: null, roas: "6.2×",
    threshold: null, thresholdGreen: false, due: null,
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [byId(9), byId(10), byId(1)],
  },
];

export const fmtUSD = (n: number) => `$${n.toLocaleString("en-US")}`;

export function fmtCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}

/* ------------------------------------------------------------------ */
/* Ads — drafts the creator has finished and sent in.                   */
/*                                                                      */
/* NOTHING HERE HAS POSTED. The creator has finished the piece and it    */
/* waits on the brand, so there are no view counts — an unpublished ad   */
/* has not been seen by anyone. What can honestly be shown before it     */
/* posts is the creator's typical reach, labelled as an estimate.        */
/*                                                                      */
/* Like    → it publishes, and more of the phase budget goes behind      */
/*           creative like it.                                           */
/* Dislike → it never posts, and the matcher stops reaching for that     */
/*           pattern.                                                    */
/* ------------------------------------------------------------------ */
export type AdFormat = "Reel" | "Video" | "Story" | "Post";
export type AdSignal = "none" | "liked" | "disliked";

export interface Ad {
  id: string;
  campaignId: string;
  creatorId: number;
  product: string;
  caption: string;
  format: AdFormat;
  platform: Platform;
  img: string;
  submitted: string;
  track: string;
  signal: AdSignal;
}

/* The stage wants more pixels than a post tile. Same host, same photo,
   one larger crop — derived from the stored URL so the two can never
   drift apart. */
export const adHero = (img: string) => img.replace("w=300&h=400", "w=900&h=1200");

export const ADS: Ad[] = [
  /* ── Spring 2026 · drafts waiting on the brand ── */
  { id: "ad-sp-1", campaignId: "spring-2026", creatorId: 1,
    product: "Linen Wrap Dress — Sand", format: "Reel", platform: "Instagram",
    caption: "Six days in the linen wrap dress, no steamer, no ironing — here's how it actually held up.",
    img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop",
    submitted: "3h ago", track: "MT-SP26-1147", signal: "none" },
  { id: "ad-sp-2", campaignId: "spring-2026", creatorId: 3,
    product: "Structured Leather Tote", format: "Reel", platform: "Instagram",
    caption: "Is the tote worth it? I carried it every day for three weeks — honest verdict at the end.",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop",
    submitted: "5h ago", track: "MT-SP26-1152", signal: "none" },
  { id: "ad-sp-3", campaignId: "spring-2026", creatorId: 9,
    product: "Ribbed Knit Set — Ecru", format: "Reel", platform: "Instagram",
    caption: "Tried the ribbed knit set in two sizes so you don't have to. Sizing notes at the end.",
    img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop",
    submitted: "9h ago", track: "MT-SP26-1160", signal: "none" },
  { id: "ad-sp-4", campaignId: "spring-2026", creatorId: 4,
    product: "Belted Trench — Stone", format: "Video", platform: "TikTok",
    caption: "Unboxing the trench everyone keeps asking about. First impressions, completely unedited.",
    img: "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=300&h=400&fit=crop",
    submitted: "14h ago", track: "MT-SP26-1163", signal: "none" },
  { id: "ad-sp-5", campaignId: "spring-2026", creatorId: 1,
    product: "Gold Vermeil Hoops", format: "Reel", platform: "Instagram",
    caption: "The hoops I haven't taken off in a month — gym, shower, everything. Still gold.",
    img: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-SP26-1171", signal: "none" },
  { id: "ad-sp-6", campaignId: "spring-2026", creatorId: 6,
    product: "Ceramide Night Serum 30ml", format: "Video", platform: "YouTube",
    caption: "Full review: three weeks on the ceramide serum, my skin diary and the one thing I'd change.",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-SP26-1174", signal: "none" },
  { id: "ad-sp-7", campaignId: "spring-2026", creatorId: 9,
    product: "Poplin Shirt Dress", format: "Reel", platform: "Instagram",
    caption: "Poplin shirt dress, desk to dinner with one change. Fabric close-ups so you can judge it.",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-SP26-1180", signal: "liked" },
  { id: "ad-sp-8", campaignId: "spring-2026", creatorId: 3,
    product: "Amber Oud Eau de Parfum", format: "Reel", platform: "Instagram",
    caption: "I wore Amber Oud for thirty days before reviewing it. The truth about the sillage.",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop",
    submitted: "3d ago", track: "MT-SP26-1186", signal: "disliked" },

  /* ── Ramadan Flash · drafts waiting on the brand ── */
  { id: "ad-rf-1", campaignId: "ramadan-flash", creatorId: 2,
    product: "Rose Cleansing Balm", format: "Reel", platform: "Instagram",
    caption: "One week on the rose balm, before and after with no filter. Honest skin update.",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop",
    submitted: "6h ago", track: "MT-RF26-0841", signal: "none" },
  { id: "ad-rf-2", campaignId: "ramadan-flash", creatorId: 4,
    product: "Embroidered Kaftan — Ivory", format: "Video", platform: "TikTok",
    caption: "Six kaftan looks in one try-on, with the sizing I actually ordered.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop",
    submitted: "11h ago", track: "MT-RF26-0846", signal: "none" },
  { id: "ad-rf-3", campaignId: "ramadan-flash", creatorId: 6,
    product: "Oud Body Mist", format: "Video", platform: "YouTube",
    caption: "Layering the oud mist for iftar — full review, and who it's not for.",
    img: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-RF26-0852", signal: "none" },
  { id: "ad-rf-4", campaignId: "ramadan-flash", creatorId: 4,
    product: "Ramadan Gift Set", format: "Video", platform: "TikTok",
    caption: "What's actually inside the gift set, unboxed piece by piece before you buy it.",
    img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-RF26-0858", signal: "liked" },
  { id: "ad-rf-5", campaignId: "ramadan-flash", creatorId: 2,
    product: "Vitamin C Serum 30ml", format: "Reel", platform: "Instagram",
    caption: "Fourteen days on the vitamin C serum — here's my skin, and here's the receipt.",
    img: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300&h=400&fit=crop",
    submitted: "3d ago", track: "MT-RF26-0863", signal: "none" },
];

export const adsFor = (campaignId: string) => ADS.filter((a) => a.campaignId === campaignId);

export const adCreator = (a: Ad) => AD_CREATORS.find((c) => c.id === a.creatorId)!;

/* An unposted ad has no views. This is the creator's own audience taken
   at the rate their existing posts actually reach — an estimate, and
   labelled as one everywhere it appears. */
export const estReach = (followers: number) => fmtCount(Math.round(followers * 0.42));

/* The three automatic checks that run on every draft BEFORE it reaches
   the brand — the reason a go-ahead is one click and not a review
   meeting. Two are constant; the third derives from the creator's real
   brandConflict, so the panel can carry an amber advisory instead of
   three decorative green ticks. An advisory is LOGGED, not blocking. */
export interface AdCheck { label: string; detail: string; clean: boolean }

export function adChecks(a: Ad): AdCheck[] {
  const c = adCreator(a);
  const rival = c.brandConflict.match(/\(([^)]+)\)/)?.[1];
  return [
    { label: "Product matched to your catalogue",
      detail: `${a.product} — in stock, price synced`, clean: true },
    { label: "Paid partnership disclosed",
      detail: `Label set on the ad · tracking code ${a.track}`, clean: true },
    rival
      ? { label: "Overlap logged, not blocked",
          detail: `${c.name} also publishes for ${rival}. Allowed under your guidelines.`, clean: false }
      : { label: "Inside your brand guidelines",
          detail: "No competing brand in her last 90 days", clean: true },
  ];
}
