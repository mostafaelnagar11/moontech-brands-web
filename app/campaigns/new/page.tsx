"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  pay:        "Pay Phase 1",
  processing: "Processing",
};
const STEP_NUM: Record<Step, number> = { type: 1, basics: 2, budget: 3, building: 3, review: 4, pay: 5, processing: 5 };

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */
const fieldCls = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition";
const labelCls = "mb-1.5 block text-sm font-medium text-neutral-600";

function PillToggle<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            value === o.value
              ? "border-violet-600 bg-violet-50 text-violet-700"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
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
    desc: "Achievable — requires strong influencer performance.",
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
      <div>
        <label className={labelCls}>Campaign name</label>
        <input value={data.name} onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Spring 2026" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Campaign type</label>
        <div className="space-y-3">
          {[
            { value: "roas" as const, title: "E-commerce — ROAS Guaranteed", desc: "Guaranteed return on ad spend with phased delivery" },
            { value: "awareness" as const, title: "Awareness Campaign", desc: "Grow brand reach and visibility" },
          ].map((opt) => {
            const selected = data.type === opt.value;
            return (
              <button key={opt.value} onClick={() => onChange({ type: opt.value })}
                className={`w-full flex items-start justify-between rounded-2xl border-2 p-4 text-left transition ${
                  selected ? "border-violet-600 bg-violet-50/60" : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${selected ? "text-neutral-900" : "text-neutral-700"}`}>{opt.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{opt.desc}</p>
                </div>
                <div className={`mt-0.5 ml-3 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
                  selected ? "border-violet-600 bg-violet-600" : "border-neutral-300 bg-white"
                }`}>
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-8 space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
          <span className="mt-0.5 shrink-0 text-violet-500 text-sm">✦</span>
          <p className="text-sm leading-relaxed text-violet-800">
            As a new brand, you&apos;ll start with our{" "}
            <strong className="text-violet-700">warm-up program</strong> — three phased campaigns that
            help our engine learn your audience before scaling.
          </p>
        </div>
        <div className="rounded-2xl bg-[#eeeeff] p-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-violet-800">Why brands trust MoonTech</p>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🎯</span>
            <p className="text-sm leading-relaxed text-neutral-800">
              We work with vetted <strong>micro-influencers &amp; community leaders</strong> — not pricey mega names — so spend goes further.
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
      <div>
        <label className={labelCls}>Start date</label>
        <input value={data.startDate} onChange={(e) => onChange({ startDate: e.target.value })} placeholder="Apr 1, 2026" className={fieldCls} />
      </div>
      <div>
        <label className={labelCls}>End date</label>
        <input value={data.endDate} onChange={(e) => onChange({ endDate: e.target.value })} placeholder="May 30, 2026" className={fieldCls} />
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
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs font-semibold text-neutral-400">Campaign brief</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <div>
        <label className={labelCls}>
          What should influencers know?{" "}
          <span className="font-normal text-neutral-400">· do&apos;s &amp; don&apos;ts</span>
        </label>
        <textarea value={data.brief} onChange={(e) => onChange({ brief: e.target.value })} rows={4}
          placeholder="e.g. Show the product in daily use, keep tone warm and casual. Don't mention competitors or discount codes other than ours."
          className={`${fieldCls} resize-none`} />
        <p className="mt-1.5 text-xs text-neutral-400">This becomes your creator brief. The more detail, the better the match.</p>
      </div>

      <div>
        <label className={labelCls}>Brand guideline link <span className="font-normal text-neutral-400">· optional</span></label>
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/10 transition">
          <span className="text-neutral-400 shrink-0">🔗</span>
          <input value={data.guidelineLink} onChange={(e) => onChange({ guidelineLink: e.target.value })}
            placeholder="Paste a link to your brand guidelines"
            className="flex-1 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none bg-transparent" />
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">No file handy at 2am? Just drop a link — our team will pull what we need.</p>
      </div>

      <div>
        <label className={labelCls}>Attach assets <span className="font-normal text-neutral-400">· optional</span></label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-4 py-8 transition hover:border-violet-300 hover:bg-violet-50/20">
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
              <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
function StepBudget({ data, onChange }: { data: CampaignData; onChange: (d: Partial<CampaignData>) => void }) {
  const confidence = getConfidence(data.budget, data.roas);
  const projectedSales = data.budget * data.roas;

  return (
    <div className="space-y-8">
      {/* Budget slider */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[15px] font-normal text-neutral-700">Total campaign budget</p>
          <p className="text-[32px] font-bold text-violet-600 leading-none">
            ${data.budget.toLocaleString()}
          </p>
        </div>
        <input
          type="range" min={1000} max={80000} step={1000}
          value={data.budget}
          onChange={(e) => onChange({ budget: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "#7c3aed" }}
        />
        <div className="flex justify-between mt-2 text-xs text-neutral-400 font-medium">
          <span>$1,000</span><span>$80,000</span>
        </div>
      </div>

      {/* ROAS slider */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <p className="text-[15px] font-normal text-neutral-700 mt-1">Target ROAS</p>
          <div className="text-right">
            <p className="text-[32px] font-bold text-violet-600 leading-none">{data.roas}×</p>
            <p className="text-sm text-neutral-400 mt-1">= ${projectedSales.toLocaleString()} in sales</p>
          </div>
        </div>
        <input
          type="range" min={1} max={12} step={1}
          value={data.roas}
          onChange={(e) => onChange({ roas: Number(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "#7c3aed" }}
        />
        <div className="flex justify-between mt-2 text-xs text-neutral-400 font-medium">
          <span>1×</span><span>12×</span>
        </div>
      </div>

      {/* Confidence score */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400 mb-3">Confidence Score</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${confidence.bar}`}
            style={{ width: `${confidence.pct}%` }}
          />
        </div>
        <p className={`text-[15px] font-semibold ${confidence.text}`}>{confidence.level}</p>
        <p className="mt-1 text-sm text-neutral-400">{confidence.desc}</p>
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
      title: "Every influencer gets a unique tracker",
      desc: "Revenue is attributed via unique tracking links assigned to each creator — so you know exactly which influencer drove which sale.",
    },
    {
      icon: "🔗",
      bg: "bg-amber-50",
      title: "E-commerce integration required before launch",
      desc: "Our technical team sets this up with you after payment. The campaign cannot go live until the integration is confirmed.",
    },
    {
      icon: "📊",
      bg: "bg-green-50",
      title: "Guarantee applies to warm-up phases only",
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
      <div className="rounded-2xl bg-violet-600 p-5 text-white">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-violet-200">Your plan</p>
        <h2 className="text-[22px] font-bold leading-snug mb-3">Your 4-phase campaign plan</h2>
        <p className="text-sm leading-relaxed text-violet-100">
          Targeting <strong className="text-white">{data.roas}× ROAS</strong> on a{" "}
          <strong className="text-white">{fmt(data.budget)}</strong> budget. Your first three phases
          are fully guaranteed — if a phase misses its target, we make it right. The estimated phase
          beyond that is a data-driven projection that sharpens as your campaign runs.
        </p>
      </div>

      {/* Committed phases */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">Committed</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <div className="space-y-3">
        {committed.map((p, i) => (
          <div key={p.num} className="flex items-stretch gap-3">
            {/* Number + connector */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white shadow-md shadow-violet-200">
                {p.num}
              </div>
              {i < committed.length - 1 && <div className="flex-1 w-px bg-violet-200 my-1" />}
            </div>
            {/* Card */}
            <div className="flex-1 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm" style={{ borderLeft: "3px solid #7c3aed" }}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-neutral-800">{p.label}</p>
                <span className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-600">
                  Committed
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Budget: <strong className="text-neutral-600">{fmt(p.budget)}</strong> · ROAS:{" "}
                  <strong className="text-neutral-600">{p.roas}×</strong>
                </p>
                <p className="text-xs text-neutral-400">≈{fmt(p.revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated phases */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[10px] font-medium uppercase tracking-widest font-medium text-neutral-400">Estimated phases</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-amber-400 text-amber-500 text-sm font-semibold">
          ~
        </div>
        <div className="flex-1 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm" style={{ borderLeft: "3px solid #f59e0b" }}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-neutral-800">Phase 4 · Growth</p>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-500">
              Estimated
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Budget: <strong className="text-neutral-600">{fmt(p4b)}</strong> · ROAS:{" "}
              <strong className="text-neutral-600">{p4roas}×</strong>
            </p>
            <p className="text-xs text-neutral-400">≈{fmt(p4r)}</p>
          </div>
        </div>
      </div>

      {/* Total projected revenue */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-green-700">Total projected revenue</p>
            <p className="mt-0.5 text-xs text-green-600">Across all 4 phases · {fmt(data.budget)} spend</p>
          </div>
          <div className="text-right">
            <p className="text-[26px] font-bold text-green-600 leading-none">{fmt(totalTarget)}</p>
            <p className="mt-1 text-xs font-semibold text-green-500">✓ matches your {data.roas}× goal</p>
          </div>
        </div>
      </div>

      {/* Before you launch accordion */}
      <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setKnowOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="flex-1 text-sm font-semibold text-neutral-800">Before you launch — 4 things to know</p>
          <svg className={`h-4 w-4 text-neutral-400 transition-transform ${knowOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {knowOpen && (
          <div className="border-t border-neutral-100 divide-y divide-neutral-50">
            {KNOW_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${item.bg}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Tracker best practices */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg">
                  💡
                </div>
                <p className="text-sm font-semibold text-neutral-800">Tracker best practices</p>
              </div>
              <div className="space-y-2">
                {TRACKER_BEST.map((b) => (
                  <div key={b.title} className="rounded-xl bg-neutral-50 p-3 text-center">
                    <p className="text-xl mb-1">{b.icon}</p>
                    <p className="text-sm font-semibold text-neutral-800">{b.title}</p>
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
/* Step 5 — Pay Phase 1                                               */
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
    { label: "ROAS target",     value: "1× (warm-up)" },
    { label: "Expected output", value: fmt(p1Budget) },
    { label: "VAT (5%)",        value: `$${vat.toFixed(2)}` },
  ];

  return (
    <div className="space-y-5">
      {/* Due today card */}
      <div className="rounded-2xl bg-violet-50 border border-violet-100 p-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-violet-600 mb-2">
          Due today — Phase 1 only
        </p>
        <p className="text-[40px] font-bold text-violet-600 leading-none">{fmt(p1Budget)}</p>
        <p className="mt-2 text-sm text-neutral-500">Phases 2 &amp; 3 paid separately as you progress.</p>
      </div>

      {/* Phase unlock notice */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">⚡</span>
        <p className="text-sm leading-relaxed text-amber-800">
          You&apos;re starting with <strong>Phase 1</strong>. The next phase only unlocks once the
          running phase reaches <strong>80% of its revenue target</strong> — your campaign progresses
          one phase at a time.
        </p>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between px-5 py-3.5 ${i < rows.length - 1 ? "border-b border-neutral-50" : ""}`}>
            <p className="text-sm text-neutral-400">{r.label}</p>
            <p className="text-sm font-semibold text-neutral-800">{r.value}</p>
          </div>
        ))}
        <div className="border-t-2 border-violet-100 flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold text-neutral-800">Total due now</p>
          <p className="text-[18px] font-semibold text-violet-600">{fmt(total)}</p>
        </div>
      </div>

      {/* Secured by Mamo Pay */}
      <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-violet-700">Secured by Mamo Pay</p>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
            Clicking &quot;Confirm&quot; will redirect you to Mamo Pay&apos;s secure checkout. Your card
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
        <p className="text-sm font-semibold text-neutral-800 mb-3">Before you pay, please confirm</p>
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
                  <span className="font-semibold text-violet-600">Campaign Policy</span> for this
                  campaign and agree to the campaign terms.
                </>
              ),
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.set((v) => !v)}
              className={`w-full flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                item.checked ? "border-violet-300 bg-violet-50/50" : "border-neutral-200 bg-white"
              }`}
            >
              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                item.checked ? "border-violet-600 bg-violet-600" : "border-neutral-300 bg-white"
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

      {/* Confirm & Pay button (inside content for now — real bottom bar handles it) */}
      <div className="pb-2">
        <button
          onClick={canPay ? onPay : undefined}
          disabled={!canPay}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold text-white transition active:scale-[0.98] ${
            canPay
              ? "bg-violet-600 shadow-lg shadow-violet-200 hover:bg-violet-700"
              : "bg-violet-300 cursor-not-allowed"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Confirm &amp; Pay {fmt(total)}
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
      <h2 className="text-[26px] font-bold text-neutral-800 mb-3">Building your plan…</h2>
      <p className="text-[15px] text-neutral-400 leading-relaxed max-w-xs">
        Analysing budget, ROAS target, and traffic data to design your phase structure.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        {[100, 80, 88].map((w, i) => (
          <div key={i} className="h-3 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-200 animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-violet-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
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
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#f8f8fc] text-center px-6">
      <div className="text-[72px] mb-8 drop-shadow-md" style={{ animation: "float-a 3s ease-in-out infinite" }}>
        💳
      </div>
      <h2 className="text-[26px] font-bold text-neutral-800 mb-2">Processing payment…</h2>
      <p className="text-sm text-neutral-400">Please don&apos;t close the app.</p>
      <div className="mt-8 flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function NewCampaign() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [data, setData] = useState<CampaignData>({
    name: "Spring 2026",
    type: "roas",
    startDate: "Apr 1, 2026",
    endDate: "May 30, 2026",
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
    step === "type"   ? "Next: Campaign basics" :
    step === "basics" ? "Next: Budget & ROAS" :
    step === "budget" ? "Build my plan" :
    step === "review" ? "Accept & pay Phase 1" : "";

  const isLowConfidence = step === "budget" && confidence.color === "red";

  return (
    <div className="min-h-screen bg-[#f8f8fc]" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Sticky header ── */}
      {!isBuilding && !isProcessing && (
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-white px-5 py-4 shadow-sm">
          <button onClick={() => setShowCloseConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-neutral-800">New campaign</h1>
          <div className="ml-auto text-right">
            <div className="h-1.5 w-36 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${(stepNum / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Step <span className="font-semibold text-neutral-500">{stepNum}</span> of {TOTAL_STEPS} ·{" "}
              <span className="font-semibold text-neutral-500">{STEP_LABELS[step]}</span>
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
        {step === "pay"      && <StepPay data={data} profileComplete={profileComplete} onAddBilling={() => router.push("/profile")} onPay={() => setStep("processing")} />}
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
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-[0.98] transition"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar ── */}
      {!isBuilding && !isPay && !isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-100 bg-white px-5 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
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
                  className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-[0.98] transition"
                >
                  Accept &amp; pay Phase 1 →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-700">
                  ← Back
                </button>
                <p className="hidden sm:block flex-1 text-xs leading-relaxed text-neutral-400">
                  {step === "type"   ? "Choose a name and campaign type to get started." :
                   step === "basics" ? "Fill in your target audience and campaign brief." :
                   step === "budget" ? "Set your budget and ROAS target to build your plan." : ""}
                </p>
                <div className="flex-1 sm:flex-none" />
                <button onClick={handleNext}
                  disabled={step === "type" && !data.name.trim()}
                  className={`shrink-0 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] ${
                    isLowConfidence
                      ? "bg-violet-400 shadow-violet-100 cursor-not-allowed"
                      : "bg-violet-600 shadow-violet-200 hover:bg-violet-700"
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
