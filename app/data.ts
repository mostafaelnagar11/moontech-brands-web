export const DEMO_CODE = "911324";

/* The workspace brands — ONE list, shared by the sign-in brand picker and the
   sidebar's brand switcher, so the two can never drift apart. */
/* What this brand told us to match against. The creators screen checks a
   match against THESE rather than against a generic house threshold, so
   "why we recommend her" is answerable per brand instead of being the same
   sentence for everyone. */
/* FOUR SIGNALS, because four are what the matcher actually extracts from a
   profile. It used to carry six — markets, buyer age, view-through and
   cadence among them — and the extra two were checked against numbers the
   matcher never reads, so the checklist described a process that wasn't
   running. These are the ones it does read. */
export type BrandCriteria = {
  platforms: string[];      // the platforms this brand wants to run on
  minFollowers: number;     // the floor a creator has to clear
  niches: string[];         // the profile signals the brand is buying
  minGccAudience: number;   // % of audience that must be in the region
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
    criteria: { platforms: ["Instagram", "TikTok"], minFollowers: 50000,
                niches: ["Luxury", "Fashion", "Beauty"], minGccAudience: 60 } },
  { id: "luna",   name: "Luna Beauty", initials: "L", color: "#0891b2", logo: "/luna-logo.png",
    criteria: { platforms: ["Instagram", "TikTok"], minFollowers: 25000,
                niches: ["Beauty", "Lifestyle"], minGccAudience: 55 } },
  { id: "fresh",  name: "FreshGrocer", initials: "F", color: "#059669", logo: "/freshgrocer-logo.jpg",
    criteria: { platforms: ["Instagram", "TikTok"], minFollowers: 15000,
                niches: ["Lifestyle", "Beauty"], minGccAudience: 70 } },
];
