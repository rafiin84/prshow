import { describe, expect, it } from "vitest";
import { eventSchema, nominationSchema, profileSchema, reelSchema, signupSchema, otpSchema } from "@/lib/validation";
import { generateDraftQuestions, validateQuiz } from "@/lib/quiz-generator";

describe("forms", () => {
  it("signup requires a valid phone, adult confirmation and consent", () => {
    expect(signupSchema.safeParse({ name: "Meera S", phone: "9876543210", adult: true, consent: true }).success).toBe(true);
    expect(signupSchema.safeParse({ name: "M", phone: "12345", adult: false, consent: false }).success).toBe(false);
  });
  it("otp is 6 digits", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ code: "12ab56" }).success).toBe(false);
  });
  it("profile handle rules", () => {
    expect(profileSchema.safeParse({ name: "Meera", handle: "meera.s", bio: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "Meera", handle: "no spaces!", bio: "" }).success).toBe(false);
  });
  it("reel submission needs rights and guidelines acknowledged", () => {
    const base = { title: "My reel", caption: "", category: "Fan edit" };
    expect(reelSchema.safeParse({ ...base, rights: true, guidelines: true }).success).toBe(true);
    expect(reelSchema.safeParse({ ...base, rights: false, guidelines: true }).success).toBe(false);
  });
  it("event end must be after start", () => {
    const e = { title: "Meet-up", category: "meetup", summary: "A quick one", purpose: "To meet people nearby for fun.", date: "2026-11-01", start: "18:00", end: "17:00", venue: "Hall", districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12", capacity: 10, eligibility: "Members", accessibility: "Step-free", requiresMembership: true };
    expect(eventSchema.safeParse(e).success).toBe(false);
    expect(eventSchema.safeParse({ ...e, end: "20:00" }).success).toBe(true);
  });
  it("nomination requires a rationale", () => {
    expect(nominationSchema.safeParse({ nomineeName: "Gokul Anand", contact: "9876543210", districtId: "chennai", rationale: "short" }).success).toBe(false);
  });
});

describe("quiz generation + validation", () => {
  it("is deterministic and valid", () => {
    const a = generateDraftQuestions({ subject: "movie-love-today", difficulty: "easy", count: 5, tone: "playful" });
    const b = generateDraftQuestions({ subject: "movie-love-today", difficulty: "easy", count: 5, tone: "playful" });
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(validateQuiz({ title: "T", questions: a })).toEqual([]);
  });
  it("flags missing text, duplicate options and bad answers", () => {
    const [q] = generateDraftQuestions({ subject: "movie-dragon", difficulty: "easy", count: 1, tone: "classic" });
    const bad = { ...q, prompt: " ", options: ["a", "a", "b", "c"], correctIndex: 9 };
    const fields = validateQuiz({ title: "T", questions: [bad] }).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(["prompt", "options", "correctIndex"]));
  });
});
