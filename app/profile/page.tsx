"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const UAE_CITIES = ["Select city...", "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];
const COUNTRIES = ["UAE", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "Jordan", "Lebanon", "Other"];
const COUNTRY_FLAGS: Record<string, string> = {
  "UAE": "🇦🇪", "Saudi Arabia": "🇸🇦", "Kuwait": "🇰🇼", "Qatar": "🇶🇦",
  "Bahrain": "🇧🇭", "Oman": "🇴🇲", "Egypt": "🇪🇬", "Jordan": "🇯🇴",
  "Lebanon": "🇱🇧", "Other": "🌍",
};

export default function BusinessProfile() {
  const router = useRouter();

  const [vat, setVat] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeLicenseNum, setTradeLicenseNum] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [country, setCountry] = useState("UAE");
  const [city, setCity] = useState("Select city...");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");

  const sec1Done = vat.trim().length > 0 && legalName.trim().length > 0;
  const sec2Done = tradeLicenseNum.trim().length > 0 || uploadedFile !== null;
  const sec3Done = city !== "Select city..." && street.trim().length > 0;
  const sectionsDone = [sec1Done, sec2Done, sec3Done].filter(Boolean).length;

  const fieldCls = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10";
  const labelCls = "mb-1.5 block text-xs font-medium text-neutral-500 uppercase tracking-wide";
  const hintCls = "mt-1.5 text-xs text-neutral-400";

  return (
    <div className="min-h-screen bg-[#f8f8fc]">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-white px-5 py-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-[#1e1b4b]">Complete your business profile</h1>
          <p className="text-xs leading-relaxed text-neutral-500">
            We need these details to set up your campaign, issue VAT-compliant invoices, and verify your business.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6 pb-36">
        {/* ── Info box ── */}
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-violet-50 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="flex-1 text-sm leading-relaxed text-violet-800">
            Your <strong>VAT number and office location are required before payment</strong>. Trade license can be added any time, but completing it now speeds up campaign setup. Details are encrypted and only used for invoicing &amp; compliance.
          </p>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-violet-600">{sectionsDone}/3</p>
            <p className="text-[9px] font-medium uppercase tracking-widest text-violet-400">Sections done</p>
          </div>
        </div>

        {/* ── Section 1: Tax registration ── */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#1e1b4b]">1 · Tax registration</span>
              <span className="text-red-500">*</span>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              Required before payment
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>VAT / TRN number</label>
              <input
                type="text"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                placeholder="e.g. 100123456700003"
                maxLength={15}
                className={fieldCls}
              />
              <p className={hintCls}>UAE TRN is 15 digits, issued by the Federal Tax Authority.</p>
            </div>

            <div>
              <label className={labelCls}>
                Legal entity name{" "}
                <span className="font-normal text-neutral-400">· as registered</span>
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Ounass Trading LLC"
                className={fieldCls}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Trade license ── */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1e1b4b]">2 · Trade license</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              Optional now · needed before launch
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Trade license number</label>
              <input
                type="text"
                value={tradeLicenseNum}
                onChange={(e) => setTradeLicenseNum(e.target.value)}
                placeholder="e.g. CN-1234567"
                className={fieldCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                License document{" "}
                <span className="font-normal text-neutral-400">· PDF or image</span>
              </label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 transition hover:border-violet-300 hover:bg-violet-50/30">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={(e) => setUploadedFile(e.target.files?.[0]?.name ?? null)}
                />
                {uploadedFile ? (
                  <>
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-neutral-600">{uploadedFile}</p>
                  </>
                ) : (
                  <>
                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-neutral-500">
                      <span className="font-semibold text-violet-600">Click to upload</span> your trade license
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* ── Section 3: Office location ── */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#1e1b4b]">3 · Office location</span>
              <span className="text-red-500">*</span>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              Required before payment
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>
                Country{" "}
                <span className="font-normal text-neutral-400">· from sign-up</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                  {COUNTRY_FLAGS[country] ?? "🌍"}
                </span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${fieldCls} pl-9 pr-8 appearance-none`}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">⌄</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>City / Emirate</label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`${fieldCls} pr-8 appearance-none`}
                >
                  {UAE_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">⌄</span>
              </div>
            </div>

            <div>
              <label className={labelCls}>Street address</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Building, street, floor / office no."
                className={fieldCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Area / District{" "}
                <span className="font-normal text-neutral-400">· optional</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Business Bay"
                className={fieldCls}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-100 bg-white px-5 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <p className="flex-1 text-xs leading-relaxed text-neutral-400">
            VAT number, city and street address are the minimum we need before you pay for a campaign.
          </p>
          <button
            onClick={() => router.back()}
            className="shrink-0 text-sm font-medium text-neutral-500 transition hover:text-neutral-700"
          >
            Save for later
          </button>
          <button
            onClick={() => {
              localStorage.setItem("moontech_profile", JSON.stringify({ vat, legalName, city, street, country, area }));
              router.back();
            }}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 active:scale-[0.98]"
          >
            Save details
          </button>
        </div>
      </div>
    </div>
  );
}
