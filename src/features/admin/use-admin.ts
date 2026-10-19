"use client";
import { useApiQuery, useDemoNow } from "@/lib/query";
import { admin } from "@/lib/api";
import { useSession } from "@/stores/session";

/** Active admin profile + demo clock for admin screens. */
export function useAdmin() {
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const q = useApiQuery(["admin-me"], () => admin.getAdminProfile(userId!), !!userId && role !== "fan");
  const now = useDemoNow();
  return { adminId: userId ?? "", admin: q.data, now, query: q };
}
