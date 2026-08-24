"use client";

/* ------------------------------------------------------------------ */
/* Dashboard — ONE brand, ONE ladder.                                  */
/*                                                                     */
/* Everything on this screen is scoped to the active brand and derived  */
/* from useRoster(), which is that brand's phases in order with any     */
/* optimistic funding already applied. Nothing totals across brands.    */
/*                                                                     */
/* Phases run strictly in sequence, so there is at most one Live phase  */
/* and at most one phase waiting to be paid for. The screen is written  */
/* in the singular throughout: no "campaigns", no fixed three rungs.    */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Lightning, List, SignOut } from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import NotificationCenter from "../components/NotificationCenter";
import CommandPalette from "../components/CommandPalette";
import StatusBadge from "../components/StatusBadge";
import { duePhase, fmtUSD, phaseTitle, type Campaign } from "../lib/campaigns";
import { useRoster } from "../lib/funding";
import { useActiveBrand } from "../lib/brand";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const INK = "#191234";
const card = "rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)]";

/* ------------------------------------------------------------------ */
/* Ladder arithmetic                                                   */
/*                                                                     */
/* FUNDED means paid for — Live or Ended. A Ready phase has been        */
/* unlocked but not bought, and a Locked one cannot be bought at all,   */
/* so neither has a budget committed or a dollar earned: they stay out  */
/* of every total here or the totals overstate what the brand spent.    */
/*                                                                     */
/* `rev` and `budget` are per phase, which is what makes summing them   */
/* along a single brand's ladder legitimate. Two brands are never       */
/* added together.                                                     */
/* ------------------------------------------------------------------ */
const fundedPhases = (roster: Campaign[]) =>
  roster.filter((c) => c.status === "Live" || c.status === "Ended");

const sumBy = (rows: Campaign[], pick: (c: Campaign) => number) =>
  rows.reduce((s, c) => s + pick(c), 0);

/* A phase is measurable only once it has a target. Funding sets the
   target and resets the percentage to 0, so "funded" and "has a number
   worth judging" are close but not identical — guard for it. */
const meteredPhases = (rows: Campaign[]) => rows.filter((c) => c.revPct !== null);

/* ------------------------------------------------------------------ */
/* Revenue over time chart                                             */
/*                                                                     */
/* A fixed twelve-month trend, and the one block on this screen that is */
/* NOT derived from the roster: a phase stores a window ("Feb 10 –      */
/* Apr 12, 2026") and a single revenue figure, never a monthly series,  */
/* so there is nothing per-month to read off the ladder yet.            */
/* ------------------------------------------------------------------ */
const REV_TIME = [
  { month: "Jan", rev: 300,   orders: 75 },
  { month: "Feb", rev: 300,   orders: 75 },
  { month: "Mar", rev: 1500,  orders: 375 },
  { month: "Apr", rev: 3200,  orders: 800 },
  { month: "May", rev: 5800,  orders: 1450 },
  { month: "Jun", rev: 8200,  orders: 2050 },
  { month: "Jul", rev: 10700, orders: 2675 },
  { month: "Aug", rev: 14500, orders: 3625 },
  { month: "Sep", rev: 18500, orders: 4625 },
  { month: "Oct", rev: 200,   orders: 50 },
  { month: "Nov", rev: 200,   orders: 50 },
  { month: "Dec", rev: 200,   orders: 50 },
];

