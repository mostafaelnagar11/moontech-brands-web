"use client";

import { useEffect, useRef, useState } from "react";

const INK = "#191234";

/* ------------------------------------------------------------------ */
/* Conversation script                                                 */
/* ------------------------------------------------------------------ */
type Topic = { id: "why" | "how" | "recheck" | "wrong" | "human"; chip: string; reply: string };

const CONTENT: {
  greeting: string;
  topics: Topic[];
  keywordRules: { pattern: string; topicId: Topic["id"] }[];
  fallback: string;
  recheckConfirmed: string;
} = {
  greeting:
    "Hi — here's where things stand: ounass.com is verified, and we're measuring 3.2K monthly unique visitors against the 5K needed for guaranteed-ROAS campaigns — so you're 1.8K short.\n\nThe good news: traffic is the only thing blocking you, and we re-check automatically as it grows.\n\nWhat would you like to know?",
  topics: [
    {
      id: "why",
      chip: "Why am I not eligible?",
      reply:
        "Your website ounass.com is verified — that box is ticked. The gap is traffic: we're measuring 3.2K monthly unique visitors, and guaranteed-ROAS campaigns need 5K. You're 1.8K short.\n\nThe honest reason for the minimum: campaign revenue is attributed through a unique tracking link per creator. Below roughly 5K monthly visitors, that attribution gets too noisy to guarantee a ROAS — and because we cover the difference when a guaranteed warm-up phase misses its target, a guarantee on thin traffic would be a coin flip.\n\nThe minimum is fixed — we can't waive it — but nothing else is blocking you, and it unlocks automatically the moment you cross 5K.",
    },
    {
      id: "how",
      chip: "How do I become eligible?",
      reply:
        "You don't need to reapply. We re-check automatically — once ounass.com crosses 5,000 monthly unique visitors, guaranteed campaigns unlock on their own.\n\nTo close the 1.8K gap, the levers that tend to work fastest for GCC fashion e-commerce:\n\n— Paid social on Instagram, TikTok and Snapchat, where most Gulf fashion discovery happens\n— Google Shopping and search ads on your best-selling categories\n— Arabic-language product and category pages — often an underused SEO win in the Gulf market\n— Email and WhatsApp re-engagement of past buyers\n\nAny of these counts toward the unlock — we'll spot it as soon as your traffic crosses the line.",
    },
    {
      id: "recheck",
      chip: "Request a re-check",
      reply:
        "I can log a manual re-check for you. A member of our team will pull ounass.com's traffic data, verify it by hand, and email you the outcome within 2 business days.\n\nIf the review confirms 5,000+ monthly unique visitors, guaranteed campaigns unlock right away — nothing else for you to do. If the numbers still come in below the minimum, we'll share the figure we measured so you can compare it with your own analytics.\n\nWant me to log the request?",
    },
    {
      id: "wrong",
      chip: "My numbers look wrong",
      reply:
        "Fair question — mismatches do happen, and there are three usual suspects:\n\nSessions vs. unique visitors. Most analytics dashboards show sessions by default, which run noticeably higher. We count unique visitors only.\n\nTiming. A recent spike — a sale, a viral moment — may not be reflected in the current measurement yet.\n\nSubdomain mismatch. If traffic lands on www.ounass.com but a different variant was verified, some visits can be missed.\n\nIf your analytics show 5,000+ monthly uniques, request a manual re-check — a human verifies within 2 business days.",
    },
    {
      id: "human",
      chip: "Talk to a human",
      reply:
        "Of course — sometimes you just want a person. Email support@moontech.com and the team will reply within 2 business days.\n\nTo get the fastest answer, include your brand name, your website (ounass.com), and what you'd like looked at — the eligibility decision, the traffic measurement, or anything else.\n\nOne shortcut: if it's specifically the visitor count you want checked, the manual re-check option here goes to the same team and already includes your data — it saves you writing everything up.",
    },
  ],
  keywordRules: [
    { pattern: "re-?check|re-?review|re-?verify|re-?run|check (it|that|again|my|the|your)\\b|manual(ly)? (check|review)|look again|second look", topicId: "recheck" },
    { pattern: "wrong|incorrect|inaccurate|mistaken?|error|not (right|accurate|correct|true)|outdated|stale|(numbers?|figures?|stats?|count|data).{0,24}\\boff\\b|already (have|get|over|above|past|at)|more than (5|five)|higher than|analytics|\\bga4?\\b|shopify|dashboard|(get|have|getting|seeing|doing)\\s(about |around |over |nearly |roughly )?\\d|\\b([6-9]|[1-9]\\d)\\s?k\\b|\\d{1,3},\\d{3}", topicId: "wrong" },
    { pattern: "exception|waiv(e|er)|bypass|just this once|lower the (bar|minimum|threshold)|make an? exception", topicId: "why" },
    { pattern: "human|real person|someone|support|agent|representative|contact|email|reach (you|out)|talk to|speak (to|with)|complain|escalat|ridiculous|unfair|scam|joke|bullshit|\\bbs\\b|waste of|angry|frustrat|annoy|شخص|دعم|تواصل|بشري|موظف", topicId: "human" },
    { pattern: "how (do|can|to|long)|become eligible|qualif|unlock|grow|increas|improv|boost|more (traffic|visitors)|\\bseo\\b|\\bads?\\b|advertis|marketing|when (will|do|can|am)|timeline|automat|كيف|أتأهل|زيادة", topicId: "how" },
    { pattern: "why|eligib|minimum|requir|threshold|criteri|5,?000|5 ?k\\b|visitors?|traffic|guarantee|ليش|لماذا|مؤهل|أهلية|شروط|زيارات", topicId: "why" },
  ],
  fallback:
    "I'm not sure I caught that one. I can explain why you're not eligible yet, how to get there, what to do if your numbers look off, or log a manual re-check — the options below cover all of it. And if you'd rather talk to a person, email support@moontech.com; the team replies within 2 business days.",
  recheckConfirmed:
    "Your manual re-check request is logged. A member of our team will pull ounass.com's traffic data, verify it by hand, and email you the outcome within 2 business days.\n\nIf the review confirms 5,000+ monthly unique visitors, guaranteed campaigns unlock right away. If not, we'll share the figure we measured so you can compare it with your own analytics.",
};

