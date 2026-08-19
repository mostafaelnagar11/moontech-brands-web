"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaretRight } from "@phosphor-icons/react";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const BRAND = "#4D2FB0";
const BRAND_HOVER = "#3F2596";
const INK = "#191234";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type Step = "type" | "basics" | "budget" | "building" | "review" | "pay" | "processing";

interface CampaignData {
  name: string;
  type: "roas" | "awareness";
  startDate: string;
  endDate: string;
  gender: "all" | "female" | "male";
  age: "18-34" | "25-44" | "35-54" | "all";
  region: "uae" | "ksa" | "kuwait" | "gcc";
  brief: string;
  guidelineLink: string;
  assetName: string | null;
  budget: number;
  roas: number;
}

const TOTAL_STEPS = 5;
const STEP_LABELS: Record<Step, string> = {
  type:       "Campaign type",
  basics:     "Basic info",
  budget:     "Calculator",
  building:   "Building",
  review:     "Review plan",
  pay:        "Fund Phase 1",
  processing: "Processing",
};
const STEP_NUM: Record<Step, number> = { type: 1, basics: 2, budget: 3, building: 3, review: 4, pay: 5, processing: 5 };

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */
const fieldCls = "w-full rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[#4D2FB0]/50 focus:ring-2 focus:ring-[#4D2FB0]/10 transition";
const labelCls = "mb-1.5 block text-sm font-medium text-neutral-600";

function StepIntro({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: INK }}>{title}</h2>
      <p className="mt-1 text-sm text-neutral-400">{sub}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DatePicker                                                          */
/* ------------------------------------------------------------------ */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear]   = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`${fieldCls} flex items-center justify-between text-left ${!displayValue ? "text-neutral-400" : "text-neutral-800"}`}>
        <span>{displayValue || placeholder || "Select date"}</span>
        <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-lg shadow-black/[0.08]">
          {/* Month nav */}
          <div className="mb-4 flex items-center justify-between">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <p className="text-sm font-semibold" style={{ color: INK }}>{MONTHS[viewMonth]} {viewYear}</p>
            <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS_SHORT.map(d => <p key={d} className="py-1 text-center text-[10px] font-medium text-neutral-400">{d}</p>)}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = parsed &&
                parsed.getFullYear() === viewYear &&
                parsed.getMonth() === viewMonth &&
                parsed.getDate() === day;
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <button key={day} onClick={() => selectDay(day)}
                  className={`h-8 w-full rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-[#4D2FB0] font-semibold text-white"
                      : isToday
                      ? "border border-[#4D2FB0]/40 text-[#4D2FB0] font-semibold"
                      : "text-neutral-700 hover:bg-[#4D2FB0]/[0.06] hover:text-[#4D2FB0]"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PillToggle<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            value === o.value
              ? "border-[#4D2FB0] bg-[#4D2FB0]/[0.06] text-[#4D2FB0]"
              : "border-black/[0.09] bg-white text-neutral-500 hover:border-[#4D2FB0]/40 hover:text-[#4D2FB0]"
          }`}
        >{o.label}</button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confidence score logic                                              */
/* ------------------------------------------------------------------ */
function getConfidence(budget: number, roas: number) {
  const ratio = budget / roas;
  if (ratio >= 12000) return {
    level: "High confidence",
    color: "green",
    bar: "bg-green-500",
    text: "text-green-600",
    pct: 85,
    desc: roas <= 2
      ? "We can confidently deliver this plan."
      : "Good combination of budget and ROAS target.",
  };
  if (ratio >= 4000) return {
    level: "Medium confidence",
    color: "amber",
    bar: "bg-amber-400",
    text: "text-amber-500",
    pct: 50,
    desc: "Achievable — requires strong creator performance.",
  };
  return {
    level: "Low confidence",
    color: "red",
    bar: "bg-red-500",
    text: "text-red-500",
    pct: 20,
    desc: "Consider lowering ROAS or increasing your budget.",
  };
}

