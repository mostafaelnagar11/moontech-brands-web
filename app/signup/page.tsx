"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, CircleNotch, Translate, WarningCircle } from "@phosphor-icons/react";
import { DEMO_CODE } from "../data";

type Step = "signup" | "review" | "otp" | "eligibility";
type OtpState = "idle" | "sending" | "error" | "success";

interface SignupData {
  fullName: string;
  email: string;
  brandName: string;
  website: string;
  country: string;
  industry: string;
  phone: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("signup");
  const [signupData, setSignupData] = useState<SignupData>({
    fullName: "Sarah Al-Hamdan",
    email: "sarah@ounass.com",
    brandName: "Ounass",
    website: "ounass.com",
    country: "UAE",
    industry: "Fashion",
    phone: "+971 50 123 4567",
  });

  const update = (key: keyof SignupData, value: string) =>
    setSignupData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — showcase ── */}
      <ShowcasePanel />

      {/* ── Right panel — form ── */}
      <div className="relative flex w-full flex-col bg-white lg:w-[48%] lg:min-w-[440px] xl:min-w-[520px]">
        {/* Language toggle */}
        <div className="absolute right-6 top-5 z-10">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 shadow-sm transition hover:bg-neutral-50"
          >
            <Translate size={15} />
            <span>العربية</span>
          </button>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 sm:px-12">
          <div className="w-full max-w-[360px]">
            {/* Logo */}
            <div className="mb-7">
              <Image src="/logo.svg" alt="MoonTech" width={203} height={28} priority className="h-7 w-auto" />
            </div>

            {step === "signup" && (
              <SignupStep
                data={signupData}
                onChange={update}
                onSubmit={() => {
                  // Persist the industry so the campaign welcome overlay can
                  // personalize its motivation line.
                  try { localStorage.setItem("moontech_industry", signupData.industry); } catch {}
                  setStep("review");
                }}
              />
            )}
            {step === "review" && (
              <ReviewStep
                onBack={() => setStep("signup")}
                onSubmit={() => setStep("otp")}
              />
            )}
            {step === "otp" && (
              <OtpStep
                email={signupData.email}
                onBack={() => setStep("signup")}
                onVerified={() => setStep("eligibility")}
              />
            )}
            {step === "eligibility" && (
              <EligibilityStep
                website={signupData.website || "ounass.com"}
                onComplete={() => router.push("/dashboard/new")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left showcase panel (shared with sign-in)                          */
/* ------------------------------------------------------------------ */

/* The floating scene is authored at a fixed design size and then scaled to
   fit whatever width the panel has. Positions (%) and card sizes (px) shrink
   together, so the layout never collapses / overlaps on smaller screens. */
const DESIGN_W = 940;
const DESIGN_H = 900;

function ShowcasePanel() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const { clientWidth: w, clientHeight: h } = el;
      setScale(Math.min(w / DESIGN_W, h / DESIGN_H));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative hidden lg:block lg:flex-1 p-4 bg-white overflow-hidden">
      <div ref={frameRef} className="relative h-full w-full overflow-hidden rounded-2xl">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }} />

        {/* Scaled design canvas — positioned against a fixed DESIGN_W × DESIGN_H
            box, then uniformly scaled to fit the panel. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >

        {/* LIVE campaign — top left */}
        <div className="absolute left-[6%] top-[7%] animate-float-a">
          <div className="w-48 overflow-hidden rounded-2xl shadow-xl shadow-indigo-200/60">
            <div className="relative h-[274px] bg-cover bg-center" style={{ backgroundImage: "url('/image-1781751940205 1@3x.png')" }}>
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">
                <span className="animate-live h-1.5 w-1.5 rounded-full bg-white" />
                LIVE
              </div>
              <div className="absolute bottom-[calc(2.5rem+4px)] left-3 h-8 w-8 rounded-full border-2 border-white bg-white/30" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 p-3">
                <p className="text-[11px] font-semibold text-white">@luna.creates</p>
                <p className="text-[10px] text-white/70">847K watching</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics card — top right */}
        <div className="absolute right-[6%] top-[5%] animate-float-b">
          <div className="w-56 rounded-2xl border border-white/90 bg-white/95 p-5 shadow-xl shadow-indigo-100/80">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Campaign Reach</p>
            <p className="mt-1.5 text-[32px] font-black leading-none text-indigo-900">12.4M</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs font-bold text-green-500">↑ 23.5%</span>
              <span className="text-[10px] text-neutral-400">vs last month</span>
            </div>
            <div className="mt-4 flex h-10 items-end gap-1">
              {[35, 52, 38, 68, 55, 90, 72].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }}
                  className={`flex-1 rounded-sm transition-all ${i === 5 ? "bg-indigo-500" : "bg-indigo-100"}`} />
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-400">Last 7 days</p>
          </div>
        </div>

        {/* AI Match card — left center */}
        <div className="absolute left-[8%] top-[45%] animate-float-c">
          <div className="w-60 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-xl shadow-indigo-100/80">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                <span className="text-[8px] font-black text-white">AI</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Match Found</span>
              <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black text-green-600">94%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nike-logo.webp" alt="Nike" className="h-full w-full object-cover" />
              </div>
              <div className="relative flex-1">
                <div className="h-px bg-indigo-200" />
                <div className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white shadow-md">✓</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500 text-[9px] font-bold text-white shadow-sm">@run</div>
            </div>
            <p className="mt-2.5 text-[10px] text-neutral-500">@runner.daily · 1.2M followers</p>
            <div className="mt-2 flex gap-1.5">
              {["Fitness", "Outdoor", "Lifestyle"].map((t) => (
                <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-500">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: video card */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: "-30px" }}>
          <div className="animate-float-d drop-shadow-2xl">
            <div className="w-44 overflow-hidden rounded-3xl shadow-2xl shadow-indigo-300/50">
              <div className="relative h-[338px] bg-cover bg-center" style={{ backgroundImage: "url('/Ad Details.png')" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                    <div className="ml-1 h-0 w-0 border-b-[8px] border-t-[8px] border-l-[14px] border-b-transparent border-t-transparent border-l-white" />
                  </div>
                </div>
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">
                  <span className="animate-live h-1.5 w-1.5 rounded-full bg-white" />
                  LIVE AD
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-3">
                  <p className="text-xs font-bold text-white">2.1M ❤️ &nbsp;847K 👁</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagline — bottom left. Same message as the mobile splash. */}
        <div className="absolute bottom-16 left-8">
          <h2 className="text-[32px] xl:text-[48px] font-black leading-[1.05] tracking-tight text-indigo-950">
            Set it.<br />It runs.<br /><span className="wc-grad-text">It pays.</span>
          </h2>
          <p className="mt-3 max-w-[26ch] text-[16px] xl:text-[22px] font-medium leading-snug text-indigo-700/55">
            Set a budget and a target. Sourcing, briefing and scaling run themselves.
          </p>
        </div>

        {/* Photo content card — right middle */}
        <div className="absolute right-[5%] top-[38%] animate-float-e">
          <div className="w-44 overflow-hidden rounded-2xl shadow-xl shadow-indigo-200/60">
            <div className="relative h-36 bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500">
              <div className="absolute right-2 top-2 rounded-lg bg-black/30 px-2 py-1 backdrop-blur-sm">
                <span className="text-[9px] font-bold text-white">4.7% ER</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 p-2.5">
                <p className="text-[11px] font-semibold text-white">@sarah.style</p>
                <p className="text-[10px] text-white/70">892K followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign ROI card — bottom right */}
        <div className="absolute bottom-[calc(6%+100px)] right-[5%] animate-float-f">
          <div className="w-52 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-xl shadow-indigo-100/80">
            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500">Campaign ROI</p>
            <div className="mt-2 flex items-end gap-3">
              <div>
                <p className="text-[28px] font-black leading-none text-neutral-800">340%</p>
                <p className="text-[10px] text-neutral-400">return</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-base font-black text-green-500">$48K</p>
                <p className="text-[10px] text-neutral-400">revenue</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-pink-400 to-violet-500" />
            </div>
            <p className="mt-2 text-[9px] text-neutral-400">Sephora × @glam.by.nour</p>
          </div>
        </div>

        {/* Floating pill badges */}
        <div className="absolute left-[30%] top-[12%] animate-float-b rounded-full border border-green-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600">
            <span className="animate-live h-1.5 w-1.5 rounded-full bg-green-500" />
            23 Campaigns Live
          </span>
        </div>
        {/* Sits right of the three-line tagline, clear of the cards above. */}
        <div className="absolute bottom-[11%] left-[58%] animate-float-e rounded-full border border-indigo-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="text-[10px] font-semibold text-indigo-600">✦ AI Matching Active</span>
        </div>
        <div className="absolute right-[5%] top-[28%] animate-float-c rounded-full border border-violet-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="text-[10px] font-semibold text-violet-600">⚡ 1,240 Influencers</span>
        </div>

        {/* Floating emojis */}
        <div className="absolute left-[48%] top-[8%] animate-float-a">
          <img src="/emojis/Selfie.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        <div className="absolute left-[calc(20%+15px)] top-[22%] animate-float-c">
          <img src="/emojis/Hi.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        <div className="absolute right-[10%] top-[calc(55%+30px)] animate-float-d">
          <img src="/emojis/Cool.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        <div className="absolute left-[38%] top-[35%] animate-float-f">
          <img src="/emojis/Bolt_2.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        <div className="absolute right-[calc(22%+50px)] bottom-[calc(38%+150px)] animate-float-b">
          <img src="/emojis/Idea.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        <div className="absolute left-[calc(55%-100px)] bottom-[22%] animate-float-a">
          <img src="/emojis/SweatGrinning.png" alt="" className="h-[90px] w-[90px]" />
        </div>
        </div>{/* /scaled design canvas */}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sign up form                                                        */
/* ------------------------------------------------------------------ */

const COUNTRIES = ["UAE", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "Jordan", "Lebanon", "Other"];
const INDUSTRIES = ["Fashion", "Beauty", "Food & Beverage", "Technology", "Health & Wellness", "Home & Living", "Travel", "Sports", "Entertainment", "Other"];
const COUNTRY_FLAGS: Record<string, string> = {
  "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦", "Kuwait": "🇰🇼", "Qatar": "🇶🇦",
  "Bahrain": "🇧🇭", "Oman": "🇴🇲", "Egypt": "🇪🇬", "Jordan": "🇯🇴",
  "Lebanon": "🇱🇧", "Other": "🌍",
};
const INDUSTRY_ICONS: Record<string, string> = {
  "Fashion": "👗", "Beauty": "💄", "Food & Beverage": "🍽️", "Technology": "💻",
  "Health & Wellness": "🌿", "Home & Living": "🏠", "Travel": "✈️",
  "Sports": "⚽", "Entertainment": "🎬", "Other": "📦",
};

function SignupStep({
  data,
  onChange,
  onSubmit,
}: {
  data: SignupData;
  onChange: (key: keyof SignupData, value: string) => void;
  onSubmit: () => void;
}) {
  const router = useRouter();

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim());
  const validSite = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(
    data.website.trim().replace(/^https?:\/\//, "")
  );
  const canSubmit = data.fullName.trim().length > 1 && validEmail && data.brandName.trim().length > 1 && validSite;

  const fieldCls = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10";
  const labelCls = "block text-sm font-semibold text-neutral-600 mb-1.5";
  const hintCls = "mt-1.5 text-xs text-neutral-400";

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }}
      className="animate-fade-in"
    >
      {/* Personal details */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Full name</label>
          <input
            type="text"
            autoFocus
            value={data.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="Your full name"
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls}>Work email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="you@company.com"
            className={fieldCls}
          />
          <p className={hintCls}>We&apos;ll send your one-time code here every time you sign in.</p>
        </div>
      </div>

      {/* Brand info divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-100" />
        <span className="text-xs font-medium text-neutral-400">Brand info</span>
        <span className="h-px flex-1 bg-neutral-100" />
      </div>

      {/* Brand fields */}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Brand name</label>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => onChange("brandName", e.target.value)}
            placeholder="Your brand name"
            className={fieldCls}
          />
        </div>

        <div>
          <label className={labelCls}>E-commerce website</label>
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400 select-none">
              https://
            </span>
            <input
              type="text"
              value={data.website}
              onChange={(e) => onChange("website", e.target.value)}
              placeholder="yourbrand.com"
              className="flex-1 bg-white px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          <p className={hintCls}>We&apos;ll verify your site automatically after sign-up.</p>
        </div>

        <div>
          <label className={labelCls}>Country</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">
              {COUNTRY_FLAGS[data.country] ?? "🌍"}
            </span>
            <select
              value={data.country}
              onChange={(e) => onChange("country", e.target.value)}
              className={`${fieldCls} pl-9 pr-8 appearance-none`}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">⌄</span>
          </div>
        </div>

        <div>
          <label className={labelCls}>Industry</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">
              {INDUSTRY_ICONS[data.industry] ?? "📦"}
            </span>
            <select
              value={data.industry}
              onChange={(e) => onChange("industry", e.target.value)}
              className={`${fieldCls} pl-9 pr-8 appearance-none`}
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">⌄</span>
          </div>
        </div>

        <div>
          <label className={labelCls}>
            Phone number{" "}
            <span className="font-normal text-neutral-400">· optional</span>
          </label>
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <span className="flex items-center gap-1.5 border-r border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500 select-none">
              🇦🇪 +971
            </span>
            <input
              type="tel"
              value={data.phone.replace(/^\+971\s?/, "")}
              onChange={(e) => onChange("phone", "+971 " + e.target.value)}
              placeholder="50 123 4567"
              className="flex-1 bg-white px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          <p className={hintCls}>Optional — helps our team reach you faster if you&apos;d like a hand.</p>
        </div>
      </div>

      <PrimaryButton type="submit" disabled={!canSubmit} className="mt-6">
        Continue →
      </PrimaryButton>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-semibold text-indigo-500 hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Review & agree                                            */
/* ------------------------------------------------------------------ */

function ReviewStep({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="animate-fade-in">
      <h1 className="mb-5 text-[20px] font-bold tracking-tight text-[#1e1b4b]">
        Review &amp; agree
      </h1>

      {/* Key terms summary */}
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-bold text-neutral-700">Key terms summary</span>
        </div>
        <ul className="space-y-2.5 text-sm leading-relaxed text-neutral-600">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            MoonTech matches your brand with the right influencers and deploys campaigns that guarantee ROAS — no agencies, no manual work.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            Our micro influencer network delivers authentic brand messages to tight-knit communities that actually trust their creators.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            No preapproval of influencers or content — this eliminates bottlenecks for rapid, effective deployment.
          </li>
        </ul>
      </div>

      {/* Agreement checkbox */}
      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-indigo-200">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            agreed ? "border-indigo-600 bg-indigo-600" : "border-neutral-300 bg-white"
          }`}>
            {agreed && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-800">I agree to the Terms &amp; Conditions</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            By creating an account I accept MoonTech&apos;s{" "}
            <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">Terms of Service</span>,{" "}
            <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">Campaign Policy</span>,{" "}
            and{" "}
            <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </label>

      {/* Compliance notice */}
      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-indigo-50 px-4 py-3.5">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs leading-relaxed text-indigo-700">
          Compliant with UAE IAA &amp; Saudi CITC advertising standards. All influencer content is clearly labelled as a paid partnership.
        </p>
      </div>

      <PrimaryButton onClick={onSubmit} disabled={!agreed} className="mt-5">
        Create account →
      </PrimaryButton>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition"
      >
        ← Back
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* OTP verification                                                    */
/* ------------------------------------------------------------------ */

function OtpStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [state, setState] = useState<OtpState>("idle");
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const complete = digits.every((d) => d !== "");

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (!clean && v !== "") return;
    setState("idle");
    setDigits((prev) => { const n = [...prev]; n[i] = clean.slice(-1); return n; });
    if (clean && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    text.split("").forEach((c, i) => (next[i] = c));
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  }

  function verify() {
    if (!complete || state === "sending") return;
    setState("sending");
    setTimeout(() => {
      if (code === DEMO_CODE) { setState("success"); setTimeout(onVerified, 800); }
      else { setState("error"); setDigits(Array(6).fill("")); setTimeout(() => inputs.current[0]?.focus(), 50); }
    }, 1100);
  }

  function resend() {
    setSeconds(30); setState("success"); setDigits(Array(6).fill(""));
    setTimeout(() => inputs.current[0]?.focus(), 50);
    setTimeout(() => setState((s) => (s === "success" ? "idle" : s)), 2500);
  }

  const mmss = `00:${String(Math.max(seconds, 0)).padStart(2, "0")}`;

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />

      {state === "error" && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 animate-slide-down">
          <WarningCircle size={17} weight="fill" className="shrink-0" />
          Incorrect code — please try again.
        </div>
      )}
      {state === "success" && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-600 animate-slide-down">
          <CheckCircle size={17} weight="fill" className="shrink-0" />
          Code sent successfully!
        </div>
      )}

      <div className="mt-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-3 text-[22px] font-bold tracking-tight text-[#1e1b4b]">Check Your Inbox</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          We sent a 6-digit code to <span className="font-semibold text-neutral-700">{email}</span>
        </p>
      </div>

      <div className="mt-6 flex gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { inputs.current[i] = el; }}
            value={d} onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric" maxLength={1} autoFocus={i === 0}
            className={`otp-box${state === "error" ? " error" : d ? " filled" : ""}`}
          />
        ))}
      </div>

      <div className="mt-3 text-center text-xs text-neutral-400">
        {state === "sending" ? (
          <span className="flex items-center justify-center gap-1.5 text-indigo-500">
            <CircleNotch size={14} className="animate-spin" /> Verifying…
          </span>
        ) : seconds > 0 ? (
          <span>Code expires in <span className="font-semibold tabular-nums text-neutral-600">{mmss}</span></span>
        ) : (
          <span>Didn&apos;t receive it?{" "}
            <button onClick={resend} className="font-semibold text-indigo-500 hover:underline">Resend code</button>
          </span>
        )}
      </div>
      {state === "error" && (
        <div className="mt-2 text-center">
          <button onClick={resend} className="text-xs font-semibold text-indigo-500 hover:underline">Resend code</button>
        </div>
      )}

      <PrimaryButton onClick={verify} disabled={!complete || state === "sending" || state === "success"} className="mt-5">
        {state === "sending" ? <span className="flex items-center gap-2"><CircleNotch size={16} className="animate-spin" /> Verifying…</span>
          : state === "success" ? <span className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> Verified!</span>
          : "Verify Code"}
      </PrimaryButton>

      <p className="mt-4 text-center text-[11px] text-neutral-300">
        Demo code: <span className="font-mono font-bold tracking-widest text-neutral-400">{DEMO_CODE}</span>
      </p>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Eligibility check                                                   */
/* ------------------------------------------------------------------ */

function getEligibilityItems(eligible: boolean) {
  return [
    { label: "E-commerce website detected", key: "website" },
    { label: "Analyzing your website", key: "analyze" },
    { label: "Monthly unique visitors", value: eligible ? "280,000" : "3,200" },
    { label: "Minimum threshold (5,000+)", value: eligible ? "✓ Passed" : "✗ Not met" },
    { label: "Brand classification", value: eligible ? "New brand — eligible" : "New brand — not yet eligible" },
  ];
}

// Alternates true/false on every signup (persisted per browser) so the team
// can reliably see both the eligible and not-eligible flows.
function getNextEligibility(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const last = window.localStorage.getItem("moontech_last_eligibility");
    const next = last === null ? true : last !== "1";
    window.localStorage.setItem("moontech_last_eligibility", next ? "1" : "0");
    return next;
  } catch {
    return true;
  }
}

function EligibilityStep({
  website,
  onComplete,
}: {
  website: string;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [eligible, setEligible] = useState(true);
  const items = getEligibilityItems(eligible);

  // Computed in an effect (guarded against React Strict Mode's dev-only
  // double-invoke) so the localStorage toggle flips exactly once per mount.
  const computedEligibility = useRef(false);
  useEffect(() => {
    if (computedEligibility.current) return;
    computedEligibility.current = true;
    setEligible(getNextEligibility());
  }, []);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setRevealed(1), 700));
    t.push(setTimeout(() => { setRevealed(2); setAnalyzing(true); }, 1400));
    t.push(setTimeout(() => { setAnalyzing(false); setRevealed(3); }, 3000));
    t.push(setTimeout(() => setRevealed(4), 3900));
    t.push(setTimeout(() => setRevealed(5), 4700));
    t.push(setTimeout(() => onComplete(), 5900));
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function itemValue(idx: number): string {
    if (idx === 0) return website;
    if (idx === 1) return analyzing ? "Scanning..." : "Complete";
    return items[idx].value ?? "";
  }

  // The threshold and classification rows should read as a failure (red),
  // not a pass (green), when the brand isn't eligible.
  function isFailRow(idx: number): boolean {
    return !eligible && (idx === 3 || idx === 4);
  }

  return (
    <div className="animate-fade-in py-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl shadow-sm">
        🔍
      </div>

      <h1 className="mt-5 text-[20px] font-bold tracking-tight text-[#1e1b4b]">
        Checking your eligibility
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        We&apos;re verifying your website and traffic data to see if your brand qualifies for a ROAS-guaranteed campaign.
      </p>

      <div className="mt-6 w-full overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {items.map((item, i) => {
          const checked = i < revealed && !(i === 1 && analyzing);
          const active = i < revealed;
          const bad = checked && isFailRow(i);
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3.5 transition-opacity duration-500 ${
                i < items.length - 1 ? "border-b border-neutral-100" : ""
              } ${active ? "opacity-100" : "opacity-30"}`}
            >
              {i === 1 && analyzing ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <span className="text-[11px] font-black tracking-widest text-neutral-400">···</span>
                </div>
              ) : (
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${checked ? (bad ? "bg-red-100" : "bg-green-100") : "bg-neutral-100"}`}>
                  <svg className={`h-4 w-4 transition-colors duration-500 ${checked ? (bad ? "text-red-600" : "text-green-600") : "text-neutral-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    {bad ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium transition-colors duration-500 ${active ? "text-neutral-700" : "text-neutral-400"}`}>{item.label}</p>
                <p className={`text-xs font-semibold transition-colors duration-500 ${checked ? (bad ? "text-red-600" : "text-green-600") : "text-neutral-400"}`}>
                  {itemValue(i)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function PrimaryButton({
  children,
  disabled,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
        disabled
          ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
          : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
