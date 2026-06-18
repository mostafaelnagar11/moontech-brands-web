export const DEMO_CODE = "911324";

export type Brand = {
  id: string;
  name: string;
  initials: string;
  color: string;
  external?: boolean;
};

export const BRANDS: Brand[] = [
  { id: "test-01", name: "Test 01", initials: "T1", color: "#2563eb", external: true },
  { id: "test-02", name: "Test 02", initials: "T2", color: "#2563eb" },
  { id: "test-03", name: "Test 03", initials: "T3", color: "#2563eb" },
];
