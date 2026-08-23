/* ------------------------------------------------------------------ */
/* Campaign + ad model.                                                */
/*                                                                      */
/* A CAMPAIGN IS A PHASE. A brand does not create campaigns and does     */
/* not name them: it works through an ordered ladder of phases, one at   */
/* a time, and each phase is a campaign in its own right with its own    */
/* budget, its own window, its own creators and its own numbers.         */
/*                                                                      */
/* The ladder is UNBOUNDED. Three phases have names — Warm-up, Scale,    */
/* Peak — and past that a phase is titled by its number alone. Nothing   */
/* here may assume a length of three.                                    */
/*                                                                      */
/* Phases run STRICTLY IN SEQUENCE, never side by side, so a brand's     */
/* ladder holds at most one Live phase. A phase must reach 80% of its    */
/* revenue target to unlock the next one, which the brand then funds.    */
/*                                                                      */
/* EACH BRAND HAS ITS OWN LADDER. Every number below is scoped to a      */
/* brandId; nothing is shared between brands, and no screen may total    */
/* across them.                                                          */
/*                                                                      */
/* `rev` and `roas` are PER PHASE — what this phase alone earned against */
/* what this phase alone was given. They are safe to sum along a         */
/* brand's ladder. They were run-cumulative before and were not.         */
/* ------------------------------------------------------------------ */

/* Live   — funded, running, metered against its target.
   Ready  — unlocked by its predecessor crossing 80%; awaiting payment.
   Locked — queued. Its predecessor has not crossed 80% yet, so it
            cannot be funded and has no numbers of its own.
   Ended  — finished. */
export type CampaignStatus = "Live" | "Ready" | "Locked" | "Ended";
export type Platform = "Instagram" | "TikTok" | "YouTube";

/* The named rungs. The ladder runs past them, so this is a lookup for
   the first three, NOT the length of anything. */
export const PHASE_NAMES = ["Warm-up", "Scale", "Peak"] as const;

/** A phase-campaign's title — its name and its identity. */
export const phaseTitle = (no: number) =>
  no <= PHASE_NAMES.length ? `Phase ${no} · ${PHASE_NAMES[no - 1]}` : `Phase ${no}`;

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
/* Campaigns — one per phase, one ladder per brand                     */
/* ------------------------------------------------------------------ */
export interface Campaign {
  id: string;
  brandId: string;              // whose ladder this rung belongs to
  phaseNo: number;              // 1..n — unbounded
  dates: string;                // THIS phase's own window
  status: CampaignStatus;
  budget: number;               // THIS phase's budget, nothing else's
  guaranteedRoas: number;       // the multiple promised on this phase
  rev: number;                  // earned by THIS phase alone
  revLabel: string;
  revTarget: number | null;     // null until the phase is funded
  revPct: number | null;
  roas: string;                 // rev ÷ budget, this phase only
  threshold: string | null;
  thresholdGreen: boolean;
  /* Set only on a Ready phase, and it funds ITSELF — never a sibling.
     A Locked phase has no `due`: it is not payable yet. */
  due: { label: string; amount: number; reason: string } | null;
  creators: number | null;
  adsLive: number | null;
  adsTotal: number | null;
  content: number | null;
  faces: AdCreator[];
}

/* Three brands, three ladders at three different stages.
   Ounass runs past Peak, which is the case a fixed three-rung model
   could not represent. Luna's Phase 3 is Locked, not Ready — its
   predecessor is at 55% and the 80% line has not been crossed.
   FreshGrocer has just funded Phase 1 and has nothing measured yet. */
