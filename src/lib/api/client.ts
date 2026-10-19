import { useDemoStore } from "@/stores/demo";
import { getDB, persist, syncEscalations } from "./db";

export class ApiError extends Error {
  constructor(message: string, public code: "network" | "forbidden" | "validation" | "not_found" | "conflict" = "network") {
    super(message);
  }
}

let seq = 0;
const LATENCY = { fast: [40, 140], normal: [140, 420], slow: [600, 1400] } as const;
const delay = () => {
  const [lo, hi] = LATENCY[useDemoStore.getState().latency];
  seq += 1;
  return lo + ((seq * 97) % (hi - lo)); // deterministic variation
};

async function run<T>(fn: () => T, write: boolean): Promise<T> {
  await new Promise((r) => setTimeout(r, delay()));
  if (useDemoStore.getState().consumeFail()) throw new ApiError("The demo network request failed. This is a simulated failure — try again.", "network");
  getDB();
  syncEscalations();
  const out = fn();
  if (write) persist();
  return out;
}
/** Read from the mock service with latency + optional simulated failure. */
export const read = <T,>(fn: () => T) => run(fn, false);
/** Mutate the mock service; persists non-sensitive demo state afterwards. */
export const write = <T,>(fn: () => T) => run(fn, true);
