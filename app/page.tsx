"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  CaretRight,
  Check,
  CheckCircle,
  CircleNotch,
  Lightning,
  LockSimple,
  Storefront,
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
      {/* Background */}
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(-20deg, #e9defa 0%, #fbfcdb 100%)" }} />

      {/* Scaled design canvas — everything below is positioned against a fixed
          DESIGN_W × DESIGN_H box, then uniformly scaled to fit the panel. */}
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
              Live
            </div>
            <div className="absolute bottom-[calc(2.5rem+4px)] left-3 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=faces"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Campaign reach</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Match found</span>
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
                Live ad
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
          Set a budget and a target. Matching, briefing and scaling run themselves.
        </p>
      </div>

      {/* Photo content card — right middle. A creator's own bag ad. */}
      <div className="absolute right-[5%] top-[38%] animate-float-e">
        <div className="w-44 overflow-hidden rounded-2xl shadow-xl shadow-indigo-200/60">
          <div className="relative h-36">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=440&h=360&fit=crop"
              alt="Creator styling the leather tote"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute right-2 top-2 rounded-lg bg-black/40 px-2 py-1 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white">4.7% ER</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/40 p-2.5">
              <p className="text-[11px] font-semibold text-white">@sarah.style</p>
              <p className="text-[10px] text-white/70">892K followers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue card — bottom right. Ported from the mobile splash: one
          phase, one number, and the 80% line it has already crossed. */}
      <div className="absolute bottom-[7%] right-[5%] animate-float-f">
        <div className="relative w-60">
          <div className="rounded-[22px] bg-white px-4 pb-3 pt-4 shadow-[0_24px_56px_-22px_rgba(25,18,52,0.32)] ring-1 ring-black/[0.04]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#047857]">
              <span className="animate-live h-1.5 w-1.5 shrink-0 rounded-full bg-[#059669]" />
              Revenue
            </p>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="text-[26px] font-black leading-none tabular-nums text-[#191234]">
                $840
                <span className="ml-1 text-[11px] font-medium text-neutral-500">of $1,000 target</span>
              </p>
              <p className="text-[13px] font-semibold tabular-nums text-[#4D2FB0]">84%</p>
            </div>

            {/* THE SIGNATURE — the 80% unlock line, already crossed */}
            <div className="relative mt-3 h-2 rounded-full bg-[#EFEBFA]">
              <div className="bar-fill keyline-grad h-full rounded-full" style={{ width: "84%" }} />
              <span aria-hidden="true" className="unlock-notch unlock-notch--crossed" />
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium text-[#4D2FB0]">
              <Lightning size={12} weight="fill" className="mt-0.5 shrink-0" />
              Phase 2 unlocked — Phase 1 hit 84%
            </p>

            {/* The 10 / 30 / 60 split as pure geometry: the machine bets
                small, proves it, then bets big. */}
            <div className="mt-3 space-y-2 border-t border-black/[0.05] pt-3">
              {([
                { name: "Warm-up", state: "Done", w: 10 },
                { name: "Scale", state: "Active", w: 30 },
                { name: "Peak", state: "Pending", w: 60 },
              ] as const).map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-4 shrink-0">
                    {p.state === "Pending" ? (
                      <LockSimple size={12} weight="fill" className="text-neutral-300" />
                    ) : p.state === "Done" ? (
                      <Check size={12} weight="bold" className="text-[#4D2FB0]" />
                    ) : (
                      <Lightning size={12} weight="fill" className="text-amber-500" />
                    )}
                  </span>
                  <span className={`w-[68px] shrink-0 whitespace-nowrap text-[10px] font-semibold ${
                    p.state === "Pending" ? "text-neutral-400" : "text-[#191234]"
                  }`}>
                    P{i + 1} {p.name}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`block h-1 min-w-2 rounded-full ${
                        p.state === "Done" ? "keyline-grad" : p.state === "Active" ? "bg-amber-400" : "bg-[#E5E4EC]"
                      }`}
                      style={{ width: `${p.w}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* The next phase, released by itself — the only saturated object */}
          <div className="absolute -right-3 -top-4 animate-float-b">
            <div className="rounded-2xl bg-[#4D2FB0] px-3 py-2 shadow-[0_16px_34px_-12px_rgba(77,47,176,0.6)] ring-1 ring-white/20">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-white">
                <Lightning size={11} weight="fill" className="shrink-0" />
                Phase 2 unlocked
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-white/75">Funded itself · just now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating pill badges */}
      <div className="absolute left-[30%] top-[12%] animate-float-b rounded-full border border-green-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600">
          <span className="animate-live h-1.5 w-1.5 rounded-full bg-green-500" />
          Campaigns live · 23
        </span>
      </div>
      {/* Threads between the tagline and the revenue card. */}
      <div className="absolute bottom-[5%] left-[52%] animate-float-e rounded-full border border-indigo-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="text-[10px] font-semibold text-indigo-600">✦ Matching live</span>
      </div>
      <div className="absolute right-[5%] top-[28%] animate-float-c rounded-full border border-violet-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="text-[10px] font-semibold text-violet-600">⚡ Creators · 1,240</span>
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
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Work email</label>
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
          : state === "success" ? <span className="flex items-center gap-2"><CheckCircle size={16} weight="fill" /> Verified</span>
          : "Verify code"}
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
          <Storefront size={26} weight="bold" className="text-white" />
        </div>
        <h1 className="mt-3.5 text-[20px] font-bold tracking-tight text-[#1e1b4b]">Choose your brand</h1>
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
      {/* Same mark the sidebar's brand switcher shows: the logo on white, or
          the brand's initial on its own colour when there is no logo. */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm ring-1 ring-black/[0.04]"
        style={{ backgroundColor: brand.logo ? "#fff" : brand.color }}
      >
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold">{brand.initials}</span>
        )}
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
    <button type="button" onClick={onClick} aria-label="Back"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50">
      <ArrowLeft size={17} weight="bold" />
    </button>
  );
}
