import { create } from "zustand";

export type LatencyMode = "fast" | "normal" | "slow";
/** Dev/demo tooling for the mock API. Clearly labelled in the UI; not a product feature. */
interface DemoState {
  failAll: boolean;
  failNext: number;
  latency: LatencyMode;
  setFailAll: (v: boolean) => void;
  armFailNext: (n?: number) => void;
  consumeFail: () => boolean;
  setLatency: (m: LatencyMode) => void;
}
export const useDemoStore = create<DemoState>((set, get) => ({
  failAll: false,
  failNext: 0,
  latency: "fast",
  setFailAll: (failAll) => set({ failAll }),
  armFailNext: (n = 1) => set({ failNext: n }),
  consumeFail: () => {
    const { failAll, failNext } = get();
    if (failAll) return true;
    if (failNext > 0) { set({ failNext: failNext - 1 }); return true; }
    return false;
  },
  setLatency: (latency) => set({ latency }),
}));
