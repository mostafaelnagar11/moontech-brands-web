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
  /* Brand fit, 0-100 — the same figure the creators screen shows for the
     same person, keyed on the same id. It is the one real per-ad score in
     the app, and it is what makes declining a strong match worth a
     second look. */
  fit: number;
}

/* At or above this, a decline is worth confirming: the matcher rated this
   creator a strong fit for the brand, so an accidental decline costs more
   than the click saved. */
export const HIGH_FIT = 90;

/* ------------------------------------------------------------------ */
/* Why a draft was declined                                            */
/*                                                                     */
/* Every reason is measured against THE BRIEF, not against taste. That */
/* is deliberate: "I don't like it" gives a creator nothing to act on,  */
/* while "the caption doesn't carry the brief's messaging" is a re-cut  */
/* they can actually make. It also keeps the decline defensible — the   */
/* brief is the thing both sides agreed to.                            */
/*                                                                     */
/* The brand picks at least one. Free text is the optional extra, not   */
/* the mechanism.                                                       */
/* ------------------------------------------------------------------ */
export const DECLINE_REASONS = [
  { id: "tone",      label: "Tone doesn't align with the brief" },
  { id: "product",   label: "Product use doesn't follow the brief's instructions" },
  { id: "specs",     label: "Doesn't meet the brief's technical specs (lighting, resolution, stability)" },
  { id: "caption",   label: "Caption/text doesn't reflect the brief's required messaging" },
  { id: "format",    label: "Doesn't meet the required format (aspect ratio, length)" },
  { id: "competing", label: "Competing brand/product visible in the content" },
] as const;

export type DeclineReasonId = (typeof DECLINE_REASONS)[number]["id"];

export const declineReasonLabel = (id: string) =>
  DECLINE_REASONS.find((r) => r.id === id)?.label ?? id;

/* ------------------------------------------------------------------ */
/* Why a creator isn't a match                                         */
/*                                                                     */
/* Siblings of DECLINE_REASONS, and anchored the same way: each one is  */
/* measured against THE BRAND'S CRITERIA (app/data.ts BrandCriteria),   */
/* not against taste. The difference from an ad is what the answer      */
/* does — an ad decline stops it publishing, while this is a MATCHING   */
/* SIGNAL. MoonTech picks the creators; this teaches it what to stop    */
/* reaching for. Nothing here blocks a person from the platform.        */
/* ------------------------------------------------------------------ */
export const CREATOR_PASS_REASONS = [
  { id: "markets",   label: "Audience isn't in our target markets" },
  { id: "age",       label: "Audience age doesn't match our buyer" },
  { id: "style",     label: "Content style doesn't fit our brand" },
  { id: "competing", label: "Publishes for a competing brand" },
  { id: "reach",     label: "Reach is low for the size of the following" },
  { id: "cadence",   label: "Doesn't publish often enough for a phase" },
] as const;

export type CreatorPassReasonId = (typeof CREATOR_PASS_REASONS)[number]["id"];

export const creatorPassReasonLabel = (id: string) =>
  CREATOR_PASS_REASONS.find((r) => r.id === id)?.label ?? id;

/* One character limit for anything the brand writes to a creator, so the
   two screens cannot disagree about it and the counter is the same
   promise in both places. */
export const NOTE_MAX = 280;

/* ------------------------------------------------------------------ */
/* Creator performance — the anti-vanity figure                        */
/*                                                                     */
/* Followers are a vanity number: Dima Sheikhly has 942K of them and    */
/* 13% of that audience watches, while Mais Mustafa has 44K and 43%.   */
/* Ranked by following, Dima is fourth on this roster and Mais ninth;   */
/* ranked by whether anyone actually turns up, Dima is last.           */
/*                                                                     */
/* So followers appear here ONLY as a denominator. The figure shown to  */
/* a brand is the share of an audience that turns up.                  */
/* ------------------------------------------------------------------ */
export const viewThrough = (avgViews: number, followers: number) =>
  followers > 0 ? avgViews / followers : 0;

