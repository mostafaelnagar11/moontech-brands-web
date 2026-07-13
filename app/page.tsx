"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowSquareOut,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Translate,
  WarningCircle,
} from "@phosphor-icons/react";
import { BRANDS, DEMO_CODE, type Brand } from "./data";

type Step = "email" | "otp" | "brand";
type OtpState = "idle" | "sending" | "error" | "success";

export default function MoonTechPrototype() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

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

            {step === "email" && (
              <EmailStep email={email} setEmail={setEmail} onNext={() => setStep("otp")} />
            )}
            {step === "otp" && (
              <OtpStep
                email={email || "support@testbrand.com"}
                onBack={() => setStep("email")}
                onVerified={() => setStep("brand")}
              />
            )}
            {step === "brand" && (
              <BrandStep onBack={() => setStep("otp")} onContinue={() => router.push("/dashboard")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left showcase panel                                                 */
/* ------------------------------------------------------------------ */

function ShowcasePanel() {
  return (
    <div className="relative hidden lg:block lg:flex-1 p-4 bg-white overflow-hidden">
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }} />

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
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-30px' }}>
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

      {/* Tagline — bottom left */}
      <div className="absolute bottom-16 left-8">
        <h2 className="text-[32px] xl:text-[48px] font-black leading-tight tracking-tight text-indigo-950">
          Create. Match. Convert.
        </h2>
        <p className="mt-3 text-[16px] xl:text-[22px] font-medium text-indigo-700/55">
          AI-powered influencer marketing, from discovery to campaign ROI.
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
      <div className="absolute bottom-[28%] left-[calc(5%+50px)] animate-float-e rounded-full border border-indigo-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
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
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Email                                                      */
/* ------------------------------------------------------------------ */

function EmailStep({ email, setEmail, onNext }: { email: string; setEmail: (v: string) => void; onNext: () => void }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const router = useRouter();

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) onNext(); }} className="animate-fade-in">
      <h1 className="text-[22px] font-bold tracking-tight text-[#1e1b4b]">Let&apos;s Get Started!</h1>
      <p className="mt-1 text-sm text-neutral-500">Enter your work email to sign in</p>

      <div className="mt-6 space-y-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Work Email</label>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
        />
      </div>

      <PrimaryButton type="submit" disabled={!valid} className="mt-4">Continue</PrimaryButton>

      <p className="mt-5 text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="font-semibold text-indigo-500 hover:underline"
        >
          Sign up
        </button>
      </p>

      <p className="mt-3 text-center text-xs text-neutral-400">
        By continuing you agree to our{" "}
        <span className="cursor-pointer text-indigo-500 hover:underline">Terms</span>{" "}
        &amp; <span className="cursor-pointer text-indigo-500 hover:underline">Privacy Policy</span>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — OTP                                                        */
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

/* ------------------------------------------------------------------ */
/* Step 3 — Brand selection                                            */
/* ------------------------------------------------------------------ */

function BrandStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="animate-fade-in">
      <BackButton onClick={onBack} />
      <div className="mt-5 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
          <ArrowSquareOut size={26} weight="bold" className="text-white" />
        </div>
        <h1 className="mt-3.5 text-[20px] font-bold tracking-tight text-[#1e1b4b]">Test Brand</h1>
        <p className="mt-1 text-sm text-neutral-500">Select an account to continue</p>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {BRANDS.map((b) => (
          <BrandRow key={b.id} brand={b} selected={selected === b.id} onSelect={() => setSelected(b.id)} />
        ))}
      </div>
      <PrimaryButton onClick={onContinue} disabled={!selected} className="mt-6">Continue</PrimaryButton>
    </div>
  );
}

function BrandRow({ brand, selected, onSelect }: { brand: Brand; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={`flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all ${
        selected ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/20"
          : "border-neutral-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: brand.color }}>
        {brand.external ? <ArrowSquareOut size={17} weight="bold" /> : <span className="text-xs font-bold">{brand.initials}</span>}
      </span>
      <span className="flex-1 text-sm font-semibold text-neutral-800">{brand.name}</span>
      <CaretRight size={16} weight="bold" className={selected ? "text-indigo-400" : "text-neutral-300"} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

function PrimaryButton({ children, disabled, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} disabled={disabled}
      className={`flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
        disabled ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
          : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50">
      <ArrowLeft size={17} weight="bold" />
    </button>
  );
}
