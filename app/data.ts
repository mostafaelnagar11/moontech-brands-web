export const DEMO_CODE = "911324";

/* The workspace brands — ONE list, shared by the sign-in brand picker and the
   sidebar's brand switcher, so the two can never drift apart. */
/* What this brand told us to match against. The creators screen checks a
   match against THESE rather than against a generic house threshold, so
   "why we recommend her" is answerable per brand instead of being the same
   sentence for everyone. */
export type BrandCriteria = {
  markets: string[];        // the markets the brand sells into
  ageBand: string;          // the buying age band
  minGccAudience: number;   // % of audience that must be in the region
  minViewThrough: number;   // avg views ÷ followers — does the audience watch
  minPostsPerWeek: number;  // cadence a phase can be built on
};

export type Brand = {
  id: string;
  name: string;
  initials: string;
  color: string;
  logo?: string;
  criteria: BrandCriteria;
};

export const BRANDS: Brand[] = [
  { id: "ounass", name: "Ounass",      initials: "O", color: "#4D2FB0", logo: "/ounass-logo.jpeg",
    criteria: { markets: ["UAE", "KSA", "Kuwait"], ageBand: "25–34",
                minGccAudience: 60, minViewThrough: 0.15, minPostsPerWeek: 3 } },
  { id: "luna",   name: "Luna Beauty", initials: "L", color: "#0891b2", logo: "/luna-logo.png",
    criteria: { markets: ["UAE", "KSA"], ageBand: "18–34",
                minGccAudience: 55, minViewThrough: 0.15, minPostsPerWeek: 2 } },
  { id: "fresh",  name: "FreshGrocer", initials: "F", color: "#059669", logo: "/freshgrocer-logo.jpg",
    criteria: { markets: ["UAE"], ageBand: "25–44",
                minGccAudience: 70, minViewThrough: 0.12, minPostsPerWeek: 2 } },
];