function RevenueOverTimeChart() {
  const W = 700, H = 210, PL = 46, PR = 46, PT = 14, PB = 8;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxRev = 20000, maxOrd = 7500;
  const n = REV_TIME.length;
  const colW = cW / n;
  const barW = Math.min(colW * 0.52, 26);
  const r = barW / 2;
  const peak = REV_TIME.reduce((best, d, i) => (d.rev > REV_TIME[best].rev ? i : best), 0);

  const ordY  = (v: number) => PT + cH - (v / maxOrd) * cH;
  const cx    = (i: number) => PL + (i + 0.5) * colW;

  const dots = REV_TIME.map((d, i) => ({ x: cx(i), y: ordY(d.orders) }));
  const line = dots
    .map((p, i, a) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const q = a[i - 1];
      const mx = (q.x + p.x) / 2;
      return `C${mx},${q.y} ${mx},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");

  const yLeft  = ["$20k","$16k","$12k","$8k","$4k","$0"];
  const yRight = ["7,500","6,000","4,500","3,000","1,500","0"];

  return (
    <div>
      {/* No fixed height: the viewBox owns the aspect, so the chart fills
          whatever column it lands in instead of letterboxing inside it. */}
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="h-auto w-full">
        {/* Grid + left labels */}
        {yLeft.map((l, i) => {
          const y = PT + (i / (yLeft.length - 1)) * cH;
          return (
            <g key={l}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f4f4f6" strokeWidth="1" />
              <text x={PL - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#b3b3bb">{l}</text>
            </g>
          );
        })}
        {/* Right labels */}
        {yRight.map((l, i) => {
          const y = PT + (i / (yRight.length - 1)) * cH;
          return <text key={l} x={W - PR + 8} y={y + 3.5} textAnchor="start" fontSize="9.5" fill="#b3b3bb">{l}</text>;
        })}

        {/* Revenue bars */}
        {REV_TIME.map((d, i) => {
          const bH = Math.max((d.rev / maxRev) * cH, 4);
          const y  = PT + cH - bH;
          const rx = Math.min(r, bH / 2);
          return (
            <g key={i}>
              <title>{`${d.month} — $${d.rev.toLocaleString()} revenue · ${d.orders.toLocaleString()} orders`}</title>
              <rect x={cx(i) - r} y={y} width={barW} height={bH} rx={rx} ry={rx}
                fill={i === peak ? BRAND : "#EDE9FB"} />
            </g>
          );
        })}

        {/* Peak value callout */}
        <text x={cx(peak)} y={PT + cH - (REV_TIME[peak].rev / maxRev) * cH - 8}
          textAnchor="middle" fontSize="10" fontWeight="600" fill={BRAND}>
          {`$${(REV_TIME[peak].rev / 1000).toFixed(1)}k`}
        </text>

        {/* Orders curve */}
        <path d={line} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
        {dots.map((p, i) => (
          <g key={i}>
            <title>{`${REV_TIME[i].month} — ${REV_TIME[i].orders.toLocaleString()} orders`}</title>
            <circle cx={p.x} cy={p.y} r="2.5" fill="#A78BFA" />
          </g>
        ))}

        {/* X-axis month labels */}
        {REV_TIME.map((d, i) => (
          <text key={d.month} x={cx(i)} y={H + 22} textAnchor="middle" fontSize="10"
            fontWeight={i === peak ? 600 : 400} fill={i === peak ? BRAND : "#b3b3bb"}>{d.month}</text>
        ))}
      </svg>

      <div className="mt-2 flex items-center gap-5 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#EDE9FB] border border-[#ddd4f5]" />Revenue
        </span>
        <span className="flex items-center gap-2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="20" y2="5" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="5" r="2.5" fill="#A78BFA" />
          </svg>
          Orders
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ladder averages                                                     */
/*                                                                     */
/* Averages over the phases THIS brand has funded — never over other    */
/* brands, and never over rungs it has not paid for.                    */
/* ------------------------------------------------------------------ */
function LadderAverages({ funded }: { funded: Campaign[] }) {
  const metered = meteredPhases(funded);
  const crossed = metered.filter((c) => c.revPct! >= 80);
  const revPer = funded.length ? Math.round(sumBy(funded, (c) => c.rev) / funded.length) : 0;
  /* creators is null until a phase is funded, and every row here is
     funded, so the ?? 0 is a type guard rather than a real case. */
  const crewPer = funded.length ? Math.round(sumBy(funded, (c) => c.creators ?? 0) / funded.length) : 0;

  const items = [
    {
      label: "Revenue per funded phase",
      value: funded.length ? fmtUSD(revPer) : "—",
      color: "text-[#4D2FB0]",
      desc: "What one rung of this ladder has brought back, on average.",
    },
    {
      label: "Past the 80% line",
      value: metered.length ? `${crossed.length} of ${metered.length}` : "—",
      color: "",
      desc: "Reaching 80% of its own target is what unlocks the next phase.",
    },
    {
      label: "Creators per funded phase",
      value: funded.length ? String(crewPer) : "—",
      color: "",
      desc: "Matched creators working a single phase, on average.",
    },
  ];

  return (
    <div className="flex flex-col flex-1 divide-y divide-black/[0.05]">
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-neutral-600">{item.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{item.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-xl font-semibold tracking-tight tabular-nums ${item.color}`}
              style={item.color ? undefined : { color: INK }}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How you compare                                                     */
/*                                                                     */
/* Our side of every row is computed from this brand's funded phases;   */
/* only the category figure is a benchmark constant, and the verdict     */
/* line is derived from the comparison so the two can never disagree.   */
/*                                                                     */
/* No category label: the workspace does not store one per brand, and   */
/* calling a grocery brand "Fashion & Apparel" would be a fabrication.  */
/* ------------------------------------------------------------------ */
function HowYouCompare({ funded }: { funded: Campaign[] }) {
  const spend = sumBy(funded, (c) => c.budget);
  const revenue = sumBy(funded, (c) => c.rev);
  const metered = meteredPhases(funded);
  const crossed = metered.filter((c) => c.revPct! >= 80).length;

  const rows = [
    {
      label: "Blended ROAS",
      value: spend ? `${(revenue / spend).toFixed(1)}×` : "—",
      ours: spend ? revenue / spend : null, cat: 4.1, catLabel: "vs 4.1× category avg",
      good: "Ahead of comparable brands", bad: "Behind comparable brands",
    },
    {
      label: "Phases past the 80% line",
      value: metered.length ? `${Math.round((crossed / metered.length) * 100)}%` : "—",
      ours: metered.length ? (crossed / metered.length) * 100 : null, cat: 84, catLabel: "vs 84% category avg",
      good: "Unlocking the next rung reliably", bad: "Opportunity — unlock pace",
    },
    {
      label: "Revenue per funded phase",
      value: funded.length ? fmtUSD(Math.round(revenue / funded.length)) : "—",
      ours: funded.length ? revenue / funded.length : null, cat: 3200, catLabel: "vs $3,200 category avg",
      good: "Bigger return per rung", bad: "Opportunity — return per rung",
    },
  ];

  return (
    <div className={`${card} flex h-full flex-col p-6`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-[15px] font-semibold" style={{ color: INK }}>How you compare</h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
          GCC · comparable ladder stage
        </span>
      </div>
      <p className="text-xs text-neutral-400 mt-1">
        Benchmarked against anonymised MoonTech brands at a similar point on their own ladder
      </p>
      {/* One per row. In half a row three columns squeezed a 26px figure
          and its caption into ~200px; stacked, each comparison gets its
          own line and the numbers stay scannable. */}
      <div className="mt-4 flex flex-1 flex-col divide-y divide-black/[0.05]">
        {rows.map((r) => {
          const up = r.ours !== null && r.ours >= r.cat;
          return (
            <div key={r.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-neutral-500">{r.label}</p>
                <p className={`mt-0.5 text-xs font-medium ${up ? "text-green-600" : "text-[#D70015]"}`}>
                  {up ? "↑" : "↓"} {up ? r.good : r.bad}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-[24px] font-semibold tracking-tight tabular-nums ${up ? "text-[#4D2FB0]" : "text-[#D70015]"}`}>
                  {r.value}
                </p>
                <p className="text-xs text-neutral-400">{r.catLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The current phase                                                   */
/*                                                                     */
/* Singular on purpose. A brand runs one phase at a time, so this is    */
/* one card, never a grid of concurrent programmes. Its title is the    */
/* phase number — a brand never names anything.                        */
/* ------------------------------------------------------------------ */
function CurrentPhaseCard({ c, onOpen }: { c: Campaign; onOpen: () => void }) {
  /* A phase funded a moment ago has a target but nothing measured yet,
     so the meter only draws once there is a percentage to draw. */
  const pct = c.revPct;
  const target = c.revTarget;

  return (
    <div className={`${card} p-5 flex flex-col transition-colors hover:border-black/[0.12]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold" style={{ color: INK }}>{phaseTitle(c.phaseNo)}</h3>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-xs text-neutral-400 mt-1">{c.dates}</p>
        </div>
        <button onClick={onOpen}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-[#4D2FB0] hover:bg-[#4D2FB0]/[0.06] transition-colors">
          View →
        </button>
      </div>

      {/* Revenue against THIS phase's own target — budget × the multiple
          guaranteed on this phase, never a portfolio figure. */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[26px] font-semibold tracking-tight tabular-nums leading-none" style={{ color: INK }}>
            {c.revLabel}{" "}
            <span className="text-sm font-normal tracking-normal text-neutral-400">
              {target !== null ? `of ${fmtUSD(target)} target` : "banked so far"}
            </span>
          </p>
          {pct !== null && <p className="text-sm font-semibold tabular-nums text-[#4D2FB0]">{pct}%</p>}
        </div>

        {pct !== null && (
          <>
            <div className="relative mt-3.5 h-2 w-full rounded-full bg-[#EFEBFA]">
              <div className="h-full rounded-full bg-[#4D2FB0] transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
              {/* The 80% line is the whole mechanic: cross it and the next
                  rung becomes fundable. Mark it rather than imply it. */}
              <span aria-hidden="true" className="absolute -inset-y-1 left-[80%] w-px bg-[#4D2FB0]/40" />
            </div>
            <span className="sr-only">
              {pct >= 80
                ? "Past the 80% unlock line."
                : `${80 - pct} percentage points below the 80% unlock line.`}
            </span>
          </>
        )}

        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          {c.threshold && (
            <p className={`flex items-start gap-1.5 text-xs font-medium ${c.thresholdGreen ? "text-green-600" : "text-[#D70015]"}`}>
              {c.thresholdGreen
                ? <CheckCircle size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />
                : <Clock size={13} weight="fill" aria-hidden="true" className="mt-px shrink-0" />}
              {c.threshold}
            </p>
          )}
          {target !== null && (
            <p className="shrink-0 text-xs text-neutral-400">
              {fmtUSD(Math.max(target - c.rev, 0))} to target
            </p>
          )}
        </div>
      </div>

      {/* Metric row — all three belong to this phase alone. */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-black/[0.05] pt-4">
        {[
          {
            label: "Ads live",
            value: String(c.adsLive ?? 0),
            suffix: c.adsTotal ? `/${c.adsTotal}` : "",
            note: c.adsTotal ? `${Math.round(((c.adsLive ?? 0) / c.adsTotal) * 100)}% of plan` : "deploying",
          },
          { label: "Creators", value: String(c.creators ?? 0), suffix: "", note: "on this phase" },
          { label: "ROAS", value: c.roas, suffix: "", note: `${c.guaranteedRoas}× guaranteed` },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-medium text-neutral-400">{m.label}</p>
            <p className="mt-1 text-[17px] font-semibold tracking-tight tabular-nums" style={{ color: INK }}>
              {m.value}<span className="text-[13px] font-normal text-neutral-400">{m.suffix}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400 truncate">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Nothing running. Either the next rung is bought and this is a blink
   between phases, or the brand is waiting on a payment. */
function NoPhaseRunningCard({ due, onFund }: { due: Campaign | undefined; onFund: () => void }) {
  return (
    <div className={`${card} p-5 flex flex-col justify-center`}>
      <h3 className="text-[15px] font-semibold" style={{ color: INK }}>No phase running</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-400">
        {due
          ? `${phaseTitle(due.phaseNo)} is unlocked and waiting on payment. Fund it and it is live within the hour.`
          : "Nothing is live and nothing is waiting on you. Your next phase unlocks when the current one crosses its 80% line."}
      </p>
      {due && (
        <button onClick={onFund}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#4D2FB0]/[0.08] px-4 py-2 text-xs font-semibold transition-colors hover:bg-[#4D2FB0]/[0.14]"
          style={{ color: BRAND }}>
          <Lightning size={13} weight="fill" />
          Fund Phase {due.phaseNo} — {fmtUSD(due.due!.amount)}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phase ladder                                                        */
/*                                                                     */
/* One row per rung, in the order the brand works through them. The     */
/* ladder is UNBOUNDED, so this renders whatever the roster holds —     */
/* three rungs or twelve — and never draws a fixed-length stepper.      */
/*                                                                     */
/* A rung that has not been paid for has no numbers of its own: Ready   */
/* and Locked print an em dash rather than a $0 that reads like a       */
/* failure. Locked is not even openable — it has no creators, no ads    */
/* and nothing to look at — so it gets no link and, above all, no fund  */
/* button: its predecessor has not crossed the 80% line.                */
/* ------------------------------------------------------------------ */
function PhaseLadder({
  roster, brandName, onOpen,
}: { roster: Campaign[]; brandName: string; onOpen: (id: string) => void }) {
  return (
    <div className={`${card} p-6 overflow-x-auto`}>
      <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Phase ladder</h3>
      <p className="text-xs text-neutral-400 mt-1 mb-4">
        Every phase {brandName} has run or has queued, in order — one runs at a time
      </p>

      {roster.length === 0 ? (
        <p className="py-6 text-[13px] text-neutral-400">
          This brand has no phases yet. MoonTech builds the ladder, so the first rung appears here once it is matched.
        </p>
      ) : (
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {["Phase", "Status", "Budget", "Revenue", "ROAS", ""].map((h, i) => (
                <th key={h || i} className="pb-3 text-left text-xs font-medium text-neutral-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {roster.map((c) => {
              const funded = c.status === "Live" || c.status === "Ended";
              const target = c.revTarget ?? c.budget * c.guaranteedRoas;
              return (
                <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="font-medium" style={{ color: INK }}>{phaseTitle(c.phaseNo)}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">{c.dates}</p>
                  </td>
                  <td className="py-4 pr-3"><StatusBadge status={c.status} /></td>
                  <td className="py-4 pr-3">
                    <p className={`font-medium tabular-nums ${funded ? "text-neutral-700" : "text-neutral-400"}`}>
                      {fmtUSD(c.budget)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {funded
                        ? `${fmtUSD(target)} target`
                        : c.status === "Ready" ? "due now" : "not payable yet"}
                    </p>
                  </td>
                  <td className="py-4 pr-3">
                    {funded ? (
                      <>
                        <p className="font-medium tabular-nums text-neutral-700">{c.revLabel}</p>
                        {c.revPct !== null && (
                          <div className="relative mt-1.5 h-1 w-24 rounded-full bg-[#EFEBFA]">
                            <div className="h-full rounded-full bg-[#4D2FB0]" style={{ width: `${Math.min(c.revPct, 100)}%` }} />
                            <span aria-hidden="true" className="absolute -inset-y-0.5 left-[80%] w-px bg-[#4D2FB0]/40" />
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-4 pr-3">
                    {funded ? (
                      <>
                        <p className="font-semibold tabular-nums text-[#4D2FB0]">{c.roas}</p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">{c.guaranteedRoas}× guaranteed</p>
                      </>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    {c.status !== "Locked" && (
                      <button onClick={() => onOpen(c.id)}
                        aria-label={`Open ${phaseTitle(c.phaseNo)}`}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-[#4D2FB0] hover:bg-[#4D2FB0]/[0.06] transition-colors">
                        View →
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
const DATE_FILTERS = ["Today", "Yesterday", "This week", "Last week", "Last 30 days", "All time"] as const;
type DateFilter = typeof DATE_FILTERS[number];

export default function Dashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav]       = useState("Dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dateFilter, setDateFilter]     = useState<DateFilter>("Last 30 days");
  const [filterOpen, setFilterOpen]     = useState(false);

  /* The active brand's ladder, in phase order, with optimistic funding
     applied — a phase paid for on the detail route is already Live here. */
  const brand = useActiveBrand();
  const roster = useRoster();
  const open = (id: string) => router.push(`/campaigns/${id}`);

  /* Phases are strictly sequential: one Live at most, one payable at most. */
  const live = roster.find((c) => c.status === "Live");
  const due = duePhase(brand.id, roster);

  const funded = fundedPhases(roster);
  const spend = sumBy(funded, (c) => c.budget);
  const revenue = sumBy(funded, (c) => c.rev);
  const ended = roster.filter((c) => c.status === "Ended").length;
  /* Written out rather than pluralised inline: a brand on its first rung
     reads "the one phase", not "the 1 phases". */
  const fundedLabel =
    funded.length === 0 ? "No funded phases yet"
      : funded.length === 1 ? `The one phase ${brand.name} has funded`
        : `Across the ${funded.length} phases ${brand.name} has funded`;

  const stats: { label: string; value: string; sub: string; hero?: boolean }[] = [
    {
      label: "Revenue to date", value: fmtUSD(revenue), hero: true,
      sub: `${brand.name} · summed along this ladder only`,
    },
    {
      label: "Blended ROAS",
      value: spend ? `${(revenue / spend).toFixed(1)}×` : "—",
      sub: spend ? `${fmtUSD(revenue)} back on ${fmtUSD(spend)} funded` : "Nothing funded yet",
    },
    {
      label: "Committed spend", value: fmtUSD(spend),
      sub: `Across ${funded.length} funded phase${funded.length === 1 ? "" : "s"}`,
    },
    {
      label: "Current phase",
      value: live ? (live.revPct !== null ? `${live.revPct}%` : "Live") : "—",
      sub: live
        ? live.revTarget !== null
          ? `${phaseTitle(live.phaseNo)} · ${fmtUSD(live.rev)} of ${fmtUSD(live.revTarget)}`
          : `${phaseTitle(live.phaseNo)} · deploying`
        : "Nothing running right now",
    },
    {
      label: "Phases completed", value: String(ended),
      sub: `${roster.length} on the ladder so far`,
    },
  ];

  return (
    <div className="flex h-screen bg-[#F7F7F8] overflow-hidden"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

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
          {/* Hamburger: toggles drawer on mobile, collapses sidebar on desktop */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen((o) => !o);
              else setCollapsed((o) => !o);
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors">
            <List size={18} />
          </button>
          <h1 className="text-[15px] font-semibold shrink-0" style={{ color: INK }}>Dashboard</h1>

          {/* Central search / command palette */}
          <CommandPalette />

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* A brand cannot create a campaign, so the primary action is the
                one thing that is actually waiting on it: the unlocked phase.
                Nothing due, no button — an empty CTA would invent work. */}
            {due && (
              <button onClick={() => open(due.id)}
                aria-label={`Fund Phase ${due.phaseNo}, ${fmtUSD(due.due!.amount)} plus VAT`}
                className="flex items-center gap-2 rounded-xl bg-[#4D2FB0] px-3 sm:px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#3F2596] transition-colors">
                <Lightning size={13} weight="fill" />
                <span className="hidden sm:inline">
                  Fund Phase {due.phaseNo} — {fmtUSD(due.due!.amount)}
                </span>
              </button>
            )}
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

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">

          {/* Welcome banner */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-tight" style={{ color: INK }}>Welcome back, Mostafa</h2>
              <p className="text-[13px] text-neutral-400 mt-1" suppressHydrationWarning>
                {brand.name} ·{" "}
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* One phase runs at a time, so this names it instead of
                  counting campaigns that cannot exist side by side. */}
              {live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4D2FB0]/[0.07] px-3 py-1.5 text-[12px] font-medium text-[#4D2FB0]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4D2FB0] animate-pulse" />
                  {phaseTitle(live.phaseNo)} is live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[12px] font-medium text-neutral-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                  Nothing live right now
                </span>
              )}
              {/* Date filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:border-[#4D2FB0]/30 hover:text-[#4D2FB0] transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
                    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {dateFilter}
                  <svg className={`h-3 w-3 text-neutral-400 transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.06]">
                    {DATE_FILTERS.map((f) => (
                      <button key={f} onClick={() => { setDateFilter(f); setFilterOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition hover:bg-neutral-50 ${
                          dateFilter === f ? "font-medium text-[#4D2FB0]" : "text-neutral-600"
                        }`}>
                        {f}
                        {dateFilter === f && (
                          <svg className="h-3.5 w-3.5 text-[#4D2FB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats — every figure here belongs to the active brand alone */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label}
                className={`rounded-2xl p-4 sm:p-5 transition-colors ${
                  s.hero
                    ? "col-span-2 bg-[#4D2FB0]"
                    : "bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(16,12,40,0.04)] hover:border-black/[0.12]"
                }`}>
                <p className={`text-[13px] font-medium ${s.hero ? "text-white/60" : "text-neutral-500"}`}>{s.label}</p>
                <p className={`mt-2 text-[24px] sm:text-[28px] font-semibold tracking-tight tabular-nums leading-none ${s.hero ? "text-white" : ""}`}
                  style={s.hero ? undefined : { color: INK }}>
                  {s.value}
                </p>
                <p className={`mt-2.5 text-xs ${s.hero ? "text-white/50" : "text-neutral-400"}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* The phase running now — singular, because only one can be */}
          <div className="pt-2">
            <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: INK }}>Running now</h2>
            <p className="text-[13px] text-neutral-400 mt-0.5">
              {brand.name} runs one phase at a time · updated in real time
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {live
              ? <CurrentPhaseCard c={live} onOpen={() => open(live.id)} />
              : <NoPhaseRunningCard due={due} onFund={() => due && open(due.id)} />}
            <div className={`${card} p-5 flex flex-col`}>
              <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Ladder averages</h3>
              <p className="text-xs text-neutral-400 mt-1 mb-3">{fundedLabel}</p>
              <LadderAverages funded={funded} />
            </div>
          </div>

          {/* The ladder itself */}
          <PhaseLadder roster={roster} brandName={brand.name} onOpen={open} />

          {/* Performance Overview */}
          <div className="pt-2">
            <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: INK }}>Performance overview</h2>
            <p className="text-[13px] text-neutral-400 mt-0.5">Revenue over time, and how this ladder compares</p>
          </div>

          {/* Two cards, one row. The chart is viewBox-scaled, so at full
              width it letterboxed inside huge side gaps; half a row is
              closer to its natural aspect and the comparison reads better
              beside it than stacked under it. */}
          <div className="grid gap-5 xl:grid-cols-2">
            <div className={`${card} flex h-full flex-col p-5`}>
              <h3 className="text-[15px] font-semibold" style={{ color: INK }}>Revenue over time</h3>
              <p className="text-xs text-neutral-400 mt-1 mb-4">Monthly revenue and orders for {brand.name}</p>
              <div className="flex-1">
                <RevenueOverTimeChart />
              </div>
            </div>
            <HowYouCompare funded={funded} />
          </div>

        </main>
      </div>
    </div>
  );
}
