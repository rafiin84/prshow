import type { AdminProfile, ContentModerationCase, FanProfile, GeoScope, Loc, Nomination, ReviewLevel, Role } from "@/types";
import { reviewLevel, isOpen } from "@/lib/moderation/workflow";

/** Every role check in the UI goes through this file. */
export interface Policy { allowed: boolean; reason?: string }
const yes = (): Policy => ({ allowed: true });
const no = (reason: string): Policy => ({ allowed: false, reason });

export const ROLE_RANK: Record<Role, number> = { fan: 0, ward: 1, ac: 2, district: 3, central: 4 };
export const ROLE_LABEL: Record<Role, string> = { fan: "Fan", central: "Central Admin", district: "District Admin", ac: "AC Admin", ward: "Ward Admin" };
const LEVEL_RANK: Record<ReviewLevel, number> = { ward: 1, district: 3, central: 4 };

export function isAdminRole(role: Role) { return role !== "fan"; }

export function scopeCovers(scope: GeoScope | undefined, loc?: Partial<Loc>): boolean {
  if (!scope) return false;
  if (!loc) return scope.level === "central";
  switch (scope.level) {
    case "central": return true;
    case "district": return loc.districtId === scope.districtId;
    case "ac": return loc.acId === scope.acId;
    case "ward": return loc.wardId === scope.wardId;
  }
}

export function canAccessAdmin(role: Role): Policy {
  return isAdminRole(role) ? yes() : no("Admin tools are only available to admin roles.");
}
export const canAccessMessages = (role: Role): Policy => (isAdminRole(role) ? yes() : no("Messages are admin-only. Fans can't send or receive direct messages."));

export function canDecideCase(admin: AdminProfile, c: ContentModerationCase, now: number): Policy {
  if (!admin.active) return no("Your appointment is pending approval, so admin privileges are not active yet.");
  if (!isOpen(c)) return no("A decision has already been recorded for this item.");
  if (!scopeCovers(admin.scope, c.loc)) return no("This item is outside your geographic scope.");
  const level = reviewLevel(c, now);
  if (ROLE_RANK[admin.role] < LEVEL_RANK[level]) {
    return no(`This item is currently with the ${level === "district" ? "District" : "Central"} Admin. You can review it once it reaches you.`);
  }
  // Higher roles can only take over lower-level items inside their own scope (checked above).
  return yes();
}

export function canEscalateCase(admin: AdminProfile, c: ContentModerationCase, now: number): Policy {
  const base = canDecideCase(admin, c, now);
  if (!base.allowed) return base;
  if (reviewLevel(c, now) === "central") return no("Already at the final review level.");
  if (admin.role === "central") return no("Central Admin makes the final decision.");
  return yes();
}

export function canReviewVerification(admin: AdminProfile, fan: FanProfile): Policy {
  if (!admin.active) return no("Your appointment is pending approval.");
  if (!scopeCovers(admin.scope, fan.loc)) return no("This member is outside your geographic scope.");
  if (fan.verification !== "pending_review" && fan.verification !== "submitted") return no("This submission is not awaiting review.");
  return yes();
}

export function canNominate(admin: AdminProfile, target: "district" | "ac" | "ward"): Policy {
  if (!admin.active) return no("Your appointment is pending approval.");
  if (admin.role === "district" && target === "ac") return yes();
  if (admin.role === "ac" && target === "ward") return yes();
  if (admin.role === "central" && target === "district") return yes();
  if (admin.role === "central") return no("Central Admin appoints District Admins directly; District and AC Admins nominate downwards.");
  if (admin.role === "ward") return no("Ward Admins can't nominate other admins.");
  return no(`${ROLE_LABEL[admin.role]} can't nominate a ${target.toUpperCase()} Admin. District nominates AC; AC nominates Ward.`);
}

export function canDecideNomination(admin: AdminProfile, nom: Nomination): Policy {
  if (admin.role !== "central") return no("Only Central Admin can give final approval for appointments.");
  if (nom.status !== "nominated") return no("This nomination is not awaiting a decision.");
  return yes();
}

export const canViewNomination = (admin: AdminProfile, nom: Nomination): boolean => admin.role === "central" || scopeCovers(admin.scope, nom.scope);

export function canManageGlobalContent(role: Role): Policy {
  return role === "central" ? yes() : no("Movies, official albums and reward values are managed by Central Admin.");
}
export function canPublishQuiz(role: Role): Policy {
  return role === "central" || role === "district" ? yes() : no("Quizzes are published by District or Central Admin after review.");
}
export function canPublishAnnouncement(admin: AdminProfile): Policy {
  return admin.active ? yes() : no("Your appointment is pending approval.");
}
export function canManageEvent(admin: AdminProfile, loc: Partial<Loc>): Policy {
  if (!admin.active) return no("Your appointment is pending approval.");
  return scopeCovers(admin.scope, loc) ? yes() : no("This event is outside your geographic scope.");
}
export const canEditRewards = canManageGlobalContent;

export function scopeLabel(scope: GeoScope, names: { district?: string; ac?: string; ward?: string }) {
  switch (scope.level) {
    case "central": return "All Tamil Nadu";
    case "district": return names.district ?? "District";
    case "ac": return `${names.ac ?? "AC"} · ${names.district ?? ""}`.trim();
    case "ward": return `${names.ward ?? "Ward"} · ${names.ac ?? ""}`.trim();
  }
}
