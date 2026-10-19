import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";
import { DEMO_FAN_ID, ROLE_PERSONAS } from "@/data/seeds/people";

interface SessionState {
  userId: string | null;
  role: Role;
  hydrated: boolean;
  signInAs: (userId: string, role: Role) => void;
  switchRole: (role: Role) => void;
  signOut: () => void;
  setHydrated: () => void;
}
/** Demo session only. Role switching is a simulation, not a security control. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: "fan",
      hydrated: false,
      signInAs: (userId, role) => set({ userId, role }),
      switchRole: (role) => set({ role, userId: ROLE_PERSONAS[role] }),
      signOut: () => set({ userId: null, role: "fan" }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "prshow.session.v1",
      partialize: (s) => ({ userId: s.userId, role: s.role }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
export const DEMO_FAN = DEMO_FAN_ID;
