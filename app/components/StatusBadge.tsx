"use client";

import { CalendarBlank, Check, Clock, LockSimple } from "@phosphor-icons/react";
import { runsPhases, type CampaignStatus } from "../lib/campaigns";

/* One badge, used by the campaigns list, the campaign detail route and the
   dashboard ladder so they can never drift (they had a Clock glyph and a
   ⏳ emoji before).

   inline-flex, NOT flex: a <span> set to `display: flex` becomes a
   block-level flex container and stretches to whatever holds it — in the
   dashboard's ladder table that is the whole Status column, so the pill
   rendered as a full-width bar. As a flex ITEM its width comes from flex
   sizing either way, so inline-flex is safe everywhere and hugs the label
   where nothing else constrains it.

   Every status needs its OWN branch. There used to be a fall-through for
   "Ended", which meant a Locked phase — queued, never run — was labelled
   Completed: the most misleading word available for it.

   "Completed" is the one word for the Ended state, matching the filter tab,
   the command palette and the Completed block on the campaigns list. */
export default function StatusBadge({ status, brandId }: { status: CampaignStatus; brandId: string }) {
  if (status === "Live") return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4D2FB0]/20 bg-[#4D2FB0]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#4D2FB0]">
      <span aria-hidden="true" className="animate-live h-1.5 w-1.5 rounded-full bg-[#4D2FB0]" />
      Live
    </span>
  );
  /* Ready splits on the brand's model. On a ladder it is a bill: red,
     because the phase sits there until somebody pays for it. On a
     calendar it is a DATE — the campaign is booked and nothing is
     waiting on anyone — so it must not wear the colour this app
     reserves for "needs your action". */
  if (status === "Ready") return runsPhases(brandId) ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#D70015]/25 bg-[#D70015]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#D70015]">
      <Clock size={11} weight="fill" aria-hidden="true" />
      Ready to fund
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#4D2FB0]/20 bg-[#4D2FB0]/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#4D2FB0]">
      <CalendarBlank size={11} weight="fill" aria-hidden="true" />
      Scheduled
    </span>
  );
  /* Queued: unlocks only when the phase ahead of it crosses 80%. It is
     not payable, so it must not look like anything the brand can act on. */
  if (status === "Locked") return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/[0.07] bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-400">
      <LockSimple size={11} weight="fill" aria-hidden="true" />
      Queued
    </span>
  );
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
      <Check size={11} weight="bold" aria-hidden="true" />
      Completed
    </span>
  );
}