export const pct1 = (n: number) => `${(n * 100).toFixed(n * 100 < 10 ? 1 : 0)}%`;

/** Median of a list — used to compare a creator with the brand's own
    matched roster rather than with an invented industry benchmark. */
export function median(xs: readonly number[]): number {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Posts per week parsed from cadence text ("4–5x/week", "3x/week").
    Returns the LOW end of a range, so a check never passes on optimism.
    null when the text is not a weekly cadence. */
export function postsPerWeek(freq: string): number | null {
  const m = freq.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*x\s*\/\s*week/i);
  return m ? Number(m[1]) : null;
}

/* A draft the brand never judges cannot sit in limbo forever — the phase is
   metered against a guarantee it cannot deliver if nothing publishes. After
   this many days an undecided draft goes live on its own. */
export const REVIEW_WINDOW_DAYS = 10;

/* `submitted` is display text ("3h ago", "Yesterday", "2d ago"), so the
   window countdown is parsed from it rather than stored twice and allowed
   to drift. Anything unparseable yields null and shows no countdown at all
   rather than a guess. */
export function draftAgeDays(submitted: string): number | null {
  if (/^\s*\d+\s*h\b/i.test(submitted)) return 0;
  if (/yesterday/i.test(submitted)) return 1;
  const d = submitted.match(/^\s*(\d+)\s*d\b/i);
  return d ? Number(d[1]) : null;
}

/** Days left in the review window, or null when the age is unknown. */
export function draftDaysLeft(submitted: string): number | null {
  const age = draftAgeDays(submitted);
  return age === null ? null : Math.max(REVIEW_WINDOW_DAYS - age, 0);
}

export const AD_CREATORS: AdCreator[] = [
  { id: 1, name: "Jawaher Alsuwaidi", handle: "@jawahralsuwaidi", followers: 78400, platform: "Instagram", brandConflict: "None", fit: 93,
    avatar: "/creators/jawahralsuwaidi/avatar.jpg" },
  { id: 2, name: "MakeupbyMemz", handle: "@makeupbymemz", followers: 135000, platform: "Instagram", brandConflict: "None", fit: 88,
    avatar: "/creators/makeupbymemz/avatar.jpg" },
  { id: 3, name: "Ola Farahat", handle: "@olafarahat", followers: 1300000, platform: "Instagram", brandConflict: "Minor (Farfetch)", fit: 90,
    avatar: "/creators/olafarahat/avatar.jpg" },
  { id: 4, name: "Mais Mustafa", handle: "@mais.mustafa", followers: 43600, platform: "TikTok", brandConflict: "None", fit: 84,
    avatar: "/creators/mais.mustafa/avatar.jpg" },
  { id: 5, name: "Asma Al Azmi", handle: "@asmaalazmii_", followers: 18200, platform: "Instagram", brandConflict: "None", fit: 79,
    avatar: "/creators/asmaalazmii_/avatar.jpg" },
  { id: 6, name: "Ghaliah Alsharif", handle: "@ghalya.mu2", followers: 1100000, platform: "TikTok", brandConflict: "Minor (Sephora ambassador)", fit: 95,
    avatar: "/creators/ghalya.mu2/avatar.jpg" },
  { id: 7, name: "Rebecca Kassab Al Azar", handle: "@rebeccarkassab", followers: 331000, platform: "Instagram", brandConflict: "Minor (The Smart Vendor)", fit: 86,
    avatar: "/creators/rebeccarkassab/avatar.jpg" },
  { id: 8, name: "Dima Sheikhly", handle: "@dimasheikhly", followers: 942000, platform: "Instagram", brandConflict: "Competing (Namshi)", fit: 91,
    avatar: "/creators/dimasheikhly/avatar.jpg" },
  { id: 9, name: "Paola El Sitt", handle: "@paola.elsitt", followers: 1000000, platform: "Instagram", brandConflict: "Minor (own brand, Joi)", fit: 87,
    avatar: "/creators/paola.elsitt/avatar.jpg" },
  { id: 10, name: "Noon Reviews", handle: "@skindew0", followers: 335600, platform: "TikTok", brandConflict: "Competing (Boutiqaat)", fit: 74,
    avatar: "/creators/skindew0/avatar.jpg" },
];

