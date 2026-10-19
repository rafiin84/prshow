import type { AdminProfile, FanProfile, Loc } from "@/types";
import { BASE_TIME, DAY } from "./time";

const L = (districtId: string, acId: string, wardId: string): Loc => ({ districtId, acId, wardId });
const prefs = { notifyEvents: true, notifyQuiz: true, notifyOfficial: true, showCity: true };

export const DEMO_FAN_ID = "fan-meera";
export const NEW_APPLICANT_ID = "fan-new";

function fan(id: string, name: string, handle: string, hue: number, loc: Loc, extra: Partial<FanProfile> = {}): FanProfile {
  return {
    id, name, handle, phoneMasked: "+91 ••••• ••" + (10 + (hue % 80)), bio: "", hue, loc,
    verification: "approved", joinedAt: BASE_TIME - 120 * DAY, prefs: { ...prefs }, savedIds: [], likedIds: [], ...extra,
  };
}
const mem = (n: number, issued: number) => ({ memberNo: `PRS-26-${String(n).padStart(5, "0")}`, status: "active" as const, issuedAt: BASE_TIME - issued * DAY, qrToken: `tk_${(n * 7919).toString(36)}${(n * 104729).toString(36)}` });

export const FANS: FanProfile[] = [
  fan("fan-meera", "Meera Sundaram", "meera.s", 18, L("chennai", "mylapore", "w-mylapore-12"), { bio: "Love Today rewatch club founder. Weekend filter-coffee person.", membership: mem(10482, 94), savedIds: ["movie-love-today", "reel-r2"], likedIds: ["reel-r1"] }),
  fan("fan-arjun", "Arjun Venkat", "arjunv", 210, L("chennai", "mylapore", "w-mylapore-12"), { membership: mem(10511, 60) }),
  fan("fan-nisha", "Nisha Rahman", "nisha.r", 320, L("chennai", "mylapore", "w-mylapore-13"), { membership: mem(10530, 41) }),
  fan("fan-karthi", "Karthikeyan P", "karthi_p", 150, L("chennai", "velachery", "w-velachery-21"), { membership: mem(10602, 33) }),
  fan("fan-divya", "Divya Lakshmi", "divyal", 40, L("chennai", "t-nagar", "w-tnagar-8"), { membership: mem(10644, 28) }),
  fan("fan-sanjay", "Sanjay Kumar", "sanjayk", 260, L("coimbatore", "cbe-north", "w-cbn-3"), { membership: mem(10700, 20) }),
  fan("fan-pavithra", "Pavithra Ganesh", "pavi.g", 90, L("coimbatore", "singanallur", "w-sng-15"), { membership: mem(10733, 17) }),
  fan("fan-ravi", "Ravichandran S", "ravic", 185, L("madurai", "madurai-central", "w-mdc-5"), { membership: mem(10790, 12) }),
  fan("fan-janani", "Janani Murugan", "janani.m", 300, L("trichy", "srirangam", "w-sri-2"), { membership: mem(10822, 9) }),
  fan("fan-harish", "Harish Babu", "harishb", 120, L("chennai", "mylapore", "w-mylapore-12"), { verification: "pending_review", joinedAt: BASE_TIME - 2 * DAY }),
  fan("fan-sowmya", "Sowmya Iyer", "sowmya_i", 340, L("chennai", "velachery", "w-velachery-22"), { verification: "needs_correction", verificationNote: "The selfie step timed out. Please repeat the liveness simulation.", joinedAt: BASE_TIME - 3 * DAY }),
  fan("fan-imran", "Imran Sheikh", "imran.sh", 70, L("madurai", "madurai-west", "w-mdw-31"), { verification: "rejected", verificationNote: "Location did not match the selected ward.", joinedAt: BASE_TIME - 5 * DAY }),
  fan("fan-new", "New Applicant", "new.applicant", 200, L("chennai", "mylapore", "w-mylapore-12"), { verification: "not_started", joinedAt: BASE_TIME }),
];

const A = (id: string, name: string, role: AdminProfile["role"], hue: number, scope: Partial<AdminProfile["scope"]>, title: string, active = true): AdminProfile => ({
  id, name, role, hue, scope: { level: role, ...scope }, title, active,
});

export const ADMINS: AdminProfile[] = [
  A("adm-central", "Karthik Raman", "central", 14, {}, "Central Admin"),
  A("adm-dist-chn", "Lakshmi Narayanan", "district", 200, { districtId: "chennai" }, "District Admin · Chennai"),
  A("adm-dist-cbe", "Prakash Rajan", "district", 160, { districtId: "coimbatore" }, "District Admin · Coimbatore"),
  A("adm-ac-myl", "Suresh Babu", "ac", 280, { districtId: "chennai", acId: "mylapore" }, "AC Admin · Mylapore"),
  A("adm-ac-vel", "Anitha Krishnan", "ac", 330, { districtId: "chennai", acId: "velachery" }, "AC Admin · Velachery"),
  A("adm-ward-12", "Divya Prakash", "ward", 60, { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" }, "Ward Admin · Ward 12"),
  A("adm-ward-13", "Mohan Raj", "ward", 100, { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-13" }, "Ward Admin · Ward 13"),
  A("adm-ward-21", "Fathima Beevi", "ward", 240, { districtId: "chennai", acId: "velachery", wardId: "w-velachery-21" }, "Ward Admin · Ward 21"),
  // Pending appointments: no active privileges yet.
  A("adm-ac-tng", "Gokul Anand", "ac", 20, { districtId: "chennai", acId: "t-nagar" }, "AC Admin nominee · T. Nagar", false),
  A("adm-ward-14", "Revathi Selvam", "ward", 130, { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-14" }, "Ward Admin nominee · Ward 14", false),
];

/** The persona used for each role in the demo role switcher. */
export const ROLE_PERSONAS = {
  fan: DEMO_FAN_ID,
  central: "adm-central",
  district: "adm-dist-chn",
  ac: "adm-ac-myl",
  ward: "adm-ward-12",
} as const;
