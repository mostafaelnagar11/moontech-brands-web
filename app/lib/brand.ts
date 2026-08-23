"use client";

/* ------------------------------------------------------------------ */
/* The active workspace brand.                                         */
/*                                                                     */
/* Each brand owns its own ladder of phases, its own budget and its     */
/* own numbers, so "which brand am I looking at" decides what the       */
/* campaigns list, the detail route and the dashboard show. The         */
/* sidebar switcher used to hold that in local state, which meant       */
/* switching brands changed the sidebar and nothing else.               */
/*                                                                     */
/* Persisted, unlike funding: which brand you are working on should     */
/* survive a reload the way a saved profile does.                       */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { BRANDS, type Brand } from "../data";

const KEY = "moontech_active_brand";

let activeId: string = BRANDS[0].id;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  /* Read storage on the first subscribe rather than at module scope:
     this file is imported by server-rendered trees too. */
  if (!hydrated) {
    hydrated = true;
    try {
      const s = localStorage.getItem(KEY);
      if (s && BRANDS.some((b) => b.id === s)) activeId = s;
    } catch {}
  }
  listeners.add(l);
  return () => { listeners.delete(l); };
}

const getSnapshot = () => activeId;
const getServerSnapshot = () => BRANDS[0].id;

export function setActiveBrand(id: string) {
  if (id === activeId || !BRANDS.some((b) => b.id === id)) return;
  activeId = id;
  try { localStorage.setItem(KEY, id); } catch {}
  emit();
}

/** The active brand's id. */
export function useActiveBrandId(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The active brand record. Never undefined — the id is validated on write. */
export function useActiveBrand(): Brand {
  const id = useActiveBrandId();
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}
