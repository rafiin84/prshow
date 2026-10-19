import type { District } from "@/types";

// Demo Tamil Nadu hierarchy: State -> District -> AC -> Ward. Ward names are illustrative.
export const STATE = { id: "tn", name: "Tamil Nadu" };

export const DISTRICTS: District[] = [
  {
    id: "chennai", name: "Chennai",
    acs: [
      { id: "mylapore", name: "Mylapore", wards: [{ id: "w-mylapore-12", name: "Ward 12 · Mandaveli" }, { id: "w-mylapore-13", name: "Ward 13 · Abiramapuram" }, { id: "w-mylapore-14", name: "Ward 14 · Luz" }] },
      { id: "velachery", name: "Velachery", wards: [{ id: "w-velachery-21", name: "Ward 21 · Taramani" }, { id: "w-velachery-22", name: "Ward 22 · Guindy North" }] },
      { id: "t-nagar", name: "T. Nagar", wards: [{ id: "w-tnagar-8", name: "Ward 8 · Pondy Bazaar" }, { id: "w-tnagar-9", name: "Ward 9 · West Mambalam" }] },
    ],
  },
  {
    id: "coimbatore", name: "Coimbatore",
    acs: [
      { id: "cbe-north", name: "Coimbatore North", wards: [{ id: "w-cbn-3", name: "Ward 3 · Saibaba Colony" }, { id: "w-cbn-4", name: "Ward 4 · Ganapathy" }] },
      { id: "singanallur", name: "Singanallur", wards: [{ id: "w-sng-15", name: "Ward 15 · Ramanathapuram" }, { id: "w-sng-16", name: "Ward 16 · Peelamedu" }] },
    ],
  },
  {
    id: "madurai", name: "Madurai",
    acs: [
      { id: "madurai-central", name: "Madurai Central", wards: [{ id: "w-mdc-5", name: "Ward 5 · Simmakkal" }, { id: "w-mdc-6", name: "Ward 6 · Goripalayam" }] },
      { id: "madurai-west", name: "Madurai West", wards: [{ id: "w-mdw-31", name: "Ward 31 · K. Pudur" }] },
    ],
  },
  {
    id: "trichy", name: "Tiruchirappalli",
    acs: [
      { id: "srirangam", name: "Srirangam", wards: [{ id: "w-sri-2", name: "Ward 2 · Thiruvanaikaval" }, { id: "w-sri-3", name: "Ward 3 · Woraiyur" }] },
      { id: "trichy-east", name: "Tiruchirappalli East", wards: [{ id: "w-tre-18", name: "Ward 18 · Thillai Nagar" }] },
    ],
  },
];

export function findDistrict(id?: string) { return DISTRICTS.find((d) => d.id === id); }
export function findAC(id?: string) { return DISTRICTS.flatMap((d) => d.acs).find((a) => a.id === id); }
export function findWard(id?: string) { return DISTRICTS.flatMap((d) => d.acs.flatMap((a) => a.wards)).find((w) => w.id === id); }
export function acsOf(districtId?: string) { return findDistrict(districtId)?.acs ?? []; }
export function wardsOf(acId?: string) { return findAC(acId)?.wards ?? []; }

export function locLabel(loc?: { districtId?: string; acId?: string; wardId?: string }, depth: 1 | 2 | 3 = 3) {
  if (!loc) return "Tamil Nadu";
  const parts = [findDistrict(loc.districtId)?.name, depth >= 2 ? findAC(loc.acId)?.name : undefined, depth >= 3 ? findWard(loc.wardId)?.name : undefined].filter(Boolean);
  return parts.join(" · ") || "Tamil Nadu";
}
