import { describe, expect, it } from "vitest";
import { CASES } from "@/data/seeds/ops";
import { BASE_TIME, HOUR, MIN } from "@/data/seeds/time";
import { applyEscalations, canTransition, currentDeadline, districtDeadline, reviewLevel, wardDeadline } from "@/lib/moderation/workflow";
import type { ContentModerationCase } from "@/types";

const fresh = (): ContentModerationCase => ({ ...structuredClone(CASES.find((c) => c.id === "case-1")!), submittedAt: BASE_TIME, status: "pending_review", escalatedToDistrictAt: undefined, escalatedToCentralAt: undefined, history: [] });

describe("moderation escalation", () => {
  it("stays with the Ward Admin for the first hour", () => {
    const c = fresh();
    expect(reviewLevel(c, BASE_TIME + 59 * MIN)).toBe("ward");
    expect(applyEscalations(c, BASE_TIME + 59 * MIN).events).toHaveLength(0);
  });
  it("escalates to District after exactly 1 hour", () => {
    const r = applyEscalations(fresh(), BASE_TIME + HOUR);
    expect(r.events.map((e) => e.to)).toEqual(["district"]);
    expect(r.case.status).toBe("escalated");
    expect(r.case.escalatedToDistrictAt).toBe(BASE_TIME + HOUR);
  });
  it("escalates to Central 2 hours after the District escalation (3h total)", () => {
    const mid = applyEscalations(fresh(), BASE_TIME + 2 * HOUR + 59 * MIN).case;
    expect(reviewLevel(mid, BASE_TIME + 2 * HOUR + 59 * MIN)).toBe("district");
    const r = applyEscalations(fresh(), BASE_TIME + 3 * HOUR);
    expect(r.events.map((e) => e.to)).toEqual(["district", "central"]);
    expect(reviewLevel(r.case, BASE_TIME + 3 * HOUR)).toBe("central");
  });
  it("a late first look doesn't move the deadlines (viewing never stops the timer)", () => {
    const c = fresh();
    const viewed = { ...c, viewedBy: [{ id: "adm-ward-12", at: BASE_TIME + 50 * MIN }] };
    expect(wardDeadline(viewed)).toBe(wardDeadline(c));
    expect(applyEscalations(viewed, BASE_TIME + HOUR).events).toHaveLength(1);
  });
  it("a decision cancels any further escalation", () => {
    const decided = { ...fresh(), status: "approved" as const };
    expect(applyEscalations(decided, BASE_TIME + 10 * HOUR).events).toHaveLength(0);
    expect(currentDeadline(decided, BASE_TIME + 10 * HOUR)).toBeUndefined();
  });
  it("district deadline follows the actual escalation time", () => {
    const manual = { ...fresh(), escalatedToDistrictAt: BASE_TIME + 20 * MIN };
    expect(districtDeadline(manual)).toBe(BASE_TIME + 20 * MIN + 2 * HOUR);
  });
});

describe("status transitions", () => {
  it("allows open → decisions and forbids leaving a decided state", () => {
    expect(canTransition("pending_review", "approved")).toBe(true);
    expect(canTransition("escalated", "rejected")).toBe(true);
    expect(canTransition("approved", "rejected")).toBe(false);
    expect(canTransition("needs_correction", "approved")).toBe(false);
  });
});