export const CAMPAIGNS: Campaign[] = [
  /* ── Ounass ─────────────────────────────────────────────────── */
  {
    id: "ounass-phase-1", brandId: "ounass", phaseNo: 1,
    dates: "Jan 8 – Feb 6, 2026", status: "Ended",
    budget: 1000, guaranteedRoas: 5,
    rev: 5200, revLabel: "$5,200", revTarget: 5000, revPct: 104, roas: "5.2×",
    threshold: null, thresholdGreen: false, due: null,
    creators: 12, adsLive: 41, adsTotal: 48, content: 41,
    faces: [byId(1), byId(9), byId(5)],
  },
  {
    id: "ounass-phase-2", brandId: "ounass", phaseNo: 2,
    dates: "Feb 10 – Apr 12, 2026", status: "Live",
    budget: 3000, guaranteedRoas: 5,
    rev: 12600, revLabel: "$12,600", revTarget: 15000, revPct: 84, roas: "4.2×",
    threshold: "80% unlock line crossed — Phase 3 is ready to fund", thresholdGreen: true,
    due: null,
    creators: 24, adsLive: 125, adsTotal: 200, content: 89,
    faces: [byId(1), byId(3), byId(9)],
  },
  {
    id: "ounass-phase-3", brandId: "ounass", phaseNo: 3,
    dates: "Starts when funded", status: "Ready",
    budget: 6000, guaranteedRoas: 5,
    rev: 0, revLabel: "$0", revTarget: null, revPct: null, roas: "—",
    threshold: null, thresholdGreen: false,
    due: { label: "Fund Phase 3", amount: 6000,
           reason: "Phase 2 crossed the 80% line at 84%" },
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [byId(5), byId(7), byId(8)],
  },
  {
    id: "ounass-phase-4", brandId: "ounass", phaseNo: 4,
    dates: "Not scheduled", status: "Locked",
    budget: 10000, guaranteedRoas: 5,
    rev: 0, revLabel: "$0", revTarget: null, revPct: null, roas: "—",
    threshold: null, thresholdGreen: false, due: null,
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [],
  },

  /* ── Luna Beauty ────────────────────────────────────────────── */
  {
    id: "luna-phase-1", brandId: "luna", phaseNo: 1,
    dates: "Feb 1 – Mar 2, 2026", status: "Ended",
    budget: 500, guaranteedRoas: 5,
    rev: 2400, revLabel: "$2,400", revTarget: 2500, revPct: 96, roas: "4.8×",
    threshold: null, thresholdGreen: false, due: null,
    creators: 9, adsLive: 28, adsTotal: 33, content: 28,
    faces: [byId(2), byId(6), byId(10)],
  },
  {
    id: "luna-phase-2", brandId: "luna", phaseNo: 2,
    dates: "Mar 10 – May 8, 2026", status: "Live",
    budget: 1500, guaranteedRoas: 5,
    rev: 4100, revLabel: "$4,100", revTarget: 7500, revPct: 55, roas: "2.7×",
    threshold: "On pace — 80% unlock line about 9 days away", thresholdGreen: false,
    due: null,
    creators: 18, adsLive: 96, adsTotal: 150, content: 96,
    faces: [byId(2), byId(4), byId(6)],
  },
  {
    id: "luna-phase-3", brandId: "luna", phaseNo: 3,
    dates: "Not scheduled", status: "Locked",
    budget: 3000, guaranteedRoas: 5,
    rev: 0, revLabel: "$0", revTarget: null, revPct: null, roas: "—",
    threshold: null, thresholdGreen: false, due: null,
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [],
  },

  /* ── FreshGrocer ────────────────────────────────────────────── */
  {
    id: "fresh-phase-1", brandId: "fresh", phaseNo: 1,
    dates: "Aug 18 – Sep 16, 2026", status: "Live",
    budget: 750, guaranteedRoas: 5,
    rev: 310, revLabel: "$310", revTarget: 3750, revPct: 8, roas: "0.41×",
    threshold: "Deploying to matched creators — first results in a few days",
    thresholdGreen: false, due: null,
    creators: 7, adsLive: 12, adsTotal: 20, content: 12,
    faces: [byId(10), byId(7), byId(2)],
  },
];

/* ------------------------------------------------------------------ */
/* Ladder helpers — the ladder is derived by ordering a brand's        */
/* phases, never stored as an array on any single phase.                */
/* ------------------------------------------------------------------ */

/** One brand's phases, in order. The ladder. */
export const ladderFor = (brandId: string, roster: Campaign[] = CAMPAIGNS) =>
  roster.filter((c) => c.brandId === brandId).sort((a, b) => a.phaseNo - b.phaseNo);

/** The phase after this one on the same brand's ladder, if it exists. */
export const nextPhase = (c: Campaign, roster: Campaign[] = CAMPAIGNS) =>
  ladderFor(c.brandId, roster).find((x) => x.phaseNo > c.phaseNo);

/** The phase before this one on the same brand's ladder, if it exists. */
export const prevPhase = (c: Campaign, roster: Campaign[] = CAMPAIGNS) =>
  [...ladderFor(c.brandId, roster)].reverse().find((x) => x.phaseNo < c.phaseNo);

/* A phase has no creative until it has been funded and started. Ads are
   seeded against every phase that CAN run, so this is what keeps a
   Ready or Locked phase from showing drafts nobody has briefed yet. */
export const phaseHasStarted = (c: Campaign) =>
  c.status === "Live" || c.status === "Ended";

