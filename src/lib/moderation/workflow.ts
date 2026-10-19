import type { CaseStatus, ContentModerationCase, ReviewLevel } from "@/types";

export const HOUR = 3_600_000;
export const WARD_WINDOW_MS = 1 * HOUR; // Ward review window
export const DISTRICT_WINDOW_MS = 2 * HOUR; // District window after escalation

export const OPEN_STATUSES: CaseStatus[] = ["submitted", "pending_review", "escalated"];
export const isOpen = (c: Pick<ContentModerationCase, "status">) => OPEN_STATUSES.includes(c.status);

/** Allowed status transitions. A decision is final; correction resubmits create a new case. */
export const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  submitted: ["pending_review", "escalated", "approved", "rejected", "needs_correction"],
  pending_review: ["escalated", "approved", "rejected", "needs_correction"],
  escalated: ["escalated", "approved", "rejected", "needs_correction"],
  approved: [],
  rejected: [],
  needs_correction: [],
};
export const canTransition = (from: CaseStatus, to: CaseStatus) => TRANSITIONS[from].includes(to);

export function wardDeadline(c: Pick<ContentModerationCase, "submittedAt">) {
  return c.submittedAt + WARD_WINDOW_MS;
}
export function districtDeadline(c: Pick<ContentModerationCase, "submittedAt" | "escalatedToDistrictAt">) {
  return (c.escalatedToDistrictAt ?? wardDeadline(c)) + DISTRICT_WINDOW_MS;
}

/** Which level currently owns an open case, given the demo clock. */
export function reviewLevel(c: ContentModerationCase, now: number): ReviewLevel {
  if (c.escalatedToCentralAt !== undefined || (isOpen(c) && c.escalatedToDistrictAt !== undefined && now >= districtDeadline(c))) return "central";
  if (c.escalatedToDistrictAt !== undefined || (isOpen(c) && now >= wardDeadline(c))) return "district";
  return "ward";
}

/** Deadline for the level currently holding the case (undefined at central or once decided). */
export function currentDeadline(c: ContentModerationCase, now: number): number | undefined {
  if (!isOpen(c)) return undefined;
  const level = reviewLevel(c, now);
  if (level === "ward") return wardDeadline(c);
  if (level === "district") return districtDeadline(c);
  return undefined;
}

export interface EscalationResult { case: ContentModerationCase; events: { at: number; to: "district" | "central" }[] }

/**
 * Pure: materialise any escalations that are due at `now`. Opening/viewing a case never calls this
 * with different inputs — only the clock moves it. A decided case never escalates again.
 */
export function applyEscalations(c: ContentModerationCase, now: number): EscalationResult {
  if (!isOpen(c)) return { case: c, events: [] };
  const events: EscalationResult["events"] = [];
  let next = c;
  if (next.escalatedToDistrictAt === undefined && now >= wardDeadline(next)) {
    next = { ...next, escalatedToDistrictAt: wardDeadline(next), status: "escalated" };
    events.push({ at: wardDeadline(next), to: "district" });
  }
  if (next.escalatedToDistrictAt !== undefined && next.escalatedToCentralAt === undefined && now >= districtDeadline(next)) {
    next = { ...next, escalatedToCentralAt: districtDeadline(next), status: "escalated" };
    events.push({ at: districtDeadline(next), to: "central" });
  }
  if (next.status === "submitted") next = { ...next, status: "pending_review" };
  return { case: next, events };
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  submitted: "Submitted", pending_review: "Pending review", escalated: "Escalated", approved: "Approved", rejected: "Rejected", needs_correction: "Needs correction",
};
export const LEVEL_LABEL: Record<ReviewLevel, string> = { ward: "Ward Admin", district: "District Admin", central: "Central Admin" };
