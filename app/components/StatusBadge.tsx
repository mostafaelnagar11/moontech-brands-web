"use client";

import { Check, Clock } from "@phosphor-icons/react";
import type { CampaignStatus } from "../lib/campaigns";

/* One badge, used by the campaigns list and the campaign detail route so
   the two can never drift (they had a Clock glyph and a ⏳ emoji before). */
export default function StatusBadge({ status }: { status: CampaignStatus }) {
  if (status === "Live") return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
      <span aria-hidden="true" className="animate-live h-1.5 w-1.5 rounded-full bg-green-500" />
      Live
    </span>
  );
  if (status === "Ready") return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
      <Clock size={11} weight="fill" aria-hidden="true" />
      Ready
    </span>
  );
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
      <Check size={11} weight="bold" aria-hidden="true" />
      Ended
    </span>
  );
}