/** Phases run in sequence, so a brand has at most one Live phase. */
export const livePhase = (brandId: string, roster: Campaign[] = CAMPAIGNS) =>
  ladderFor(brandId, roster).find((c) => c.status === "Live");

/** The one phase awaiting payment, if the brand has unlocked one. */
export const duePhase = (brandId: string, roster: Campaign[] = CAMPAIGNS) =>
  ladderFor(brandId, roster).find((c) => c.status === "Ready" && c.due);

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
  /* ── Ounass · Phase 2 · Scale — drafts waiting on the brand ── */
  { id: "ad-sp-1", campaignId: "ounass-phase-2", creatorId: 1,
    product: "Linen Wrap Dress — Sand", format: "Reel", platform: "Instagram",
    caption: "Six days in the linen wrap dress, no steamer, no ironing — here's how it actually held up.",
    img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop",
    submitted: "3h ago", track: "MT-OU-P2-1147", signal: "none" },
  { id: "ad-sp-2", campaignId: "ounass-phase-2", creatorId: 3,
    product: "Structured Leather Tote", format: "Reel", platform: "Instagram",
    caption: "Is the tote worth it? I carried it every day for three weeks — honest verdict at the end.",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop",
    submitted: "5h ago", track: "MT-OU-P2-1152", signal: "none" },
  { id: "ad-sp-3", campaignId: "ounass-phase-2", creatorId: 9,
    product: "Ribbed Knit Set — Ecru", format: "Reel", platform: "Instagram",
    caption: "Tried the ribbed knit set in two sizes so you don't have to. Sizing notes at the end.",
    img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop",
    submitted: "9h ago", track: "MT-OU-P2-1160", signal: "none" },
  { id: "ad-sp-4", campaignId: "ounass-phase-2", creatorId: 4,
    product: "Belted Trench — Stone", format: "Video", platform: "TikTok",
    caption: "Unboxing the trench everyone keeps asking about. First impressions, completely unedited.",
    img: "https://images.unsplash.com/photo-1542295669297-4d352b042bca?w=300&h=400&fit=crop",
    submitted: "14h ago", track: "MT-OU-P2-1163", signal: "none" },
  { id: "ad-sp-5", campaignId: "ounass-phase-2", creatorId: 1,
    product: "Gold Vermeil Hoops", format: "Reel", platform: "Instagram",
    caption: "The hoops I haven't taken off in a month — gym, shower, everything. Still gold.",
    img: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-OU-P2-1171", signal: "none" },
  { id: "ad-sp-6", campaignId: "ounass-phase-2", creatorId: 6,
    product: "Ceramide Night Serum 30ml", format: "Video", platform: "YouTube",
    caption: "Full review: three weeks on the ceramide serum, my skin diary and the one thing I'd change.",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-OU-P2-1174", signal: "none" },
  { id: "ad-sp-7", campaignId: "ounass-phase-2", creatorId: 9,
    product: "Poplin Shirt Dress", format: "Reel", platform: "Instagram",
    caption: "Poplin shirt dress, desk to dinner with one change. Fabric close-ups so you can judge it.",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-OU-P2-1180", signal: "liked" },
  { id: "ad-sp-8", campaignId: "ounass-phase-2", creatorId: 3,
    product: "Amber Oud Eau de Parfum", format: "Reel", platform: "Instagram",
    caption: "I wore Amber Oud for thirty days before reviewing it. The truth about the sillage.",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=400&fit=crop",
    submitted: "3d ago", track: "MT-OU-P2-1186", signal: "disliked" },

  /* ── Luna Beauty · Phase 2 · Scale — drafts waiting on the brand ── */
  { id: "ad-rf-1", campaignId: "luna-phase-2", creatorId: 2,
    product: "Rose Cleansing Balm", format: "Reel", platform: "Instagram",
    caption: "One week on the rose balm, before and after with no filter. Honest skin update.",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop",
    submitted: "6h ago", track: "MT-LU-P2-0841", signal: "none" },
  { id: "ad-rf-2", campaignId: "luna-phase-2", creatorId: 4,
    product: "Embroidered Kaftan — Ivory", format: "Video", platform: "TikTok",
    caption: "Six kaftan looks in one try-on, with the sizing I actually ordered.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop",
    submitted: "11h ago", track: "MT-LU-P2-0846", signal: "none" },
  { id: "ad-rf-3", campaignId: "luna-phase-2", creatorId: 6,
    product: "Oud Body Mist", format: "Video", platform: "YouTube",
    caption: "Layering the oud mist for iftar — full review, and who it's not for.",
    img: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-LU-P2-0852", signal: "none" },
  { id: "ad-rf-4", campaignId: "luna-phase-2", creatorId: 4,
    product: "Ramadan Gift Set", format: "Video", platform: "TikTok",
    caption: "What's actually inside the gift set, unboxed piece by piece before you buy it.",
    img: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-LU-P2-0858", signal: "liked" },
  { id: "ad-rf-5", campaignId: "luna-phase-2", creatorId: 2,
    product: "Vitamin C Serum 30ml", format: "Reel", platform: "Instagram",
    caption: "Fourteen days on the vitamin C serum — here's my skin, and here's the receipt.",
    img: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300&h=400&fit=crop",
    submitted: "3d ago", track: "MT-LU-P2-0863", signal: "none" },
  /* ── Ounass · Phase 3 · Peak — cut and waiting, hidden until funded ──
     Every phase that can run needs a queue, or funding a phase drops the
     brand into a live campaign with nothing to review. */
  { id: "ad-ou3-1", campaignId: "ounass-phase-3", creatorId: 5,
    product: "Silk Slip Dress — Midnight", format: "Reel", platform: "Instagram",
    caption: "The slip dress I said I'd never buy. Three months on, here's what changed my mind.",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=400&fit=crop",
    submitted: "2h ago", track: "MT-OU-P3-2041", signal: "none" },
  { id: "ad-ou3-2", campaignId: "ounass-phase-3", creatorId: 7,
    product: "Cashmere Wrap Coat — Camel", format: "Reel", platform: "Instagram",
    caption: "Cashmere coat, one winter of real wear. Pilling, warmth and whether it's worth it.",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop",
    submitted: "7h ago", track: "MT-OU-P3-2047", signal: "none" },
  { id: "ad-ou3-3", campaignId: "ounass-phase-3", creatorId: 8,
    product: "Sculpted Heel Mules", format: "Video", platform: "TikTok",
    caption: "Walked a full day in the sculpted mules so you know before you order.",
    img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop",
    submitted: "11h ago", track: "MT-OU-P3-2053", signal: "none" },
  { id: "ad-ou3-4", campaignId: "ounass-phase-3", creatorId: 3,
    product: "Quilted Shoulder Bag", format: "Reel", platform: "Instagram",
    caption: "What actually fits in the quilted bag — packed and unpacked, no cuts.",
    img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=400&fit=crop",
    submitted: "Yesterday", track: "MT-OU-P3-2060", signal: "none" },
  { id: "ad-ou3-5", campaignId: "ounass-phase-3", creatorId: 6,
    product: "Retinol Night Concentrate", format: "Video", platform: "YouTube",
    caption: "Eight weeks on the retinol concentrate — full skin diary, including the bad week.",
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-OU-P3-2066", signal: "none" },
  { id: "ad-ou3-6", campaignId: "ounass-phase-3", creatorId: 1,
    product: "Tailored Wool Trousers", format: "Reel", platform: "Instagram",
    caption: "Tailored wool trousers on a short frame — the hem I asked for and why.",
    img: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=300&h=400&fit=crop",
    submitted: "3d ago", track: "MT-OU-P3-2072", signal: "none" },

  /* ── FreshGrocer · Phase 1 · Warm-up — its first drafts ── */
  { id: "ad-fg1-1", campaignId: "fresh-phase-1", creatorId: 10,
    product: "Weekly Produce Box — Medium", format: "Reel", platform: "Instagram",
    caption: "Everything in the medium produce box, weighed and priced against my usual shop.",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=400&fit=crop",
    submitted: "4h ago", track: "MT-FG-P1-0112", signal: "none" },
  { id: "ad-fg1-2", campaignId: "fresh-phase-1", creatorId: 2,
    product: "Cold-Pressed Juice Set", format: "Reel", platform: "Instagram",
    caption: "Five days of the juice set, honestly — which two I'd actually reorder.",
    img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=300&h=400&fit=crop",
    submitted: "16h ago", track: "MT-FG-P1-0118", signal: "none" },
  { id: "ad-fg1-3", campaignId: "fresh-phase-1", creatorId: 7,
    product: "Same-Day Pantry Delivery", format: "Video", platform: "TikTok",
    caption: "Ordered at 9am, unpacking at 2pm. Timestamped, nothing edited out.",
    img: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&h=400&fit=crop",
    submitted: "2d ago", track: "MT-FG-P1-0125", signal: "none" },
];

/** Every draft waiting on the brand for one phase-campaign. */
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
