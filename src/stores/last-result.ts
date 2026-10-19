import { create } from "zustand";
import type { Badge } from "@/types";

/** Carries "newly earned" info from quiz submit to the result screen without persisting it. */
export const useLastResult = create<{ attemptId: string | null; newBadges: Badge[]; set: (id: string, b: Badge[]) => void }>((set) => ({
  attemptId: null, newBadges: [], set: (attemptId, newBadges) => set({ attemptId, newBadges }),
}));
