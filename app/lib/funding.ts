"use client";

/* ------------------------------------------------------------------ */
/* Optimistic funding — shared by the campaign list, the campaign      */
/* detail route and the ad review route.                               */
/*                                                                     */
/* Funding a phase on the detail route has to be visible when you      */
/* navigate back to the list, so the state lives in a module store     */
/* rather than a component's useState.                                  */
/*                                                                     */
/* Deliberately in memory only: this is a prototype's optimistic echo  */
/* of a payment, not a fact about the world, and it should not outlive */
/* a reload the way a saved profile does.                               */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import {
  CAMPAIGNS, adsFor, fmtUSD, ladderFor,
  type Campaign, type CampaignStatus,
} from "./campaigns";
import { useActiveBrandId } from "./brand";

const EMPTY: readonly string[] = [];
let funded: readonly string[] = EMPTY;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Snapshot must be referentially stable or useSyncExternalStore loops. */
const getSnapshot = () => funded;
const getServerSnapshot = () => EMPTY;

export function fundPhase(id: string) {
  if (funded.includes(id)) return;
  funded = [...funded, id];
  emit();
}

/** Test/reset hook — not used by the UI, but keeps the store honest. */
export function resetFunding() {
  if (!funded.length) return;
  funded = EMPTY;
  emit();
}

/* ------------------------------------------------------------------ */
/* Applying a payment                                                  */
/*                                                                     */
/* Paying for a phase does THREE things, because phases are separate    */
/* campaigns that run strictly in sequence:                             */
/*                                                                     */
/*   1. the paid phase goes Live and starts being metered against its   */
/*      own target — budget × the multiple guaranteed on that phase;    */
/*   2. the phase BEFORE it ends. A brand can only have one phase       */
/*      running, so the predecessor cannot stay Live once its           */
/*      successor is funded;                                            */
/*   3. nothing else moves. The phase after the paid one stays Locked   */
/*      until this one crosses its own 80% line.                        */
/*                                                                     */
/* A payment never renames a campaign. The name is the phase number,    */
/* and paying for something does not change what it is.                 */
/* ------------------------------------------------------------------ */
export function applyFunding(ids: readonly string[]): Campaign[] {
  if (!ids.length) return CAMPAIGNS;

  /* Which phase numbers just got funded, per brand — so a predecessor
     can be settled without scanning the whole roster per row. */
  const paidByBrand = new Map<string, Set<number>>();
  for (const c of CAMPAIGNS) {
    if (!ids.includes(c.id) || c.status !== "Ready") continue;
    const set = paidByBrand.get(c.brandId) ?? new Set<number>();
    set.add(c.phaseNo);
    paidByBrand.set(c.brandId, set);
  }
  if (!paidByBrand.size) return CAMPAIGNS;

  return CAMPAIGNS.map((c) => {
    const paid = paidByBrand.get(c.brandId);
    if (!paid) return c;

    /* 1 — the phase that was paid for. Paying is what briefs the crew, so
       this is where a phase stops being a plan and acquires delivery: the
       creators who cut for it and the drafts now waiting on the brand.
       All three derive from the drafts themselves rather than being
       invented, and adsLive is 0 because nothing publishes until the
       brand likes it — which is the whole premise of the review screen. */
    if (paid.has(c.phaseNo) && c.status === "Ready") {
      const target = c.budget * c.guaranteedRoas;
      const drafts = adsFor(c.id);
      const crew = new Set(drafts.map((a) => a.creatorId)).size;
      return {
        ...c,
        status: "Live" as CampaignStatus,
        due: null,
        dates: "Starting now",
        revTarget: target,
        revPct: 0,
        threshold: `Deploying ${fmtUSD(c.budget)} to matched creators — metered against ${fmtUSD(target)}`,
        thresholdGreen: false,
        creators: crew || c.creators,
        adsLive: 0,
        adsTotal: drafts.length || c.adsTotal,
      };
    }

    /* 2 — the phase it replaces. Only one phase runs at a time. */
    if (c.status === "Live" && paid.has(c.phaseNo + 1)) {
      return {
        ...c,
        status: "Ended" as CampaignStatus,
        threshold: null,
        thresholdGreen: false,
        due: null,
      };
    }

    return c;
  });
}

/** Every phase of every brand, funding applied. */
export function useAllPhases(): Campaign[] {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return applyFunding(ids);
}

/* The active brand's ladder, in phase order, funding applied. Every
   screen reads this: a brand's numbers are its own, and nothing may
   total across brands. */
export function useRoster(): Campaign[] {
  const brandId = useActiveBrandId();
  const all = useAllPhases();
  return ladderFor(brandId, all);
}

/** One phase by id, funding applied. `undefined` if the id is unknown.
    Looks across every brand so a deep link stays valid after a switch. */
export function useCampaign(id: string): Campaign | undefined {
  return useAllPhases().find((c) => c.id === id);
}
