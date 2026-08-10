"use client";

/* ------------------------------------------------------------------ */
/* Ad decisions — shared by the campaign detail route and the ad       */
/* review route.                                                       */
/*                                                                     */
/* The review route used to keep decisions in component state, so       */
/* liking every draft and navigating back left the detail page still    */
/* claiming "6 ads waiting on you". A decision is a fact the whole app  */
/* has to agree on, so it lives in a module store — the same shape      */
/* lib/funding.ts uses for a funded phase.                             */
/*                                                                     */
/* In memory only: this is a prototype's optimistic echo of a           */
/* decision, and it should not outlive a reload.                        */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { adsFor, type Ad, type AdSignal } from "./campaigns";

type Overrides = Readonly<Record<string, AdSignal>>;

const EMPTY: Overrides = {};
let overrides: Overrides = EMPTY;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Snapshot must be referentially stable or useSyncExternalStore loops. */
const getSnapshot = () => overrides;
const getServerSnapshot = () => EMPTY;

/** Record a decision (or clear one back to "none" on undo). */
export function setAdSignal(id: string, signal: AdSignal) {
  if (overrides[id] === signal) return;
  overrides = { ...overrides, [id]: signal };
  emit();
}

/** Test/reset hook — not used by the UI, but keeps the store honest. */
export function resetAdSignals() {
  if (overrides === EMPTY) return;
  overrides = EMPTY;
  emit();
}

export function useAdOverrides(): Overrides {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** One campaign's drafts with every decision applied. */
export function useAdsFor(campaignId: string): Ad[] {
  const o = useAdOverrides();
  return adsFor(campaignId).map((a) => {
    const next = o[a.id];
    return next && next !== a.signal ? { ...a, signal: next } : a;
  });
}

/** The drafts still waiting on the brand. */
export function useWaitingFor(campaignId: string): Ad[] {
  return useAdsFor(campaignId).filter((a) => a.signal === "none");
}
