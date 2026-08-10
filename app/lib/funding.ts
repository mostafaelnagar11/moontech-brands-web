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
  CAMPAIGNS, PHASE_NAMES,
  type Campaign, type CampaignStatus, type PhaseState,
} from "./campaigns";

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

/** The campaign list with every funded phase already applied. */
export function applyFunding(ids: readonly string[]): Campaign[] {
  return CAMPAIGNS.map((c) => {
    if (!c.due || !ids.includes(c.id)) return c;
    const p = [...c.phases] as [PhaseState, PhaseState, PhaseState];
    if (c.due.phase >= 2) p[c.due.phase - 2] = "Done";
    p[c.due.phase - 1] = "Active";
    return {
      ...c,
      phases: p,
      status: "Live" as CampaignStatus,
      due: null,
      phaseNo: c.due.phase,
      phaseName: PHASE_NAMES[c.due.phase - 1],
      revTarget: null,
      revPct: null,
      threshold: `Phase ${c.due.phase} deploying to matched creators`,
      thresholdGreen: false,
    };
  });
}

/** Every campaign, funding applied. One source of truth for all routes. */
export function useRoster(): Campaign[] {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return applyFunding(ids);
}

/** One campaign by id, funding applied. `undefined` if the id is unknown. */
export function useCampaign(id: string): Campaign | undefined {
  return useRoster().find((c) => c.id === id);
}
