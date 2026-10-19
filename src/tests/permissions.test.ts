import { describe, expect, it } from "vitest";
import { ADMINS } from "@/data/seeds/people";
import { CASES, NOMINATIONS } from "@/data/seeds/ops";
import { BASE_TIME, HOUR } from "@/data/seeds/time";
import { canAccessAdmin, canAccessMessages, canDecideCase, canDecideNomination, canNominate, canPublishQuiz, canReviewVerification, scopeCovers } from "@/lib/permissions/policy";
import { FANS } from "@/data/seeds/people";

const adm = (id: string) => ADMINS.find((a) => a.id === id)!;
const kase = (id: string) => structuredClone(CASES.find((c) => c.id === id)!);

describe("geographic scope", () => {
  it("covers by level", () => {
    const loc = { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" };
    expect(scopeCovers(adm("adm-central").scope, loc)).toBe(true);
    expect(scopeCovers(adm("adm-dist-chn").scope, loc)).toBe(true);
    expect(scopeCovers(adm("adm-dist-cbe").scope, loc)).toBe(false);
    expect(scopeCovers(adm("adm-ac-vel").scope, loc)).toBe(false);
    expect(scopeCovers(adm("adm-ward-13").scope, loc)).toBe(false);
    expect(scopeCovers(adm("adm-ward-12").scope, loc)).toBe(true);
  });
});

describe("roles and access", () => {
  it("fans can't use admin tools or messages", () => {
    expect(canAccessAdmin("fan").allowed).toBe(false);
    expect(canAccessMessages("fan").allowed).toBe(false);
    expect(canAccessMessages("ward").allowed).toBe(true);
  });
});

describe("moderation review rights", () => {
  it("Ward Admin can decide at ward level inside scope, but not after escalation", () => {
    const c = kase("case-1");
    expect(canDecideCase(adm("adm-ward-12"), c, BASE_TIME).allowed).toBe(true);
    expect(canDecideCase(adm("adm-ward-12"), c, BASE_TIME + 2 * HOUR).allowed).toBe(false);
  });
  it("Ward Admin can't touch another ward", () => {
    expect(canDecideCase(adm("adm-ward-13"), kase("case-1"), BASE_TIME).allowed).toBe(false);
  });
  it("District decides escalated items in its district only", () => {
    const c = kase("case-2");
    expect(canDecideCase(adm("adm-dist-chn"), c, BASE_TIME).allowed).toBe(true);
    expect(canDecideCase(adm("adm-dist-cbe"), c, BASE_TIME).allowed).toBe(false);
  });
  it("Central-level items are decided by Central only", () => {
    const c = kase("case-3");
    expect(canDecideCase(adm("adm-dist-chn"), c, BASE_TIME).allowed).toBe(false);
    expect(canDecideCase(adm("adm-central"), c, BASE_TIME).allowed).toBe(true);
  });
  it("a pending (inactive) admin has no privileges", () => {
    expect(canDecideCase(adm("adm-ward-14"), kase("case-1"), BASE_TIME).allowed).toBe(false);
  });
});

describe("appointments", () => {
  it("District nominates AC, AC nominates Ward, Central appoints District", () => {
    expect(canNominate(adm("adm-dist-chn"), "ac").allowed).toBe(true);
    expect(canNominate(adm("adm-dist-chn"), "ward").allowed).toBe(false);
    expect(canNominate(adm("adm-ac-myl"), "ward").allowed).toBe(true);
    expect(canNominate(adm("adm-ac-myl"), "ac").allowed).toBe(false);
    expect(canNominate(adm("adm-ward-12"), "ward").allowed).toBe(false);
    expect(canNominate(adm("adm-central"), "district").allowed).toBe(true);
  });
  it("only Central gives final approval", () => {
    const n = NOMINATIONS.find((x) => x.status === "nominated")!;
    expect(canDecideNomination(adm("adm-central"), n).allowed).toBe(true);
    expect(canDecideNomination(adm("adm-dist-chn"), n).allowed).toBe(false);
  });
  it("seed nominees awaiting approval are inactive", () => {
    expect(adm("adm-ac-tng").active).toBe(false);
    expect(adm("adm-ward-14").active).toBe(false);
  });
});

describe("verification review", () => {
  it("is scoped and only for submitted applications", () => {
    const harish = FANS.find((f) => f.id === "fan-harish")!;
    expect(canReviewVerification(adm("adm-ward-13"), harish).allowed).toBe(false); // Harish is in ward 12
    expect(canReviewVerification(adm("adm-ward-12"), harish).allowed).toBe(true);
    expect(canReviewVerification(adm("adm-ac-myl"), harish).allowed).toBe(true);
    expect(canReviewVerification(adm("adm-ac-myl"), FANS.find((f) => f.id === "fan-meera")!).allowed).toBe(false);
  });
  it("quizzes are published by District or Central", () => {
    expect(canPublishQuiz("ward").allowed).toBe(false);
    expect(canPublishQuiz("district").allowed).toBe(true);
  });
});