/* ------------------------------------------------------------------ */
/* Eligibility agent — full-screen chat for not-yet-eligible brands.   */
/* Mirrors the campaign assistant's chat language (avatar, bubbles,    */
/* chips card, composer).                                              */
/* ------------------------------------------------------------------ */
type Msg = { role: "ai" | "user"; text: string };

export default function EligibilityAgent({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [inputVal, setInputVal] = useState("");
  // Re-check is a two-step flow: the agent OFFERS to log it first, then the
  // user confirms (via the highlighted chip or by typing yes).
  const [recheck, setRecheck] = useState<"none" | "offered" | "done">("none");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const pushAi = (text: string) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text }]);
    }, 700);
    timers.current.push(t);
  };

  useEffect(() => {
    const t = setTimeout(() => pushAi(CONTENT.greeting), 350);
    timers.current.push(t);
    const snapshot = timers.current;
    return () => snapshot.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function replyFor(topic: Topic): string {
    if (topic.id === "recheck") {
      if (recheck === "done") return CONTENT.recheckConfirmed;
      setRecheck("offered");
    }
    return topic.reply;
  }

  function confirmRecheck() {
    if (typing || recheck === "done") return;
    setMessages((m) => [...m, { role: "user", text: "Yes — log the re-check" }]);
    setRecheck("done");
    pushAi(CONTENT.recheckConfirmed);
  }

  function askTopic(topic: Topic) {
    if (typing) return;
    if (topic.id === "recheck" && recheck !== "none") return;
    setMessages((m) => [...m, { role: "user", text: topic.chip }]);
    pushAi(replyFor(topic));
  }

  function askFreeform(val: string) {
    const v = val.trim();
    if (!v || typing) return;
    // A pending offer + an affirmative answer = confirm the re-check.
    if (recheck === "offered" && /^(yes|yeah|yep|sure|ok(ay)?|please|do it|log it|go ahead|نعم|اي|أجل)/i.test(v)) {
      setMessages((m) => [...m, { role: "user", text: v }]);
      setInputVal("");
      setRecheck("done");
      pushAi(CONTENT.recheckConfirmed);
      return;
    }
    setMessages((m) => [...m, { role: "user", text: v }]);
    setInputVal("");
    const rule = CONTENT.keywordRules.find((r) => new RegExp(r.pattern, "i").test(v));
    const topic = rule && CONTENT.topics.find((t) => t.id === rule.topicId);
    pushAi(topic ? replyFor(topic) : CONTENT.fallback);
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <header className="relative h-[65px] shrink-0 border-b border-black/[0.06] bg-white/80 backdrop-blur-sm">
        <div className="absolute left-5 top-1/2 -translate-y-1/2">
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] text-neutral-500 transition hover:bg-neutral-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mx-auto flex h-full w-full max-w-3xl items-center gap-3 px-5">
          <h1 className="text-base font-semibold" style={{ color: INK }}>Eligibility check</h1>
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#4D2FB0]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#4D2FB0]">✦ AI assistant</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-7 px-5 py-8">
          {messages.map((m, i) =>
            m.role === "ai" ? (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-[13px] text-white">✦</div>
                <p className="mt-0.5 min-w-0 flex-1 whitespace-pre-line text-[15px] leading-7 text-neutral-800">{m.text}</p>
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

      {/* ── Composer ── */}
      <div className="mx-auto w-full max-w-3xl px-5 pb-5 pt-1">
        {!typing && messages.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_20px_rgba(16,12,40,0.07)]">
            <div className="px-4 pb-2 pt-3">
              <p className="text-[14px] font-medium text-neutral-800">Common questions</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {recheck === "offered" && (
                <button onClick={confirmRecheck}
                  className="flex w-full items-center gap-3 bg-[#4D2FB0]/[0.05] px-4 py-3 text-left text-sm font-semibold text-[#4D2FB0] transition hover:bg-[#4D2FB0]/[0.09]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#4D2FB0] text-white">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  Yes — log the re-check
                </button>
              )}
              {CONTENT.topics.map((t, i) => {
                const done = t.id === "recheck" && recheck === "done";
                const offered = t.id === "recheck" && recheck === "offered";
                if (offered) return null;
                return (
                  <button key={t.id} onClick={() => askTopic(t)} disabled={done}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${done ? "cursor-default text-neutral-400" : "text-neutral-700 hover:bg-neutral-50"}`}>
                    {done ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-600">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-500">{i + 1}</span>
                    )}
                    {done ? "Re-check requested" : t.chip}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-end gap-1.5 rounded-[28px] border border-black/[0.09] bg-white py-2 pl-5 pr-2 shadow-[0_4px_20px_rgba(16,12,40,0.07)] transition focus-within:border-[#4D2FB0]/35">
          <textarea
            ref={inputRef}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askFreeform(inputVal); } }}
            rows={1}
            placeholder="Ask about eligibility…"
            className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button onClick={() => askFreeform(inputVal)} disabled={!inputVal.trim() || typing} aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4D2FB0] text-white transition hover:bg-[#3F2596] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
