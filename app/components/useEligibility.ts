"use client";

import { useEffect, useState } from "react";

/**
 * Reads the brand's eligibility flag persisted in localStorage
 * ("moontech_last_eligibility": "1" = eligible, "0" = not eligible).
 *
 * Defaults to `true` so eligible brands (and first-time visitors with no flag
 * set yet) see the full experience; non-eligible brands are then hidden the
 * campaign tools once the flag is read after mount.
 */
export function useEligibility(): boolean {
  const [eligible, setEligible] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("moontech_last_eligibility");
      if (stored !== null) setEligible(stored === "1");
    } catch {}
  }, []);

  return eligible;
}
