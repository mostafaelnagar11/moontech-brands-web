export const DEMO_CODE = "911324";

/* The workspace brands — ONE list, shared by the sign-in brand picker and the
   sidebar's brand switcher, so the two can never drift apart. */
export type Brand = {
  id: string;
  name: string;
  initials: string;
  color: string;
  logo?: string;
};

export const BRANDS: Brand[] = [
  { id: "ounass", name: "Ounass",      initials: "O", color: "#4D2FB0", logo: "/ounass-logo.jpeg" },
  { id: "luna",   name: "Luna Beauty", initials: "L", color: "#0891b2", logo: "/luna-logo.png" },
  { id: "fresh",  name: "FreshGrocer", initials: "F", color: "#059669", logo: "/freshgrocer-logo.jpg" },
];
