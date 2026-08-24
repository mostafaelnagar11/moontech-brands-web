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
/* A decline carries its reasons. Stored beside the signal rather than
   inside it because the signal is a fact the whole app reads, while this
   has exactly one audience — the creator who made the ad.

   `reasons` are DECLINE_REASONS ids and are the mechanism; `note` is the
   optional extra. Both are sent to the creator verbatim. */
export interface AdFeedback {
  reasons: readonly string[];
  note: string;
}
type Notes = Readonly<Record<string, AdFeedback>>;

const EMPTY: Overrides = {};
const NO_NOTES: Notes = {};
let overrides: Overrides = EMPTY;
let notes: Notes = NO_NOTES;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Snapshot must be referentially stable or useSyncExternalStore loops. */
const getSnapshot = () => overrides;
const getServerSnapshot = () => EMPTY;
const getNotes = () => notes;
const getServerNotes = () => NO_NOTES;

/** Record a decision (or clear one back to "none" on undo).
    An optional note travels with a decline; undoing a decline clears it,
    because a reason for a decision that no longer exists must not be
    left addressed to a creator. */
export function setAdSignal(id: string, signal: AdSignal, feedback?: AdFeedback) {
  const next: AdFeedback | null = signal === "disliked" && feedback
    ? { reasons: feedback.reasons, note: feedback.note.trim() }
    : null;
  const carries = !!next && (next.reasons.length > 0 || next.note.length > 0);
  const prev = notes[id];
  const changed = carries
    ? prev?.note !== next!.note || prev?.reasons.join("|") !== next!.reasons.join("|")
    : id in notes;
  if (overrides[id] === signal && !changed) return;

  overrides = { ...overrides, [id]: signal };
  /* A reason for a decision that no longer exists must not be left
     addressed to a creator, so a like or an undo clears it. */
  notes = carries ? { ...notes, [id]: next! } : omit(notes, id);
  emit();
}

function omit(src: Notes, id: string): Notes {
  if (!(id in src)) return src;
  const next = { ...src };
  delete next[id];
  return next;
}

/** Test/reset hook — not used by the UI, but keeps the store honest. */
export function resetAdSignals() {
  if (overrides === EMPTY && notes === NO_NOTES) return;
  overrides = EMPTY;
  notes = NO_NOTES;
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

/** Every decline the brand has explained, keyed by ad id. */
export function useAdFeedbacks(): Notes {
  return useSyncExternalStore(subscribe, getNotes, getServerNotes);
}

/** What the creator will be sent for one ad, or null. */
export function useAdFeedback(id: string): AdFeedback | null {
  return useAdFeedbacks()[id] ?? null;
}