/* ------------------------------------------------------------------ */
/* Step 1 — Campaign type                                              */
/* ------------------------------------------------------------------ */
function StepType({ data, onChange }: { data: CampaignData; onChange: (d: Partial<CampaignData>) => void }) {
  return (
    <div className="space-y-5">
      <StepIntro title="Create your campaign" sub="Give it a name and choose how it should run." />
      <div>
        <label className={labelCls}>Campaign name</label>
        <input value={data.name} onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Spring 2026" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Campaign type</label>
        <div className="space-y-3">
          {[
            { value: "roas" as const, title: "E-commerce — ROAS guaranteed", desc: "Guaranteed return on ad spend with phased delivery" },
            { value: "awareness" as const, title: "Awareness campaign", desc: "Grow brand reach and visibility" },
          ].map((opt) => {
            const selected = data.type === opt.value;
            return (
              <button key={opt.value} onClick={() => onChange({ type: opt.value })}
                className={`w-full flex items-start justify-between rounded-2xl border p-4 text-left transition ${
                  selected ? "border-[#4D2FB0] bg-[#4D2FB0]/[0.05]" : "border-black/[0.09] bg-white hover:border-black/20"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${selected ? "text-neutral-900" : "text-neutral-700"}`}>{opt.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{opt.desc}</p>
                </div>
                <div className={`mt-0.5 ml-3 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
                  selected ? "border-[#4D2FB0] bg-[#4D2FB0]" : "border-neutral-300 bg-white"
                }`}>
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-[#4D2FB0]/15 bg-[#4D2FB0]/[0.05] p-4">
          <span className="mt-0.5 shrink-0 text-[#4D2FB0] text-sm">✦</span>
          <p className="text-sm leading-relaxed text-neutral-700">
            As a new brand, you&apos;ll start with our{" "}
            <strong className="text-[#4D2FB0]">Warm-up program</strong> — three phased campaigns that
            help the MoonTech assistant learn your audience before scaling.
          </p>
        </div>
        <div className="rounded-2xl bg-[#4D2FB0]/[0.06] p-4">
          <p className="mb-3 text-xs font-medium text-[#4D2FB0]">Why brands trust MoonTech</p>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🎯</span>
            <p className="text-sm leading-relaxed text-neutral-700">
              We work with vetted <strong>creators &amp; community leaders</strong> — not pricey big-name talent — so spend goes further.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Basic info                                                 */
/* ------------------------------------------------------------------ */
function StepBasics({ data, onChange }: { data: CampaignData; onChange: (d: Partial<CampaignData>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-5">
      <StepIntro title="Campaign details" sub="Set your audience, schedule, and creator brief." />
      <div>
        <label className={labelCls}>Start date</label>
        <DatePicker value={data.startDate} onChange={(v) => onChange({ startDate: v })} placeholder="Select start date" />
      </div>
      <div>
        <label className={labelCls}>End date</label>
        <DatePicker value={data.endDate} onChange={(v) => onChange({ endDate: v })} placeholder="Select end date" />
      </div>
      <div>
        <label className={labelCls}>Target gender</label>
        <PillToggle value={data.gender} onChange={(v) => onChange({ gender: v })}
          options={[{ label: "All", value: "all" }, { label: "Female", value: "female" }, { label: "Male", value: "male" }]} />
      </div>
      <div>
        <label className={labelCls}>Target age</label>
        <PillToggle value={data.age} onChange={(v) => onChange({ age: v })}
          options={[{ label: "18–34", value: "18-34" }, { label: "25–44", value: "25-44" }, { label: "35–54", value: "35-54" }, { label: "All", value: "all" }]} />
      </div>
      <div>
        <label className={labelCls}>Run campaign in</label>
        <PillToggle value={data.region} onChange={(v) => onChange({ region: v })}
          options={[{ label: "UAE", value: "uae" }, { label: "KSA", value: "ksa" }, { label: "Kuwait", value: "kuwait" }, { label: "All GCC", value: "gcc" }]} />
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-black/[0.07]" />
        <span className="text-xs font-medium text-neutral-400">Creator brief</span>
        <div className="flex-1 h-px bg-black/[0.07]" />
      </div>

      <div>
        <label className={labelCls}>
          What should creators know?{" "}
          <span className="font-normal text-neutral-400">· do&apos;s &amp; don&apos;ts</span>
        </label>
        <textarea value={data.brief} onChange={(e) => onChange({ brief: e.target.value })} rows={4}
          placeholder="e.g. Show the product in daily use, keep tone warm and casual. Don't mention competitors or discount codes other than ours."
          className={`${fieldCls} resize-none`} />
        <p className="mt-1.5 text-xs text-neutral-400">This becomes your creator brief. The more detail, the better the match.</p>
      </div>

      <div>
        <label className={labelCls}>Brand guideline link <span className="font-normal text-neutral-400">· optional</span></label>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-4 py-3 focus-within:border-[#4D2FB0]/50 focus-within:ring-2 focus-within:ring-[#4D2FB0]/10 transition">
          <span className="text-neutral-400 shrink-0">🔗</span>
          <input value={data.guidelineLink} onChange={(e) => onChange({ guidelineLink: e.target.value })}
            placeholder="Paste a link to your brand guidelines"
            className="flex-1 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none bg-transparent" />
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">No file handy at 2am? Just drop a link — our team will pull what we need.</p>
      </div>

      <div>
        <label className={labelCls}>Attach assets <span className="font-normal text-neutral-400">· optional</span></label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-black/[0.1] bg-white px-4 py-8 transition hover:border-[#4D2FB0]/40 hover:bg-[#4D2FB0]/[0.04]">
          <input ref={fileRef} type="file" accept=".pdf,image/*" className="sr-only"
            onChange={(e) => onChange({ assetName: e.target.files?.[0]?.name ?? null })} />
          {data.assetName ? (
            <>
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-neutral-600">{data.assetName}</p>
            </>
          ) : (
            <>
              <svg className="h-7 w-7 text-[#4D2FB0]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-semibold text-neutral-700">Upload PDF or images</p>
              <p className="text-xs text-neutral-400">Brand deck, logos, sample posts...</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Budget & ROAS                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* The calculator — ONE component, two homes                           */
/*                                                                     */
/* It is the manual wizard's budget step and, since the assistant       */
/* stopped asking for these two numbers as chips, the answer card in    */
/* the chat as well. Extracted rather than copied: a fixed chip like    */
/* "$20,000+" cannot say what 20,000 at 5x is worth, and two drifting  */
/* copies of the same sliders would be worse than either.              */
/* ------------------------------------------------------------------ */
function PlanCalculator({
  budget, roas, onChange, compact,
}: {
  budget: number;
  roas: number;
  onChange: (d: { budget?: number; roas?: number }) => void;
  compact?: boolean;
}) {
  const confidence = getConfidence(budget, roas);
  const projected = budget * roas;
  /* Track-fill stops for the compact sliders: brand up to the thumb, quiet after. */
  const budgetPct = ((budget - 1000) / (80000 - 1000)) * 100;
  const roasPct = ((roas - 1) / (12 - 1)) * 100;
  const fill = (pct: number) => ({ background: `linear-gradient(to right, ${BRAND} ${pct}%, #E9E7F2 ${pct}%)` });

  /* The chat answer card is a tight space under a question and above a
     commit button, so it gets the compact register: label and value on
     one baseline, bounds flanking the track, confidence as a slim strip.
     The wizard step is a full page and keeps the roomier original. */
  if (compact) {
    return (
      <div className="space-y-6">
        {/* Budget — label and value share a baseline; bounds flank the track.
            Fixed w-12 flanks keep both sliders' tracks vertically aligned. */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium" style={{ color: INK }}>Total campaign budget</p>
            <p className="text-xl font-semibold leading-none tracking-tight tabular-nums text-[#4D2FB0]">
              ${budget.toLocaleString()}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="w-12 shrink-0 text-[11px] font-medium tabular-nums text-neutral-400">$1,000</span>
            <input
              type="range" min={1000} max={80000} step={1000}
              value={budget}
              onChange={(e) => onChange({ budget: Number(e.target.value) })}
              aria-label="Total campaign budget in dollars"
              className="range-fill h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]/40 focus-visible:ring-offset-2"
              style={{ ...fill(budgetPct) }}
            />
            <span className="w-12 shrink-0 text-right text-[11px] font-medium tabular-nums text-neutral-400">$80,000</span>
          </div>
        </div>

        {/* ROAS — the projection is a live equation, but on its own quiet
            line: inputs in brand purple, the outcome in ink. */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="mt-0.5 text-[13px] font-medium" style={{ color: INK }}>Target ROAS</p>
            <div className="text-right">
              <p className="text-xl font-semibold leading-none tracking-tight tabular-nums text-[#4D2FB0]">{roas}×</p>
              <p className="mt-1.5 text-xs text-neutral-400">
                = <span className="font-medium tabular-nums" style={{ color: INK }}>${projected.toLocaleString()}</span> projected revenue
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="w-12 shrink-0 text-[11px] font-medium tabular-nums text-neutral-400">1×</span>
            <input
              type="range" min={1} max={12} step={1}
              value={roas}
              onChange={(e) => onChange({ roas: Number(e.target.value) })}
              aria-label="Target return on ad spend, as a multiple"
              className="range-fill h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4D2FB0]/40 focus-visible:ring-offset-2"
              style={{ ...fill(roasPct) }}
            />
            <span className="w-12 shrink-0 text-right text-[11px] font-medium tabular-nums text-neutral-400">12×</span>
          </div>
        </div>

        {/* Confidence — a tier-tinted callout, not a gray box: the whole strip
            carries the verdict's colour. min-h pins the row so tier changes
            mid-drag never shift the layout; the desc wraps within its column. */}
        <div className={`flex min-h-[44px] items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors duration-300 ${
          { green: "border-green-600/15 bg-green-500/[0.07]",
            amber: "border-amber-500/20 bg-amber-400/[0.09]",
            red:   "border-red-600/15 bg-red-500/[0.06]" }[confidence.color as "green" | "amber" | "red"]
        }`}>
          <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-black/[0.07]" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-all duration-500 ${confidence.bar}`}
              style={{ width: `${confidence.pct}%` }}
            />
          </div>
          <p className={`shrink-0 text-[13px] font-semibold ${confidence.text}`} role="status">
            {confidence.level}
          </p>
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-500">{confidence.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm text-neutral-600">Total campaign budget</p>
          <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-[#4D2FB0]">
            ${budget.toLocaleString()}
          </p>
        </div>
        <input
          type="range" min={1000} max={80000} step={1000}
          value={budget}
          onChange={(e) => onChange({ budget: Number(e.target.value) })}
          aria-label="Total campaign budget in dollars"
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{ accentColor: BRAND }}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-neutral-400">
          <span>$1,000</span><span>$80,000</span>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-start justify-between">
          <p className="mt-1 text-sm text-neutral-600">Target ROAS</p>
          <div className="text-right">
            <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-[#4D2FB0]">{roas}×</p>
            <p className="mt-1 text-xs text-neutral-400">= ${projected.toLocaleString()} in revenue</p>
          </div>
        </div>
        <input
          type="range" min={1} max={12} step={1}
          value={roas}
          onChange={(e) => onChange({ roas: Number(e.target.value) })}
          aria-label="Target return on ad spend, as a multiple"
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{ accentColor: BRAND }}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-neutral-400">
          <span>1×</span><span>12×</span>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(16,12,40,0.04)]">
        <p className="mb-3 text-[13px] font-medium text-neutral-500">Confidence score</p>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confidence.bar}`}
            style={{ width: `${confidence.pct}%` }}
          />
        </div>
        <p className={`text-[15px] font-semibold ${confidence.text}`} role="status">{confidence.level}</p>
        <p className="mt-1 text-sm text-neutral-400">{confidence.desc}</p>
      </div>
    </div>
  );
}
function StepBudget({ data, onChange }: { data: CampaignData; onChange: (d: Partial<CampaignData>) => void }) {
  const projectedSales = data.budget * data.roas;
  const phase1 = Math.round(data.budget * 0.1);

  return (
    <div className="space-y-8">
      <StepIntro title="Budget & target ROAS" sub="Drag to shape your plan — your first three phases are guaranteed." />

      <PlanCalculator
        budget={data.budget}
        roas={data.roas}
        onChange={(d) => onChange(d)}
      />

      {/* What this builds */}
      <div className="rounded-2xl bg-[#4D2FB0]/[0.05] p-5">
        <p className="text-[13px] font-medium text-neutral-500 mb-3">What this builds</p>
        <div className="grid grid-cols-3 divide-x divide-black/[0.06]">
          {[
            { label: "Projected revenue", value: `$${projectedSales.toLocaleString()}` },
            { label: "Guaranteed phases", value: "3" },
            { label: "Phase 1 to start",  value: `$${phase1.toLocaleString()}` },
          ].map((m, i) => (
            <div key={m.label} className={i === 0 ? "pr-4" : "px-4 last:pl-4 last:pr-0"}>
              <p className="text-[20px] font-semibold tracking-tight tabular-nums leading-none" style={{ color: INK }}>{m.value}</p>
              <p className="mt-1.5 text-[11px] font-medium text-neutral-400">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Review plan                                               */
/* ------------------------------------------------------------------ */
function StepReview({ data }: { data: CampaignData }) {
  const [knowOpen, setKnowOpen] = useState(false);

  const p1b = Math.round(data.budget * 0.1);
  const p2b = Math.round(data.budget * 0.2);
  const p3b = Math.round(data.budget * 0.3);
  const p4b = data.budget - p1b - p2b - p3b;

  const p1r = p1b * 1;
  const p2r = p2b * 2;
  const p3r = p3b * 3;
  const totalTarget = data.budget * data.roas;
  const p4r = totalTarget - p1r - p2r - p3r;
  const p4roas = Math.round(p4r / p4b);

  const committed = [
    { num: 1, label: "Phase 1 · Warm-up", budget: p1b, roas: 1, revenue: p1r },
    { num: 2, label: "Phase 2",           budget: p2b, roas: 2, revenue: p2r },
    { num: 3, label: "Phase 3",           budget: p3b, roas: 3, revenue: p3r },
  ];

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const KNOW_ITEMS = [
    {
      icon: "🎫",
      bg: "bg-red-50",
      title: "Every creator gets a unique tracker",
      desc: "Revenue is attributed via unique tracking links assigned to each creator — so you know exactly which creator drove which sale.",
    },
    {
      icon: "🔗",
      bg: "bg-amber-50",
      title: "E-commerce integration required before Phase 1 is live",
      desc: "Our technical team sets this up with you after payment. The campaign stays locked until the integration is confirmed.",
    },
    {
      icon: "📊",
      bg: "bg-green-50",
      title: "Guarantee applies to Warm-up phases only",
      desc: "Phases 1–3 have locked, guaranteed ROAS targets. The estimated phase beyond that is a projection — it gets more accurate as live data comes in.",
    },
  ];

  const TRACKER_BEST = [
    { icon: "🛍️", title: "Sitewide",      desc: "No product or category exclusions" },
    { icon: "⏰", title: "Always active", desc: "Keep trackers live during sales & promos" },
    { icon: "🏆", title: "Competitive",   desc: "Beat any public offer by at least 1%" },
  ];

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="rounded-2xl bg-[#4D2FB0] p-5 text-white">
        <p className="mb-2 text-xs font-medium text-white/60">Your plan</p>
        <h2 className="text-xl font-semibold leading-snug mb-3">Your 4-phase campaign plan</h2>
        <p className="text-sm leading-relaxed text-white/80">
          Targeting <strong className="text-white">{data.roas}× ROAS</strong> on a{" "}
          <strong className="text-white">{fmt(data.budget)}</strong> budget. Your first three phases
          are fully guaranteed — if a phase misses its target, we make it right. The estimated phase
          beyond that is a data-driven projection that sharpens as your campaign runs.
        </p>
      </div>

      {/* Committed phases */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-black/[0.07]" />
        <span className="text-xs font-medium text-neutral-400">Committed</span>
        <div className="flex-1 h-px bg-black/[0.07]" />
      </div>

      <div className="space-y-3">
        {committed.map((p, i) => (
          <div key={p.num} className="flex items-stretch gap-3">
            {/* Number + connector */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-sm font-semibold text-white">
                {p.num}
              </div>
              {i < committed.length - 1 && <div className="flex-1 w-px bg-[#4D2FB0]/25 my-1" />}
            </div>
            {/* Card */}
            <div className="flex-1 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(16,12,40,0.04)]" style={{ borderLeft: `3px solid ${BRAND}` }}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-neutral-700">{p.label}</p>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600">
                  Committed
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Budget: <strong className="text-neutral-600 tabular-nums">{fmt(p.budget)}</strong> · ROAS:{" "}
                  <strong className="text-neutral-600 tabular-nums">{p.roas}×</strong>
                </p>
                <p className="text-xs text-neutral-400 tabular-nums">≈{fmt(p.revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated phases */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-black/[0.07]" />
        <span className="text-xs font-medium text-neutral-400">Estimated phase</span>
        <div className="flex-1 h-px bg-black/[0.07]" />
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-400 text-amber-500 text-sm font-semibold">
          ~
        </div>
        <div className="flex-1 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(16,12,40,0.04)]" style={{ borderLeft: "3px solid #f59e0b" }}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-neutral-700">Phase 4 · Growth</p>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-500">
              Estimated
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Budget: <strong className="text-neutral-600 tabular-nums">{fmt(p4b)}</strong> · ROAS:{" "}
              <strong className="text-neutral-600 tabular-nums">{p4roas}×</strong>
            </p>
            <p className="text-xs text-neutral-400 tabular-nums">≈{fmt(p4r)}</p>
          </div>
        </div>
      </div>

      {/* Funding disclaimer — no phase runs until the user funds it */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#4D2FB0]/12 bg-[#4D2FB0]/[0.04] p-4">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#4D2FB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4" />
        </svg>
        <p className="text-xs leading-relaxed text-neutral-600">
          <strong className="text-[#3F2596]">No phase runs until you fund it.</strong> Each phase
          starts only after you review and fund it — today you&apos;re committing to Phase 1 only.
        </p>
      </div>

      {/* Total projected revenue */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-700">Total projected revenue</p>
            <p className="mt-0.5 text-xs text-green-600">Across all 4 phases · {fmt(data.budget)} spend</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-green-600 leading-none">{fmt(totalTarget)}</p>
            <p className="mt-1 text-xs font-medium text-green-500">✓ matches your {data.roas}× target</p>
          </div>
        </div>
      </div>

      {/* Before you fund Phase 1 accordion */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(16,12,40,0.04)] overflow-hidden">
        <button
          onClick={() => setKnowOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4D2FB0]/[0.08]">
            <svg className="h-4 w-4 text-[#4D2FB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="flex-1 text-sm font-semibold text-neutral-700">Before you fund Phase 1 — 4 things to know</p>
          <svg className={`h-4 w-4 text-neutral-400 transition-transform ${knowOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {knowOpen && (
          <div className="border-t border-black/[0.05] divide-y divide-black/[0.04]">
            {KNOW_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${item.bg}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-700">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Tracker best practices */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4D2FB0]/[0.08] text-lg">
                  💡
                </div>
                <p className="text-sm font-semibold text-neutral-700">Tracker best practices</p>
              </div>
              <div className="space-y-2">
                {TRACKER_BEST.map((b) => (
                  <div key={b.title} className="rounded-xl bg-neutral-50 p-3 text-center">
                    <p className="text-xl mb-1">{b.icon}</p>
                    <p className="text-sm font-semibold text-neutral-700">{b.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{b.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                Trackers only work if customers can actually use them. Keep them active, competitive, and unrestricted — that&apos;s what drives accurate attribution and results.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — Fund Phase 1                                              */
/* ------------------------------------------------------------------ */
function StepPay({
  data,
  profileComplete,
  onAddBilling,
  onPay,
}: {
  data: CampaignData;
  profileComplete: boolean;
  onAddBilling: () => void;
  onPay: () => void;
}) {
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  const p1Budget = Math.round(data.budget * 0.1);
  const vat = Math.round(p1Budget * 0.05);
  const total = p1Budget + vat;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const canPay = check1 && check2 && profileComplete;

  const rows = [
    { label: "Campaign",        value: data.name || "—" },
    { label: "Phase 1 budget",  value: fmt(p1Budget) },
    { label: "ROAS target",     value: "1× (Warm-up)" },
    { label: "Expected revenue", value: fmt(p1Budget) },
    { label: "VAT (5%)",         value: `$${vat.toFixed(2)}` },
  ];

  return (
    <div className="space-y-5">
      {/* Due today card */}
      <div className="rounded-2xl bg-[#4D2FB0]/[0.06] p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#4D2FB0] mb-2">
          Due today — Phase 1 only
        </p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums text-[#4D2FB0] leading-none">{fmt(p1Budget)}</p>
        <p className="mt-2 text-sm text-neutral-500">Phases 2 &amp; 3 funded separately as you progress.</p>
      </div>

      {/* Phase unlock notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">⚡</span>
        <p className="text-sm leading-relaxed text-amber-800">
          You&apos;re starting with <strong>Phase 1</strong>. The next phase only unlocks once the
          live phase crosses <strong>the 80% unlock line</strong> — your campaign progresses
          one phase at a time.
        </p>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(16,12,40,0.04)] overflow-hidden">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between px-5 py-3.5 ${i < rows.length - 1 ? "border-b border-black/[0.04]" : ""}`}>
            <p className="text-sm text-neutral-400">{r.label}</p>
            <p className="text-sm font-medium tabular-nums text-neutral-700">{r.value}</p>
          </div>
        ))}
        <div className="border-t border-[#4D2FB0]/15 flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold text-neutral-700">Total due now</p>
          <p className="text-[18px] font-semibold tabular-nums text-[#4D2FB0]">{fmt(total)}</p>
        </div>
      </div>

      {/* Secured by Mamo Pay */}
      <div className="rounded-2xl bg-[#4D2FB0]/[0.06] p-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <svg className="h-5 w-5 text-[#4D2FB0]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#4D2FB0]">Secured by Mamo Pay</p>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
            Clicking &quot;Fund Phase 1&quot; will redirect you to Mamo Pay&apos;s secure checkout. Your card
            details are never stored by MoonTech.
          </p>
        </div>
      </div>

      {/* Billing required warning — only if profile incomplete */}
      {!profileComplete && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🧾</span>
          <p className="flex-1 text-sm leading-relaxed text-red-700">
            <strong>Billing details required.</strong> We need at least your{" "}
            <strong>VAT number and office location</strong> to issue a tax-compliant invoice before
            payment.
          </p>
          <button
            onClick={onAddBilling}
            className="shrink-0 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Add now →
          </button>
        </div>
      )}

      {/* Confirm checkboxes */}
      <div>
        <p className="text-sm font-semibold text-neutral-700 mb-3">Before you fund Phase 1, please confirm</p>
        <div className="space-y-3">
          {[
            {
              checked: check1,
              set: setCheck1,
              text: (
                <>
                  I understand this campaign runs on{" "}
                  <strong>unique coupon / tracking codes</strong>, and I&apos;ll keep those codes active
                  and honour them for the full campaign.
                </>
              ),
            },
            {
              checked: check2,
              set: setCheck2,
              text: (
                <>
                  I accept the{" "}
                  <span className="font-semibold text-[#4D2FB0]">Campaign Policy</span> for this
                  campaign and agree to the campaign terms.
                </>
              ),
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.set((v) => !v)}
              className={`w-full flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                item.checked ? "border-[#4D2FB0]/40 bg-[#4D2FB0]/[0.05]" : "border-black/[0.09] bg-white"
              }`}
            >
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                item.checked ? "border-[#4D2FB0] bg-[#4D2FB0]" : "border-neutral-300 bg-white"
              }`}>
                {item.checked && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">{item.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Fund Phase 1 button (inside content for now — real bottom bar handles it) */}
      <div className="pb-2">
        <button
          onClick={canPay ? onPay : undefined}
          disabled={!canPay}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold text-white transition active:scale-[0.98] ${
            canPay
              ? "bg-[#4D2FB0] hover:bg-[#3F2596]"
              : "bg-[#4D2FB0]/40 cursor-not-allowed"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Fund Phase 1 — {fmt(total)}
        </button>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Includes ${vat} VAT (5%) · Secured by Mamo Pay
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building screen                                                     */
/* ------------------------------------------------------------------ */
function BuildingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl mb-6 animate-spin" style={{ animationDuration: "3s" }}>⚙️</div>
      <h2 className="text-2xl font-bold text-neutral-700 mb-3">Building your plan…</h2>
      <p className="text-[15px] text-neutral-400 leading-relaxed max-w-xs">
        Analysing budget, ROAS target, and traffic data to design your phase structure.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        {[100, 80, 88].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-[#4D2FB0]/[0.12] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4D2FB0]/40 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-[#4D2FB0]/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* Inline "building" widget — a live build receipt that flips into the
   celebratory "Plan ready" card (wcp- classes in globals.css). Task rows
   check themselves off on a pure-CSS delay timeline inside the 3.2s build
   window; on completion the gradient border powers up, a one-shot shimmer
   sweeps the card and the header flips to the Plan ready moment with a
   "View plan" CTA that (re)opens the plan panel. */
const WCP_TASKS = [
  { label: "Analysing budget", chip: "Mapped", delay: 0.9 },
  { label: "Matching ROAS curve", chip: "Locked", delay: 1.8 },
  { label: "Structuring phases", chip: "4 phases", delay: 2.7 },
];

/* deterministic sparkle constellation around the hero badge */
const WCP_SPARKS = [
  { left: -9, top: -5, size: 9, delay: 0.3, color: "#7C5CE0" },
  { left: 30, top: -8, size: 7, delay: 0.42, color: "#9B7BF0" },
  { left: 37, top: 12, size: 6, delay: 0.55, color: "#4D2FB0" },
  { left: -12, top: 16, size: 7, delay: 0.48, color: "#9B7BF0" },
  { left: 12, top: -12, size: 6, delay: 0.66, color: "#7C5CE0" },
  { left: 28, top: 28, size: 5, delay: 0.6, color: "#C4B5FD" },
];

function BuildingWidget({ onDone, onOpenPlan, planOpen }: { onDone: () => void; onOpenPlan: () => void; planOpen: boolean }) {
  const [complete, setComplete] = useState(false);
  // Fire exactly once on mount. onDone is an inline prop that changes identity
  // on every parent render — depending on it would re-arm the timer and keep
  // reopening the plan panel after the user dismisses it.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => { setComplete(true); onDoneRef.current(); }, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`wcp-card mt-0.5 w-full max-w-sm ${complete ? "wcp-card-ready" : ""}`}>
      <div className="wcp-inner relative overflow-hidden bg-white">
        {/* one-shot shimmer across the whole card on completion */}
        {complete && <span aria-hidden="true" className="wcp-card-sweep" />}

        {/* ── Header ─────────────────────────────────────────────── */}
        {complete ? (
          <div className="wcp-header-band border-b border-[#4D2FB0]/[0.08] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative h-8 w-8 shrink-0">
                <span className="wcp-ring absolute inset-0 rounded-full border-2 border-[#7C5CE0]" />
                <span className="wcp-hero-badge relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4D2FB0] to-[#7C5CE0] shadow-[0_4px_14px_-2px_rgba(77,47,176,0.55)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path className="wcp-check wcp-hero-check" pathLength={1} d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {WCP_SPARKS.map((s, i) => (
                  <span
                    key={i}
                    className="wcp-sparkle pointer-events-none absolute leading-none"
                    style={{ left: s.left, top: s.top, fontSize: s.size, color: s.color, "--wcp-d": `${s.delay}s` } as React.CSSProperties}
                  >
                    ✦
                  </span>
                ))}
              </span>
              <div className="min-w-0">
                <p className="wcp-pop text-[15px] font-bold leading-tight" style={{ "--wcp-d": "0.12s" } as React.CSSProperties}>
                  <span className="wcp-grad-text">Plan ready</span>
                </p>
                <p className="wcp-rise truncate text-[11px] font-medium text-[#4D2FB0]/60" style={{ "--wcp-d": "0.26s" } as React.CSSProperties}>
                  4 phases · matched to your budget &amp; ROAS target
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden border-b border-black/[0.05] bg-[#F8F7FD] px-4 py-3">
            <span className="wcp-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#7C5CE0]/[0.10] to-transparent" />
            <div className="relative flex items-center gap-3">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <svg viewBox="0 0 28 28" className="wcp-dial h-7 w-7" aria-hidden="true">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="#7C5CE0" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" strokeDasharray="3.5 5.2" />
                </svg>
                <span aria-hidden="true" className="wcp-core absolute h-2 w-2 rounded-full bg-[#4D2FB0]" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#191234]">
                  Building your plan
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="wcp-dot" style={{ "--wcp-d": `${i * 0.22}s` } as React.CSSProperties}>.</span>
                  ))}
                </p>
                <p className="truncate text-[11px] text-neutral-400">Analysing budget, ROAS target &amp; traffic data</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Live receipt rows ──────────────────────────────────── */}
        <div className="divide-y divide-dashed divide-[#4D2FB0]/[0.07] px-4">
          {WCP_TASKS.map((t, i) => (
            <div key={t.label} className="flex items-center gap-2.5 py-2.5">
              <span className="w-4 text-[10px] font-medium tabular-nums text-neutral-300">0{i + 1}</span>
              <span className="relative h-[18px] w-[18px] shrink-0">
                {complete ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-[#4D2FB0] to-[#7C5CE0]">
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path className="wcp-check" pathLength={1} d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                ) : (
                  <>
                    <span className="wcp-task-wait absolute inset-0 flex items-center justify-center" style={{ "--wcp-d": `${t.delay}s` } as React.CSSProperties}>
                      <span className="wcp-spinner h-[15px] w-[15px]" />
                    </span>
                    <span className="wcp-task-flip absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#4D2FB0] to-[#7C5CE0]" style={{ "--wcp-d": `${t.delay}s` } as React.CSSProperties}>
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path className="wcp-check wcp-task-check" pathLength={1} d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </>
                )}
              </span>
              <span className={`flex-1 truncate text-[12px] font-medium ${complete ? "text-[#191234]" : "text-neutral-500"}`}>{t.label}</span>
              {complete ? (
                <span className="rounded-full bg-[#4D2FB0]/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4D2FB0]/80">{t.chip}</span>
              ) : (
                <span className="relative flex h-[17px] min-w-[56px] items-center justify-end">
                  <span className="wcp-task-skel wcp-skel absolute right-0 h-2 w-12 rounded-full" style={{ "--wcp-d": `${t.delay}s` } as React.CSSProperties} />
                  <span className="wcp-task-chip rounded-full bg-[#4D2FB0]/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4D2FB0]/80" style={{ "--wcp-d": `${t.delay}s` } as React.CSSProperties}>
                    {t.chip}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Footer CTA — reopens the plan panel any time ───────── */}
        {complete && (
          <div className="wcp-rise border-t border-dashed border-[#4D2FB0]/[0.09] px-4 pb-3.5 pt-3" style={{ "--wcp-d": "0.45s" } as React.CSSProperties}>
            <button
              type="button"
              onClick={onOpenPlan}
              className={
                planOpen
                  ? "group flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#4D2FB0]/20 bg-[#4D2FB0]/[0.04] px-4 py-2.5 text-[13px] font-semibold text-[#4D2FB0]/70 transition-transform hover:-translate-y-px active:translate-y-0"
                  : "wcp-cta group flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4D2FB0] to-[#6D4AD6] px-4 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-px active:translate-y-0"
              }
            >
              {planOpen ? "Plan open — view again" : "View plan"}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Processing screen                                                   */
/* ------------------------------------------------------------------ */
function ProcessingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#F7F7F8] text-center px-6">
      <div className="text-[72px] mb-8 drop-shadow-md" style={{ animation: "float-a 3s ease-in-out infinite" }}>
        💳
      </div>
      <h2 className="text-2xl font-bold text-neutral-700 mb-2">Processing payment…</h2>
      <p className="text-sm text-neutral-400">Please don&apos;t close the app.</p>
      <div className="mt-8 flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-[#4D2FB0]/60 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI agent chat flow                                                  */
/* ------------------------------------------------------------------ */
type AiMsg = { role: "ai" | "user"; text?: string; widget?: "building" };

const AI_FLOW: { key: string; ask: string; title: string; chips: string[]; skip?: boolean; multi?: boolean; calculator?: boolean }[] = [
  { key: "setup",  ask: "Hi! I'm the MoonTech assistant ✦\nHow would you like to set up your campaign?", title: "Setup method", chips: ["Continue with the MoonTech assistant", "Set it up manually"] },
  { key: "name",   ask: "Great — let's build it together. First, what should we call the campaign?", title: "Campaign name", chips: ["Spring 2026", "Summer Sale", "Brand Launch", "Ramadan 2026"] },
  { key: "type",   ask: "Got it! What's the goal for this campaign?", title: "Campaign goal", chips: ["Drive revenue (ROAS guaranteed)", "Grow brand awareness"] },
  { key: "geo",    ask: "Which markets should it run in? Pick all that apply.", title: "Target markets", chips: ["UAE", "KSA", "Kuwait", "All GCC"], multi: true },
  { key: "gender", ask: "Who's your target audience?", title: "Target audience", chips: ["All genders", "Women only", "Men only"] },
  { key: "age",    ask: "And the age range you're after?", title: "Age range", chips: ["18–34", "25–44", "35–54", "All ages"] },
  { key: "plan",   ask: "Now the numbers. Drag both — I'll tell you how confident I am in the target as you go.", title: "Budget & target ROAS", chips: [], calculator: true },
  { key: "brief",  ask: "Last one — anything creators should know? Any do's or don'ts?", title: "Creator brief", chips: ["Keep it casual & authentic", "No competitor mentions", "Focus on product quality"], skip: true },
];

function mapAnswers(a: Record<string, string>): Partial<CampaignData> {
  const p: Partial<CampaignData> = {};
  if (a.name) p.name = a.name;
  if (a.type) p.type = /aware|brand/i.test(a.type) ? "awareness" : "roas";
  if (a.geo) {
    const g = a.geo.toLowerCase();
    const count = [/uae/, /ksa/, /kuwait/].filter((re) => re.test(g)).length;
    p.region = /gcc|all/.test(g) || count > 1 ? "gcc"
      : /ksa/.test(g) ? "ksa"
      : /kuwait/.test(g) ? "kuwait"
      : "uae";
  }
  if (a.gender) p.gender = /wom|female/i.test(a.gender) ? "female" : /\bmen|male/i.test(a.gender) ? "male" : "all";
  if (a.age) p.age = a.age.includes("18") ? "18-34" : a.age.includes("25") ? "25-44" : a.age.includes("35") ? "35-54" : "all";
  if (a.budget) { const n = parseInt(a.budget.replace(/[^0-9]/g, ""), 10) || 10000; p.budget = Math.min(80000, Math.max(1000, n)); }
  if (a.roas) { const n = parseInt(a.roas.replace(/[^0-9]/g, ""), 10) || 5; p.roas = Math.min(12, Math.max(1, n)); }
  if (a.brief && !/skip/i.test(a.brief)) p.brief = a.brief;
  return p;
}

function AgentChat({ onComplete, onSwitchManual, onOpenPlan, planOpen }: {
  onComplete: (patch: Partial<CampaignData>) => void;
  onSwitchManual: () => void;
  onOpenPlan: () => void;
  planOpen: boolean;
}) {
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [typing, setTyping] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [calc, setCalc] = useState({ budget: 10000, roas: 5 });
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finalPatch = useRef<Partial<CampaignData>>({});

  const pushAi = (text: string) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text }]);
    }, 700);
    timers.current.push(t);
  };

  useEffect(() => {
    const t = setTimeout(() => pushAi(AI_FLOW[0].ask), 350);
    timers.current.push(t);
    const snapshot = timers.current;
    return () => snapshot.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Clear multi-select choices whenever the step changes.
  useEffect(() => { setSelected([]); }, [stepIdx]);

  const current = stepIdx < AI_FLOW.length ? AI_FLOW[stepIdx] : null;
  const isSetup = current?.key === "setup";
  const isMulti = !!current?.multi;

  // Toggle a chip in a multi-select step. "All GCC" is exclusive with the
  // individual markets (picking it clears the rest, and vice versa).
  function toggleChip(chip: string) {
    setSelected((prev) => {
      const ALL = "All GCC";
      if (chip === ALL) return prev.includes(ALL) ? [] : [ALL];
      const rest = prev.filter((c) => c !== ALL);
      return rest.includes(chip) ? rest.filter((c) => c !== chip) : [...rest, chip];
    });
  }

  function answer(val: string) {
    const v = val.trim();
    if (!v || typing) return;
    // After the plan is built the chat stays open — answer freeform questions
    // with a helpful nudge back to the plan panel.
    if (done) {
      setMessages((m) => [...m, { role: "user", text: v }]);
      setInputVal("");
      const lower = v.toLowerCase();
      const reply = /budget|roas|target|phase|change|edit|adjust/.test(lower)
        ? "Happy to help adjust that! For now you can review every phase, budget and ROAS target in the plan panel — open it from the “Plan ready” card above. Fine-tuning via chat is coming soon."
        : /pay|launch|start|go live/.test(lower)
        ? "Once you're happy with the plan, hit “Fund Phase 1” in the plan panel — only Phase 1 is due today, the rest unlock as targets are hit."
        : "Your 4-phase plan is ready — open it anytime from the “Plan ready” card above. Ask me about budgets, phases, or how the ROAS guarantee works.";
      pushAi(reply);
      return;
    }
    const q = AI_FLOW[stepIdx];
    if (q.calculator) {
      /* One step, two answers. `budget` and `roas` stay separate keys because
         mapAnswers and the closing summary both read them by name. */
      const budgetTxt = `$${calc.budget.toLocaleString()}`;
      const roasTxt = `${calc.roas}×`;
      setMessages((m) => [...m, { role: "user", text: `${budgetTxt} · ${roasTxt} ROAS` }]);
      const nextAnswers = { ...answers, budget: budgetTxt, roas: roasTxt };
      setAnswers(nextAnswers);
      setInputVal("");
      const next = stepIdx + 1;
      setStepIdx(next);
      pushAi(AI_FLOW[next].ask);
      return;
    }
    if (q.key === "setup") {
      setMessages((m) => [...m, { role: "user", text: v }]);
      setInputVal("");
      if (/manual/i.test(v)) {
        const t = setTimeout(onSwitchManual, 450);
        timers.current.push(t);
        return;
      }
      setStepIdx(1);
      pushAi(AI_FLOW[1].ask);
      return;
    }
    setMessages((m) => [...m, { role: "user", text: v }]);
    const nextAnswers = { ...answers, [q.key]: v };
    setAnswers(nextAnswers);
    setInputVal("");
    const next = stepIdx + 1;
    setStepIdx(next);
    if (next < AI_FLOW.length) {
      pushAi(AI_FLOW[next].ask);
    } else {
      setDone(true);
      finalPatch.current = mapAnswers(nextAnswers);
      const goalTxt = /aware|brand/i.test(nextAnswers.type || "") ? "Brand awareness" : "ROAS guaranteed";
      const summary = `Perfect — here's your campaign:\n\n• Name — ${nextAnswers.name || "Campaign"}\n• Goal — ${goalTxt}\n• Market — ${nextAnswers.geo || "UAE"}\n• Audience — ${nextAnswers.gender || "All"}, ${nextAnswers.age || "18–34"}\n• Budget — ${nextAnswers.budget || "$10,000"} · ${nextAnswers.roas || "5×"}\n\nBuilding your guaranteed plan now…`;
      pushAi(summary);
      // Show the building step as an inline widget in the chat (not a full-page
      // takeover); when it finishes, hand off to the review phase.
      const t = setTimeout(() => setMessages((m) => [...m, { role: "ai", widget: "building" }]), 1650);
      timers.current.push(t);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-7 px-5 py-8">
          {messages.map((m, i) =>
            m.role === "ai" ? (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-[13px] text-white">✦</div>
                {m.widget === "building" ? (
                  <div className="min-w-0 flex-1">
                    <BuildingWidget
                      onDone={() => onComplete(finalPatch.current)}
                      onOpenPlan={onOpenPlan}
                      planOpen={planOpen}
                    />
                  </div>
                ) : (
                  <p className="mt-0.5 min-w-0 flex-1 whitespace-pre-line text-[15px] leading-7 text-neutral-800">{m.text}</p>
                )}
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] whitespace-pre-line rounded-3xl bg-neutral-100 px-4 py-2.5 text-[15px] leading-7 text-neutral-800">{m.text}</div>
              </div>
            )
          )}
          {typing && (
            <div className="flex items-start gap-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-[13px] text-white">✦</div>
              <div className="mt-3 flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer — stays mounted after the plan is built so the user can
          keep talking to the assistant. */}
      {(
        <div className="mx-auto w-full max-w-3xl px-5 pb-5 pt-1">
          {!typing && current && (
            <div className="mb-3 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_20px_rgba(16,12,40,0.07)]">
              <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-3">
                <p className="text-[14px] font-medium text-neutral-800">{current.title}</p>
                {current.key !== "setup" && (
                  <span className="shrink-0 text-[11px] text-neutral-400">{stepIdx} of {AI_FLOW.length - 1}</span>
                )}
              </div>
              {current.calculator ? (
                /* The calculator answers this step instead of a chip list. It
                   is the same component the manual wizard uses, so the two
                   paths cannot drift apart, and the confidence score updates
                   as you drag rather than after you commit. */
                <div className="px-4 pb-4 pt-2">
                  <PlanCalculator
                    compact
                    budget={calc.budget}
                    roas={calc.roas}
                    onChange={(d) => setCalc((c) => ({ ...c, ...d }))}
                  />
                  <button
                    onClick={() => answer(`$${calc.budget.toLocaleString()} · ${calc.roas}×`)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition-colors"
                    style={{ backgroundColor: BRAND }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BRAND_HOVER; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = BRAND; }}
                  >
                    Use ${calc.budget.toLocaleString()} at {calc.roas}×
                    <CaretRight size={14} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              ) : (
              <div className="divide-y divide-black/[0.05]">
                {current.chips.map((c, i) => {
                  const active = isMulti && selected.includes(c);
                  return (
                    <button key={c} onClick={() => (isMulti ? toggleChip(c) : answer(c))}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-neutral-50 ${active ? "bg-[#4D2FB0]/[0.04] text-neutral-800" : "text-neutral-700"}`}>
                      {isMulti ? (
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${active ? "border-[#4D2FB0] bg-[#4D2FB0] text-white" : "border-black/15 bg-white text-transparent"}`}>
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500">{i + 1}</span>
                      )}
                      {c}
                    </button>
                  );
                })}
                {!isSetup && (
                  <div className="flex items-center gap-3 px-4 py-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <button onClick={() => inputRef.current?.focus()}
                      className="flex-1 py-1 text-left text-sm text-neutral-400 transition hover:text-neutral-600">
                      Something else
                    </button>
                    {isMulti ? (
                      <button onClick={() => answer(selected.join(", "))} disabled={selected.length === 0}
                        className="shrink-0 rounded-lg bg-[#4D2FB0] px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#3F2596] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">
                        Confirm{selected.length ? ` (${selected.length})` : ""}
                      </button>
                    ) : current.skip ? (
                      <button onClick={() => answer("Skip for now")}
                        className="shrink-0 rounded-lg border border-black/[0.09] bg-white px-3 py-1 text-[12px] font-medium text-neutral-500 transition hover:bg-neutral-50">
                        Skip
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              )}
            </div>
          )}
          <div className={`flex items-end gap-1.5 rounded-[28px] border border-black/[0.09] py-2 pl-5 pr-2 shadow-[0_4px_20px_rgba(16,12,40,0.07)] transition focus-within:border-[#4D2FB0]/35 ${isSetup ? "bg-neutral-50" : "bg-white"}`}>
            <textarea
              ref={inputRef}
              value={inputVal}
              disabled={isSetup}
              onChange={(e) => {
                setInputVal(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); answer(inputVal); } }}
              rows={1}
              placeholder={isSetup ? "Choose an option above" : done ? "Ask about your plan…" : "Type your answer…"}
              className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
            />
            <button onClick={() => answer(inputVal)} disabled={!inputVal.trim() || typing || isSetup} aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-white transition hover:bg-[#3F2596] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
          {!done && current?.key !== "setup" && (
            <p className="mt-2.5 text-center text-[11px] text-neutral-400">
              Prefer to fill it in yourself?{" "}
              <button onClick={onSwitchManual} className="text-neutral-500 underline-offset-2 transition hover:text-[#4D2FB0] hover:underline">Switch to manual setup</button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AgentFlow({
  data, onPatch, profileComplete, onAddBilling, onClose, onSwitchManual, onDone, firstRun = false, jumpToPay = false,
}: {
  data: CampaignData;
  onPatch: (patch: Partial<CampaignData>) => void;
  profileComplete: boolean;
  onAddBilling: () => void;
  onClose: () => void;
  onSwitchManual: () => void;
  onDone: () => void;
  /** First-time arrival (from the welcome overlay): there is no app to go
      back to yet, so show the MoonTech logo instead of a close button. */
  firstRun?: boolean;
  /** Returning from the billing/profile page: skip straight to the pay step
      instead of restarting the chat. */
  jumpToPay?: boolean;
}) {
  const [phase, setPhase] = useState<"chat" | "building" | "review" | "pay" | "processing">("chat");
  const showHeader = phase !== "building" && phase !== "processing";

  useEffect(() => {
    if (jumpToPay) setPhase("pay");
  }, [jumpToPay]);

  return (
    <div className="min-h-screen bg-[#F7F7F8]" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      {showHeader && (
        <header className="sticky top-0 z-20 h-[65px] border-b border-black/[0.06] bg-white/80 backdrop-blur-sm">
          {/* Logo / close button stays pinned to the far left; the title and
              AI-assistant pill align with the chat column below. */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            {firstRun ? (
              <Image src="/logo.svg" alt="MoonTech" width={110} height={20} priority className="h-5 w-auto" />
            ) : (
              <button onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] text-neutral-500 transition hover:bg-neutral-50">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {/* When the plan panel is open the chat column shrinks by 520px, so
              mirror that here to keep the title aligned with the chat start. */}
          <div className={`h-full ${phase === "review" ? "md:pr-[520px]" : ""}`}>
            <div className="mx-auto flex h-full w-full max-w-3xl items-center gap-3 px-5">
              <h1 className="text-base font-semibold" style={{ color: INK }}>New campaign</h1>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#4D2FB0]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#4D2FB0]">✦ MoonTech assistant</span>
            </div>
          </div>
          {/* First-run only: Help affordance on the far right (flow TBD). */}
          {firstRun && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] px-3 py-2 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Help
              </button>
            </div>
          )}
        </header>
      )}

      {/* Chat stays mounted through review; the plan opens as a right-side
          panel next to it. Only payment/processing take over the full screen. */}
      {(phase === "chat" || phase === "review") && (
        <div className="flex min-h-0" style={{ height: "calc(100vh - 65px)" }}>
          <div className={`${phase === "review" ? "hidden md:block" : ""} min-w-0 flex-1`}>
            <AgentChat
              onSwitchManual={onSwitchManual}
              onComplete={(patch) => { onPatch(patch); setPhase("review"); }}
              onOpenPlan={() => setPhase("review")}
              planOpen={phase === "review"}
            />
          </div>

          {phase === "review" && (
            <aside className="animate-slide-in-right flex w-full shrink-0 flex-col border-l border-black/[0.08] bg-white md:w-[520px]">
              <div className="flex-1 overflow-y-auto px-5 py-6"><StepReview data={data} /></div>
              <div className="border-t border-black/[0.06] bg-white px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Closes the panel only — the user stays in the chat and can
                      reopen the plan from the "Plan ready" widget. */}
                  <button onClick={() => setPhase("chat")} className="shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-700">Close plan</button>
                  <p className="flex-1" />
                  <button onClick={() => setPhase("pay")}
                    className="shrink-0 rounded-xl bg-[#4D2FB0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F2596] active:scale-[0.98]">
                    Fund Phase 1 →
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {phase === "pay" && (
        <div className="mx-auto max-w-2xl px-5 py-6 pb-10">
          <StepPay data={data} profileComplete={profileComplete} onAddBilling={onAddBilling} onPay={() => setPhase("processing")} />
        </div>
      )}

      {phase === "processing" && <ProcessingScreen onDone={onDone} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Welcome overlay — shown once when an eligible brand first lands here.
   A choreographed celebration: springy card entrance, confetti burst,
   self-drawing checkmark, keynote word-by-word headline, count-up stats
   and a shimmering CTA. All entrance motion is gated behind
   prefers-reduced-motion: no-preference (see wc- classes in globals.css). */
/* ------------------------------------------------------------------ */

// Deterministic confetti field: index-derived values (golden-angle spread),
// no Math.random, so server and client render identical markup.
const WC_CONFETTI_COLORS = ["#4D2FB0", "#7C5CE0", "#A78BFA", "#22C55E", "#F59E0B", "#E879F9"];
const WC_CONFETTI = Array.from(Array(22).keys()).map((i) => ({
  left: `${(i * 137.5) % 100}%`,
  delay: `${(0.5 + ((i * 47) % 55) / 100).toFixed(2)}s`,
  duration: `${(2.1 + ((i * 31) % 90) / 100).toFixed(2)}s`,
  w: i % 3 === 0 ? "9px" : "6px",
  h: i % 4 === 1 ? "6px" : "10px",
  r: i % 4 === 2 ? "50%" : "2px",
  color: WC_CONFETTI_COLORS[i % WC_CONFETTI_COLORS.length],
  drift: `${((i * 53) % 90) - 45}px`,
  spin: `${(i % 2 === 0 ? 1 : -1) * (300 + ((i * 71) % 420))}deg`,
  fall: `${430 + ((i * 29) % 130)}px`,
}));

// Headline words rise out of overflow masks one-by-one, keynote-style.
const WC_WORDS: { t: string; hl?: boolean; brBefore?: boolean }[] = [
  { t: "Your" }, { t: "brand" }, { t: "is" }, { t: "eligible", hl: true },
  { t: "for", brBefore: true }, { t: "a" }, { t: "ROAS" }, { t: "campaign" },
];

function WelcomeOverlay({ industry, onStart }: { industry: string; onStart: () => void }) {
  // Count-up hero moment: 0 → 280K / 5× / 100% while the stat tiles pop in.
  const [counts, setCounts] = useState({ visitors: 0, roas: 0, perf: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCounts({ visitors: 280, roas: 5, perf: 100 });
      return;
    }
    const DELAY = 600;
    const DURATION = 1300;
    const startedAt = performance.now();
    const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
    const tick = (now: number) => {
      const elapsed = now - startedAt - DELAY;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(tick); return; }
      const p = Math.min(elapsed / DURATION, 1);
      const e = easeOutExpo(p);
      setCounts({
        visitors: Math.round(280 * e),
        roas: Math.min(5, Math.round(50 * e) / 10),
        perf: Math.round(100 * e),
      });
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const stats = [
    { v: `${counts.visitors}K`, l: "Monthly visitors" },
    { v: Number.isInteger(counts.roas) ? `${counts.roas}×` : `${counts.roas.toFixed(1)}×`, l: "Guaranteed ROAS" },
    { v: `${counts.perf}%`, l: "Performance-based" },
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Welcome to MoonTech">
      <div className="wc-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-8">
        <div className="wc-card relative w-full max-w-md overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-2xl shadow-black/20">
          {/* Confetti burst (one-time, card-scoped, pointer-transparent) */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
            {WC_CONFETTI.map((p, i) => (
              <span
                key={i}
                className="wc-confetti-piece"
                style={{
                  "--wc-left": p.left, "--wc-delay": p.delay, "--wc-duration": p.duration,
                  "--wc-w": p.w, "--wc-h": p.h, "--wc-r": p.r, "--wc-color": p.color,
                  "--wc-drift": p.drift, "--wc-spin": p.spin, "--wc-fall": p.fall,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Eligible header band */}
          <div className="wc-header-gradient relative px-6 pt-6 pb-5">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#4D2FB0]/10 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-violet-400/15 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-3">
              <span
                className="wc-rise inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700"
                style={{ animationDelay: "0.25s" }}
              >
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="wc-ping absolute inline-flex h-full w-full rounded-full bg-green-500" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                Welcome to MoonTech 🎉
              </span>
              <div className="relative h-11 w-11 shrink-0">
                <span className="wc-ring absolute inset-0 rounded-full border-2 border-violet-500" aria-hidden="true" />
                <span className="wc-ring absolute inset-0 rounded-full border-2 border-violet-400" style={{ animationDelay: "1.15s" }} aria-hidden="true" />
                <div className="wc-badge relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg shadow-violet-600/25 ring-1 ring-violet-100">
                  <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path className="wc-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" pathLength={1} />
                  </svg>
                </div>
              </div>
            </div>

            {/* Keynote headline — words rise out of masks with 55ms stagger */}
            <h2 className="relative mt-3 text-[22px] font-bold leading-tight tracking-tight text-[#191234]">
              {WC_WORDS.map((w, i) => (
                <span key={w.t}>
                  {w.brBefore && <br />}
                  <span className="wc-mask">
                    <span
                      className={"wc-word" + (w.hl ? " wc-grad-text" : "")}
                      style={{ animationDelay: `${350 + i * 55}ms` }}
                    >
                      {w.t}
                    </span>
                  </span>
                  {i < WC_WORDS.length - 1 && " "}
                </span>
              ))}
            </h2>
            <p className="wc-rise relative mt-2 text-[13px] text-neutral-500" style={{ animationDelay: "0.45s" }}>
              Website verified · 280K monthly visitors confirmed · Guaranteed ROAS ready to activate
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Stat tiles pop in while their numbers count up */}
            <div className="flex gap-2.5">
              {stats.map((s, i) => (
                <div
                  key={s.l}
                  className="wc-pop flex-1 rounded-xl border border-black/[0.06] bg-neutral-50 px-3 py-2.5 text-center transition-colors hover:border-violet-200 hover:bg-violet-50/60"
                  style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  <p className="text-lg font-bold leading-none tabular-nums text-violet-600">{s.v}</p>
                  <p className="mt-1 text-[10px] font-medium text-neutral-500">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Personalized motivation */}
            <div
              className="wc-rise mt-4 flex items-center gap-3 rounded-xl border border-[#4D2FB0]/12 bg-[#4D2FB0]/[0.05] px-4 py-3"
              style={{ animationDelay: "0.95s" }}
            >
              <span className="wc-sparkle text-lg leading-none text-[#4D2FB0]">✦</span>
              <p className="text-[13px] font-medium text-[#3F2596]">
                {industry} brands using MoonTech generated <span className="font-bold">8× ROAS</span> last month.
              </p>
            </div>

            {/* CTA lands last: violet glow, shimmer sweeps, then a breathing halo */}
            <div className="wc-rise relative mt-5" style={{ animationDelay: "1.05s" }}>
              <div className="wc-cta-halo pointer-events-none absolute -inset-1 rounded-2xl bg-[#4D2FB0] blur-lg" aria-hidden="true" />
              <button
                onClick={onStart}
                className="wc-cta group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#4D2FB0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3F2596] active:scale-[0.98]"
              >
                Start now
                <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </button>
            </div>
            <p className="wc-rise mt-2.5 text-center text-[11px] text-neutral-400" style={{ animationDelay: "1.15s" }}>
              Let&apos;s build your first campaign with the MoonTech assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function NewCampaign() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "agent">("agent");
  const [step, setStep] = useState<Step>("type");
  const [data, setData] = useState<CampaignData>({
    name: "Spring 2026",
    type: "roas",
    startDate: "2026-04-01",
    endDate: "2026-05-30",
    gender: "all",
    age: "18-34",
    region: "uae",
    brief: "",
    guidelineLink: "",
    assetName: null,
    budget: 10000,
    roas: 5,
  });

  const update = (patch: Partial<CampaignData>) => setData((d) => ({ ...d, ...patch }));
  const stepNum = STEP_NUM[step];
  const isBuilding    = step === "building";
  const isProcessing  = step === "processing";
  const isReview      = step === "review";
  const isPay         = step === "pay";

  // Welcome overlay — shown once when an eligible brand is dropped here from
  // the (skipped) new-brand dashboard. The flag is set right before redirect.
  // firstRun stays true after the overlay closes: on this visit there is no
  // app to go back to, so the header shows the MoonTech logo instead of an X.
  const [showWelcome, setShowWelcome] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [industry, setIndustry] = useState("Fashion");
  useEffect(() => {
    try {
      const i = localStorage.getItem("moontech_industry");
      if (i && i.trim()) setIndustry(i.trim());
      if (sessionStorage.getItem("moontech_welcome_campaign") === "1") {
        setShowWelcome(true);
        setFirstRun(true);
        sessionStorage.removeItem("moontech_welcome_campaign");
      }
    } catch {}
  }, []);

  const [profileComplete, setProfileComplete] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("moontech_profile");
      if (saved) {
        const p = JSON.parse(saved);
        setProfileComplete(
          p.vat?.trim().length > 0 &&
          p.city?.trim().length > 0 && p.city !== "Select city..." &&
          p.street?.trim().length > 0
        );
      }
    } catch {}
  }, [step]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // "Add business & billing" navigates to /profile, which remounts this page
  // on return — losing all in-memory flow state. Snapshot the flow before
  // leaving and jump straight back to the pay step when we come back.
  const [resumePay, setResumePay] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("moontech_resume_pay");
      if (raw) {
        sessionStorage.removeItem("moontech_resume_pay");
        const saved = JSON.parse(raw);
        if (saved.data) setData((d) => ({ ...d, ...saved.data }));
        if (saved.mode === "manual") {
          setMode("manual");
          setStep("pay");
        } else {
          setResumePay(true);
        }
      }
    } catch {}
  }, []);

  const goToBilling = (m: "agent" | "manual") => {
    try { sessionStorage.setItem("moontech_resume_pay", JSON.stringify({ mode: m, data })); } catch {}
    router.push("/profile");
  };

  const confidence = getConfidence(data.budget, data.roas);

  const handleNext = () => {
    if (step === "type")        setStep("basics");
    else if (step === "basics") setStep("budget");
    else if (step === "budget") setStep("building");
    else if (step === "review") setStep("pay");
  };

  const handleBack = () => {
    if (step === "basics")        setStep("type");
    else if (step === "budget")   setStep("basics");
    else if (step === "building") setStep("budget");
    else if (step === "review")   setStep("budget");
    else if (step === "pay")      setStep("review");
    else router.back();
  };

  const nextLabel =
    step === "type"   ? "Next: campaign basics" :
    step === "basics" ? "Next: budget & ROAS" :
    step === "budget" ? "Build my plan" :
    step === "review" ? "Fund Phase 1" : "";

  const isLowConfidence = step === "budget" && confidence.color === "red";

  // ── AI agent flow (default entry — first question offers manual) ──
  if (mode === "agent") {
    return (
      <>
        <AgentFlow
          data={data}
          onPatch={update}
          profileComplete={profileComplete}
          onAddBilling={() => goToBilling("agent")}
          onClose={() => router.back()}
          onSwitchManual={() => setMode("manual")}
          onDone={() => router.push("/dashboard")}
          firstRun={firstRun}
          jumpToPay={resumePay}
        />
        {showWelcome && <WelcomeOverlay industry={industry} onStart={() => setShowWelcome(false)} />}
      </>
    );
  }

  // ── Manual wizard ──
  return (
    <div className="min-h-screen bg-[#F7F7F8]" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Sticky header ── */}
      {!isBuilding && !isProcessing && (
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-sm border-b border-black/[0.06] px-5 py-4">
          <button onClick={() => setShowCloseConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] text-neutral-500 transition hover:bg-neutral-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h1 className="text-base font-semibold" style={{ color: INK }}>New campaign</h1>
          <div className="ml-auto text-right">
            <div className="flex items-center justify-end gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i < stepNum ? "w-6 bg-[#4D2FB0]" : "w-3 bg-neutral-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              Step <span className="font-semibold text-neutral-600">{stepNum}</span> of {TOTAL_STEPS} ·{" "}
              <span className="font-semibold text-neutral-600">{STEP_LABELS[step]}</span>
            </p>
          </div>
        </header>
      )}

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl px-5 py-6 pb-36 flex flex-col" style={{ minHeight: "calc(100vh - 65px)" }}>
        {step === "type"     && <StepType   data={data} onChange={update} />}
        {step === "basics"   && <StepBasics data={data} onChange={update} />}
        {step === "budget"   && <StepBudget data={data} onChange={update} />}
        {step === "building" && <BuildingScreen onDone={() => setStep("review")} />}
        {step === "review"   && <StepReview data={data} />}
        {step === "pay"      && <StepPay data={data} profileComplete={profileComplete} onAddBilling={() => goToBilling("manual")} onPay={() => setStep("processing")} />}
        {step === "processing" && <ProcessingScreen onDone={() => router.push("/dashboard")} />}
      </div>

      {/* ── Close confirmation modal ── */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCloseConfirm(false)}
          />
          {/* sheet */}
          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white px-6 pt-6 pb-8 shadow-2xl animate-fade-in">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 sm:hidden" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-semibold text-neutral-900">Discard campaign?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              You&apos;ll lose all the details you&apos;ve entered so far. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => router.back()}
                className="w-full rounded-2xl bg-red-500 py-3.5 text-sm font-semibold text-white hover:bg-red-600 active:scale-[0.98] transition"
              >
                Discard &amp; close
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="w-full rounded-2xl border border-black/[0.08] bg-neutral-50 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-[0.98] transition"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar ── */}
      {!isBuilding && !isPay && !isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/[0.06] bg-white px-5 py-4">
          <div className="mx-auto max-w-2xl">
            {isReview ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setStep("budget")}
                  className="shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-700"
                >
                  Edit budget or ROAS
                </button>
                <p className="flex-1" />
                <button onClick={handleNext}
                  className="shrink-0 rounded-xl bg-[#4D2FB0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3F2596] active:scale-[0.98] transition"
                >
                  Fund Phase 1 →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-700">
                  ← Back
                </button>
                <p className="hidden sm:block flex-1 text-xs leading-relaxed text-neutral-400">
                  {step === "type"   ? "Choose a name and campaign type to get started." :
                   step === "basics" ? "Fill in your target audience and creator brief." :
                   step === "budget" ? "Set your budget and ROAS target to build your plan." : ""}
                </p>
                <div className="flex-1 sm:flex-none" />
                <button onClick={handleNext}
                  disabled={step === "type" && !data.name.trim()}
                  className={`shrink-0 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
                    isLowConfidence
                      ? "bg-[#4D2FB0]/40 cursor-not-allowed"
                      : "bg-[#4D2FB0] hover:bg-[#3F2596]"
                  }`}
                >
                  <span className="hidden sm:inline">{nextLabel} →</span>
                  <span className="sm:hidden">Next →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