const byId = (id: number) => AD_CREATORS.find((c) => c.id === id)!;


/* ------------------------------------------------------------------ */
/* Campaigns — one per phase, one ladder per brand                     */
/* ------------------------------------------------------------------ */
export interface Campaign {
  id: string;
  brandId: string;              // whose ladder this rung belongs to
  phaseNo: number;              // 1..n — unbounded
  /* THIS phase's own window, as two facts rather than one string.
     A LIVE PHASE HAS NO END DATE: it runs until its successor is funded,
     and when that happens is the brand's decision, not a date we can
     print while it is still running. The three live phases used to carry
     a range and two of those end dates had already gone by. */
  start: string | null;         // null until the phase is funded
  end: string | null;           // null while Live — set when the phase ends
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
    start: "Jan 8, 2026", end: "Feb 6, 2026", status: "Ended",
    budget: 1000, guaranteedRoas: 5,
    rev: 5200, revLabel: "$5,200", revTarget: 5000, revPct: 104, roas: "5.2×",
    threshold: null, thresholdGreen: false, due: null,
    creators: 12, adsLive: 6,  adsTotal: 6,  content: 6,
    faces: [byId(1), byId(9), byId(5)],
  },
  {
    id: "ounass-phase-2", brandId: "ounass", phaseNo: 2,
    start: "Feb 10, 2026", end: null, status: "Live",
    budget: 3000, guaranteedRoas: 5,
    rev: 12600, revLabel: "$12,600", revTarget: 15000, revPct: 84, roas: "4.2×",
    threshold: "80% unlock line crossed — Phase 3 is ready to fund", thresholdGreen: true,
    due: null,
    creators: 24, adsLive: 6,  adsTotal: 13, content: 6,
    faces: [byId(1), byId(3), byId(9)],
  },
  {
    id: "ounass-phase-3", brandId: "ounass", phaseNo: 3,
    start: null, end: null, status: "Ready",
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
    start: null, end: null, status: "Locked",
    budget: 10000, guaranteedRoas: 5,
    rev: 0, revLabel: "$0", revTarget: null, revPct: null, roas: "—",
    threshold: null, thresholdGreen: false, due: null,
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [],
  },

  /* ── Luna Beauty ────────────────────────────────────────────── */
  {
    id: "luna-phase-1", brandId: "luna", phaseNo: 1,
    start: "Feb 1, 2026", end: "Mar 2, 2026", status: "Ended",
    budget: 500, guaranteedRoas: 5,
    rev: 2400, revLabel: "$2,400", revTarget: 2500, revPct: 96, roas: "4.8×",
    threshold: null, thresholdGreen: false, due: null,
    creators: 9,  adsLive: 4,  adsTotal: 4,  content: 4,
    faces: [byId(2), byId(6), byId(10)],
  },
  {
    id: "luna-phase-2", brandId: "luna", phaseNo: 2,
    start: "Mar 10, 2026", end: null, status: "Live",
    budget: 1500, guaranteedRoas: 5,
    rev: 4100, revLabel: "$4,100", revTarget: 7500, revPct: 55, roas: "2.7×",
    threshold: "On pace — 80% unlock line about 9 days away", thresholdGreen: false,
    due: null,
    creators: 18, adsLive: 4,  adsTotal: 8,  content: 4,
    faces: [byId(2), byId(4), byId(6)],
  },
  {
    id: "luna-phase-3", brandId: "luna", phaseNo: 3,
    start: null, end: null, status: "Locked",
    budget: 3000, guaranteedRoas: 5,
    rev: 0, revLabel: "$0", revTarget: null, revPct: null, roas: "—",
    threshold: null, thresholdGreen: false, due: null,
    creators: null, adsLive: null, adsTotal: null, content: null,
    faces: [],
  },

  /* ── FreshGrocer ────────────────────────────────────────────── */
  {
    id: "fresh-phase-1", brandId: "fresh", phaseNo: 1,
    start: "Aug 18, 2026", end: null, status: "Live",
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

/* How a phase's window reads, and the ONLY place that decides it.
   A phase with no start has not been funded, so it has no window to
   state — what it says instead depends on whether it is payable. A
   started phase with no end is running, and says so. */
export function phaseWindow(c: Campaign): string {
  if (!c.start) return c.status === "Ready" ? "Starts when funded" : "Not scheduled";
  return c.end ? `${c.start} \u2013 ${c.end}` : `Started ${c.start}`;
}

/** A short "Sep 3, 2026" for a window edge set as it happens. */
export const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

/* ------------------------------------------------------------------ */
/* VAT — one rate, one helper                                          */
/*                                                                     */
/* This used to be declared inside the phase detail route and inlined   */
/* as 0.05 in the wizard, which is how the same payment came to be      */
/* quoted four different ways across the app. Anything that shows a     */
/* price the brand will actually be charged uses withVat.               */
/* ------------------------------------------------------------------ */
export const VAT_RATE = 0.05;
export const vatOn = (n: number) => Math.round(n * VAT_RATE);
export const withVat = (n: number) => n + vatOn(n);

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

/* The stage and the post tile now paint the SAME file. Creative is served
   from /public at one size, so there is no larger crop to derive — this
   stays as the one place the stage asks for its image, which is what makes
   a second size a one-line change if we ever store one. */
export const adHero = (img: string) => img;

export const ADS: Ad[] = [
  /* ── Ounass · Phase 2 · Scale — drafts waiting on the brand ── */
  { id: "ad-sp-1", campaignId: "ounass-phase-2", creatorId: 1,
    product: "Linen Wrap Dress — Sand", format: "Reel", platform: "Instagram",
    caption: "Six days in the linen wrap dress, no steamer, no ironing — here's how it actually held up.",
    img: "/creators/jawahralsuwaidi/p1.jpg",
    submitted: "3h ago", track: "MT-OU-P2-1147", signal: "none" },
  { id: "ad-sp-2", campaignId: "ounass-phase-2", creatorId: 3,
    product: "Structured Leather Tote", format: "Reel", platform: "Instagram",
    caption: "Is the tote worth it? I carried it every day for three weeks — honest verdict at the end.",
    img: "/creators/olafarahat/p1.jpg",
    submitted: "5h ago", track: "MT-OU-P2-1152", signal: "none" },
  { id: "ad-sp-3", campaignId: "ounass-phase-2", creatorId: 9,
    product: "Ribbed Knit Set — Ecru", format: "Reel", platform: "Instagram",
    caption: "Tried the ribbed knit set in two sizes so you don't have to. Sizing notes at the end.",
    img: "/creators/paola.elsitt/p1.jpg",
    submitted: "9h ago", track: "MT-OU-P2-1160", signal: "none" },
  { id: "ad-sp-4", campaignId: "ounass-phase-2", creatorId: 4,
    product: "Belted Trench — Stone", format: "Video", platform: "TikTok",
    caption: "Unboxing the trench everyone keeps asking about. First impressions, completely unedited.",
    img: "/creators/mais.mustafa/p1.jpg",
    submitted: "14h ago", track: "MT-OU-P2-1163", signal: "none" },
  { id: "ad-sp-5", campaignId: "ounass-phase-2", creatorId: 1,
    product: "Gold Vermeil Hoops", format: "Reel", platform: "Instagram",
    caption: "The hoops I haven't taken off in a month — gym, shower, everything. Still gold.",
    img: "/creators/jawahralsuwaidi/p2.jpg",
    submitted: "Yesterday", track: "MT-OU-P2-1171", signal: "none" },
  { id: "ad-sp-6", campaignId: "ounass-phase-2", creatorId: 6,
    product: "Ceramide Night Serum 30ml", format: "Video", platform: "TikTok",
    caption: "Full review: three weeks on the ceramide serum, my skin diary and the one thing I'd change.",
    img: "/creators/ghalya.mu2/p1.jpg",
    submitted: "Yesterday", track: "MT-OU-P2-1174", signal: "none" },
  { id: "ad-sp-7", campaignId: "ounass-phase-2", creatorId: 9,
    product: "Printed Cut-Out Co-Ord", format: "Reel", platform: "Instagram",
    caption: "The printed co-ord in real sun and real wind. Chain-detail close-ups so you can judge it.",
    img: "/creators/paola.elsitt/p2.jpg",
    submitted: "2d ago", track: "MT-OU-P2-1180", signal: "liked" },
  { id: "ad-sp-8", campaignId: "ounass-phase-2", creatorId: 3,
    product: "Amber Oud Eau de Parfum", format: "Reel", platform: "Instagram",
    caption: "I wore Amber Oud for thirty days before reviewing it. The truth about the sillage.",
    img: "/creators/olafarahat/p2.jpg",
    submitted: "3d ago", track: "MT-OU-P2-1186", signal: "disliked" },

  /* ── Luna Beauty · Phase 2 · Scale — drafts waiting on the brand ── */
  { id: "ad-rf-1", campaignId: "luna-phase-2", creatorId: 2,
    product: "Rose Cleansing Balm", format: "Reel", platform: "Instagram",
    caption: "One week on the rose balm, before and after with no filter. Honest skin update.",
    img: "/creators/makeupbymemz/p1.jpg",
    submitted: "6h ago", track: "MT-LU-P2-0841", signal: "none" },
  { id: "ad-rf-2", campaignId: "luna-phase-2", creatorId: 4,
    product: "Embroidered Kaftan — Ivory", format: "Video", platform: "TikTok",
    caption: "Six kaftan looks in one try-on, with the sizing I actually ordered.",
    img: "/creators/mais.mustafa/p2.jpg",
    submitted: "11h ago", track: "MT-LU-P2-0846", signal: "none" },
  { id: "ad-rf-3", campaignId: "luna-phase-2", creatorId: 6,
    product: "Oud Body Mist", format: "Video", platform: "TikTok",
    caption: "Layering the oud mist for iftar — full review, and who it's not for.",
    img: "/creators/ghalya.mu2/p2.jpg",
    submitted: "Yesterday", track: "MT-LU-P2-0852", signal: "none" },
  { id: "ad-rf-4", campaignId: "luna-phase-2", creatorId: 4,
    product: "Ramadan Gift Set", format: "Video", platform: "TikTok",
    caption: "What's actually inside the gift set, unboxed piece by piece before you buy it.",
    img: "/creators/mais.mustafa/p3.jpg",
    submitted: "2d ago", track: "MT-LU-P2-0858", signal: "liked" },
  { id: "ad-rf-5", campaignId: "luna-phase-2", creatorId: 2,
    product: "Vitamin C Serum 30ml", format: "Reel", platform: "Instagram",
    caption: "Fourteen days on the vitamin C serum — here's my skin, and here's the receipt.",
    img: "/creators/makeupbymemz/p2.jpg",
    submitted: "3d ago", track: "MT-LU-P2-0863", signal: "none" },
  /* ── Ounass · Phase 3 · Peak — cut and waiting, hidden until funded ──
     Every phase that can run needs a queue, or funding a phase drops the
     brand into a live campaign with nothing to review. */
  { id: "ad-ou3-1", campaignId: "ounass-phase-3", creatorId: 5,
    product: "Silk Slip Dress — Midnight", format: "Reel", platform: "Instagram",
    caption: "The slip dress I said I'd never buy. Three months on, here's what changed my mind.",
    img: "/creators/asmaalazmii_/p1.jpg",
    submitted: "2h ago", track: "MT-OU-P3-2041", signal: "none" },
  { id: "ad-ou3-2", campaignId: "ounass-phase-3", creatorId: 7,
    product: "Cashmere Wrap Coat — Camel", format: "Reel", platform: "Instagram",
    caption: "Cashmere coat, one winter of real wear. Pilling, warmth and whether it's worth it.",
    img: "/creators/rebeccarkassab/p1.jpg",
    submitted: "7h ago", track: "MT-OU-P3-2047", signal: "none" },
  { id: "ad-ou3-3", campaignId: "ounass-phase-3", creatorId: 8,
    product: "Sculpted Heel Mules", format: "Reel", platform: "Instagram",
    caption: "Walked a full day in the sculpted mules so you know before you order.",
    img: "/creators/dimasheikhly/p1.jpg",
    submitted: "11h ago", track: "MT-OU-P3-2053", signal: "none" },
  { id: "ad-ou3-4", campaignId: "ounass-phase-3", creatorId: 3,
    product: "Quilted Shoulder Bag", format: "Reel", platform: "Instagram",
    caption: "What actually fits in the quilted bag — packed and unpacked, no cuts.",
    img: "/creators/olafarahat/p3.jpg",
    submitted: "Yesterday", track: "MT-OU-P3-2060", signal: "none" },
  { id: "ad-ou3-5", campaignId: "ounass-phase-3", creatorId: 6,
    product: "Retinol Night Concentrate", format: "Video", platform: "TikTok",
    caption: "Eight weeks on the retinol concentrate — full skin diary, including the bad week.",
    img: "/creators/ghalya.mu2/p3.jpg",
    submitted: "2d ago", track: "MT-OU-P3-2066", signal: "none" },
  { id: "ad-ou3-6", campaignId: "ounass-phase-3", creatorId: 1,
    product: "Tailored Wool Trousers", format: "Reel", platform: "Instagram",
    caption: "Tailored wool trousers on a short frame — the hem I asked for and why.",
    img: "/creators/jawahralsuwaidi/p3.jpg",
    submitted: "3d ago", track: "MT-OU-P3-2072", signal: "none" },

  /* ── FreshGrocer · Phase 1 · Warm-up — its first drafts ── */
  { id: "ad-fg1-1", campaignId: "fresh-phase-1", creatorId: 10,
    product: "Weekly Produce Box — Medium", format: "Video", platform: "TikTok",
    caption: "Everything in the medium produce box, weighed and priced against my usual shop.",
    img: "/creators/skindew0/p1.jpg",
    submitted: "4h ago", track: "MT-FG-P1-0112", signal: "none" },
  { id: "ad-fg1-2", campaignId: "fresh-phase-1", creatorId: 2,
    product: "Cold-Pressed Juice Set", format: "Reel", platform: "Instagram",
    caption: "Five days of the juice set, honestly — which two I'd actually reorder.",
    img: "/creators/makeupbymemz/p3.jpg",
    submitted: "16h ago", track: "MT-FG-P1-0118", signal: "none" },
  { id: "ad-fg1-3", campaignId: "fresh-phase-1", creatorId: 7,
    product: "Same-Day Pantry Delivery", format: "Reel", platform: "Instagram",
    caption: "Ordered at 9am, unpacking at 2pm. Timestamped, nothing edited out.",
    img: "/creators/rebeccarkassab/p2.jpg",
    submitted: "2d ago", track: "MT-FG-P1-0125", signal: "none" },


  /* ── Ounass · Phase 2 · Scale — already published ──
     ADDED as `liked` rather than by flipping waiting drafts: the review
     queue has to keep its 6, or the Ad review flow has nothing to
     demonstrate. Live ads and Ad review draw from the same phase but
     never from the same records. ── */
  { id: "ad-sp-9",  campaignId: "ounass-phase-2", creatorId: 1,
    product: "Pleated Satin Midi", format: "Reel", platform: "Instagram",
    caption: "Satin pleats on a real body, in real light — no press shots, no smoothing.",
    img: "/creators/jawahralsuwaidi/p4.jpg",
    submitted: "5d ago", track: "MT-OU-P2-1104", signal: "liked" },
  { id: "ad-sp-10", campaignId: "ounass-phase-2", creatorId: 3,
    product: "Woven Raffia Tote", format: "Reel", platform: "Instagram",
    caption: "Packed the raffia tote for a weekend. Everything that fit, and the one thing that didn’t.",
    img: "/creators/olafarahat/p4.jpg",
    submitted: "6d ago", track: "MT-OU-P2-1112", signal: "liked" },
  { id: "ad-sp-11", campaignId: "ounass-phase-2", creatorId: 9,
    product: "Linen Blazer — Chalk", format: "Post", platform: "Instagram",
    caption: "The linen blazer after a full day in 38 degrees. Creases and all.",
    img: "/creators/paola.elsitt/p3.jpg",
    submitted: "6d ago", track: "MT-OU-P2-1119", signal: "liked" },
  { id: "ad-sp-12", campaignId: "ounass-phase-2", creatorId: 5,
    product: "Suede Slingback Heel", format: "Reel", platform: "Instagram",
    caption: "Suede slingbacks, three hours standing. Where they rubbed and where they didn’t.",
    img: "/creators/asmaalazmii_/p2.jpg",
    submitted: "7d ago", track: "MT-OU-P2-1127", signal: "liked" },
  { id: "ad-sp-13", campaignId: "ounass-phase-2", creatorId: 7,
    product: "Gold Chain Necklace", format: "Story", platform: "Instagram",
    caption: "Layered the chain with two others for a week. It never tangled — here is why.",
    img: "/creators/rebeccarkassab/p3.jpg",
    submitted: "8d ago", track: "MT-OU-P2-1134", signal: "liked" },

  /* ── Luna Beauty · Phase 2 · Scale — already published ── */
  { id: "ad-rf-6", campaignId: "luna-phase-2", creatorId: 2,
    product: "Barrier Repair Cream", format: "Reel", platform: "Instagram",
    caption: "Two weeks on the barrier cream through a heatwave. Honest texture check.",
    img: "/creators/makeupbymemz/p4.jpg",
    submitted: "5d ago", track: "MT-LU-P2-0871", signal: "liked" },
  { id: "ad-rf-7", campaignId: "luna-phase-2", creatorId: 6,
    product: "Brightening Eye Serum", format: "Video", platform: "TikTok",
    caption: "Eye serum, four weeks, same lighting every morning. The full diary.",
    img: "/creators/ghalya.mu2/p4.jpg",
    submitted: "6d ago", track: "MT-LU-P2-0878", signal: "liked" },
  { id: "ad-rf-8", campaignId: "luna-phase-2", creatorId: 10,
    product: "Scalp Treatment Oil", format: "Video", platform: "TikTok",
    caption: "Scalp oil on fine hair — how long it took to wash out, measured.",
    img: "/creators/skindew0/p2.jpg",
    submitted: "7d ago", track: "MT-LU-P2-0885", signal: "liked" },

  /* ── Ounass · Phase 1 · Warm-up — the work that ran ──
     A COMPLETED phase had no draft records at all, so its Live ads section
     had nothing to render and its glance tile printed nothing. These are
     seeded `liked`, which is what a finished phase's ads are: judged, and
     published. The stored adsLive/adsTotal on the phase row are reconciled
     to this count so no surface can disagree about how many ran. ── */
  { id: "ad-ou1-1", campaignId: "ounass-phase-1", creatorId: 1,
    product: "Cropped Tweed Jacket", format: "Reel", platform: "Instagram",
    caption: "The tweed jacket that got me through six weeks of meetings — sizing notes at the end.",
    img: "/creators/jawahralsuwaidi/p5.jpg",
    submitted: "Jan 12", track: "MT-OU-P1-0104", signal: "liked" },
  { id: "ad-ou1-2", campaignId: "ounass-phase-1", creatorId: 9,
    product: "Leather Ankle Boot", format: "Reel", platform: "Instagram",
    caption: "Walked these in for a month. Here is where they creased and where they held.",
    img: "/creators/paola.elsitt/p4.jpg",
    submitted: "Jan 16", track: "MT-OU-P1-0111", signal: "liked" },
  { id: "ad-ou1-3", campaignId: "ounass-phase-1", creatorId: 5,
    product: "Silk Scarf — Ivory", format: "Post", platform: "Instagram",
    caption: "Five ways with one silk scarf, and the two that actually stay put.",
    img: "/creators/asmaalazmii_/p3.jpg",
    submitted: "Jan 21", track: "MT-OU-P1-0119", signal: "liked" },
  { id: "ad-ou1-4", campaignId: "ounass-phase-1", creatorId: 1,
    product: "Wool Blend Coat — Camel", format: "Reel", platform: "Instagram",
    caption: "Camel coat, real winter. Unedited, in the cold, with the lining shown.",
    img: "/creators/jawahralsuwaidi/p1.jpg",
    submitted: "Jan 27", track: "MT-OU-P1-0126", signal: "liked" },
  { id: "ad-ou1-5", campaignId: "ounass-phase-1", creatorId: 9,
    product: "Pearl Drop Earrings", format: "Story", platform: "Instagram",
    caption: "The earrings I reach for when I have four minutes. Close-ups so you can judge them.",
    img: "/creators/paola.elsitt/p5.jpg",
    submitted: "Feb 1", track: "MT-OU-P1-0133", signal: "liked" },
  { id: "ad-ou1-6", campaignId: "ounass-phase-1", creatorId: 5,
    product: "Structured Midi Skirt", format: "Reel", platform: "Instagram",
    caption: "Midi skirt on a 5ft2 frame — the hem I asked for and what it cost.",
    img: "/creators/asmaalazmii_/p4.jpg",
    submitted: "Feb 4", track: "MT-OU-P1-0140", signal: "liked" },

  /* ── Luna Beauty · Phase 1 · Warm-up — the work that ran ── */
  { id: "ad-lu1-1", campaignId: "luna-phase-1", creatorId: 2,
    product: "Hydrating Essence 120ml", format: "Reel", platform: "Instagram",
    caption: "Three weeks on the essence, morning and night. My skin diary, unfiltered.",
    img: "/creators/makeupbymemz/p5.jpg",
    submitted: "Feb 6", track: "MT-LU-P1-0102", signal: "liked" },
  { id: "ad-lu1-2", campaignId: "luna-phase-1", creatorId: 6,
    product: "Tinted Lip Oil — Rosewood", format: "Video", platform: "TikTok",
    caption: "Lip oil wear test: eight hours, two meals, one coffee. Here is what was left.",
    img: "/creators/ghalya.mu2/p5.jpg",
    submitted: "Feb 11", track: "MT-LU-P1-0108", signal: "liked" },
  { id: "ad-lu1-3", campaignId: "luna-phase-1", creatorId: 10,
    product: "Gentle Exfoliating Toner", format: "Video", platform: "TikTok",
    caption: "The toner I use twice a week, and the week I overdid it. Both are in here.",
    img: "/creators/skindew0/p3.jpg",
    submitted: "Feb 18", track: "MT-LU-P1-0115", signal: "liked" },
  { id: "ad-lu1-4", campaignId: "luna-phase-1", creatorId: 2,
    product: "Overnight Repair Mask", format: "Reel", platform: "Instagram",
    caption: "Before and after on the overnight mask, same light, same time, no filter.",
    img: "/creators/makeupbymemz/p1.jpg",
    submitted: "Feb 26", track: "MT-LU-P1-0122", signal: "liked" },
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
