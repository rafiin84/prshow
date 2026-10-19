import { beforeEach, describe, expect, it } from "vitest";
import { admin, fan } from "@/lib/api";
import { resetDB, getDB } from "@/lib/api/db";
import { useDemoStore } from "@/stores/demo";
import { MIN, HOUR } from "@/data/seeds/time";

beforeEach(() => { resetDB(); useDemoStore.setState({ failAll: false, failNext: 0, latency: "fast" }); });

describe("fan journeys", () => {
  it("unapproved reels never appear in the public feed", async () => {
    const feed = await fan.listPublicReels();
    expect(feed.every((r) => r.status === "approved" && r.published)).toBe(true);
    expect(feed.find((r) => r.id === "reel-r6")).toBeUndefined();
    await expect(fan.getReel("reel-r6", "fan-arjun")).rejects.toThrow();
  });

  it("submitted reel is private, then public only after approval, with points", async () => {
    const before = (await fan.getProfile("fan-meera")).points;
    const reel = await fan.submitReel("fan-meera", { title: "My ward walk", caption: "A walk", category: "Fan edit", mediaName: "x.mp4", rights: true, guidelines: true });
    expect((await fan.listPublicReels()).some((r) => r.id === reel.id)).toBe(false);
    const c = getDB().cases.find((x) => x.subjectId === reel.id)!;
    expect(c.status).toBe("pending_review");
    await admin.decideCase("adm-ward-12", c.id, "approved", "");
    expect((await fan.listPublicReels()).some((r) => r.id === reel.id)).toBe(true);
    expect((await fan.getProfile("fan-meera")).points).toBe(before + 40);
  });

  it("requires rights + guidelines to submit", async () => {
    await expect(fan.submitReel("fan-meera", { title: "Nope", caption: "", category: "Fan edit", mediaName: "x", rights: false, guidelines: true })).rejects.toThrow();
  });

  it("quiz scoring awards points and badges consistently", async () => {
    const quiz = await fan.getQuiz("quiz-trivia-films");
    const r = await fan.submitAttempt("fan-nisha", quiz.id, quiz.questions.map((q) => q.correctIndex), 40);
    expect(r.attempt.score).toBe(5);
    expect(r.attempt.points).toBe(5 * 10 + 20);
    expect(r.newBadges.map((b) => b.id)).toContain("b-perfect");
    const hist = await fan.listAttempts("fan-nisha");
    expect(hist.find((a) => a.id === r.attempt.id)).toBeTruthy();
  });

  it("daily challenge can be played once a day and reset with the demo control", async () => {
    const quiz = await fan.getQuiz("quiz-daily");
    await fan.submitAttempt("fan-meera", quiz.id, [2, 0, 0], 20);
    await expect(fan.submitAttempt("fan-meera", quiz.id, [2, 0, 0], 20)).rejects.toThrow(/already completed/);
    await fan.resetDaily("fan-meera");
    await expect(fan.submitAttempt("fan-meera", quiz.id, [2, 0, 0], 20)).resolves.toBeTruthy();
  });

  it("leaderboard is individual-only", async () => {
    const rows = await fan.getLeaderboard({ period: "all", mode: "all" }, "fan-meera");
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.every((r) => typeof r.fanId === "string" && !("teamId" in r))).toBe(true);
  });

  it("RSVP fills capacity, then waitlists, and cancellation promotes", async () => {
    const r = await fan.rsvp("fan-meera", "evt-meetup"); // capacity 4 is already full in the seed
    expect(r.status).toBe("waitlisted");
    await fan.cancelRsvp("fan-arjun", "evt-meetup");
    const mine = getDB().rsvps.find((x) => x.userId === "fan-sanjay" && x.eventId === "evt-meetup")!;
    expect(mine.status).toBe("confirmed"); // earliest waitlisted (Sanjay) is promoted first
  });

  it("unverified fans can't RSVP to member events", async () => {
    await expect(fan.rsvp("fan-harish", "evt-screening")).rejects.toThrow(/approved members/);
  });

  it("event pass uses an opaque token with no personal data", async () => {
    const p = await fan.getPass("evt-screening", "fan-meera");
    expect(p.token).toMatch(/^PRS-PASS-[A-Z0-9]+$/);
    expect(p.token.toLowerCase()).not.toContain("meera");
  });

  it("verification stays pending until an admin approves, then issues a membership", async () => {
    await fan.startApplicant({ name: "Test Person", phone: "9876543210" });
    await fan.setApplicantLocation("fan-new", { districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-12" });
    await fan.submitVerification("fan-new", { secureQr: true, liveness: true });
    let f = getDB().fans.find((x) => x.id === "fan-new")!;
    expect(f.verification).toBe("pending_review");
    expect(f.membership).toBeUndefined();
    await expect(admin.decideVerification("adm-ward-13", "fan-new", "approved", "")).rejects.toThrow(/scope/);
    await admin.decideVerification("adm-ward-12", "fan-new", "approved", "");
    f = getDB().fans.find((x) => x.id === "fan-new")!;
    expect(f.verification).toBe("approved");
    expect(f.membership?.memberNo).toMatch(/^PRS-26-\d{5}$/);
  });
});

describe("admin journeys", () => {
  it("advancing the demo clock escalates Ward → District → Central", async () => {
    expect(getDB().cases.find((c) => c.id === "case-1")!.status).toBe("pending_review");
    await admin.advanceClock(41 * MIN); // case-1 was submitted 20 min before base
    let c = (await admin.getCase("adm-dist-chn", "case-1")).case;
    expect(c.status).toBe("escalated");
    expect(c.escalatedToDistrictAt).toBeDefined();
    await admin.advanceClock(2 * HOUR);
    c = (await admin.getCase("adm-central", "case-1")).case;
    expect(c.escalatedToCentralAt).toBeDefined();
  });

  it("viewing a case doesn't stop escalation; deciding does", async () => {
    await admin.markCaseViewed("adm-ward-12", "case-1");
    await admin.advanceClock(HOUR);
    expect((await admin.getCase("adm-ward-12", "case-1")).case.status).toBe("escalated");
    resetDB();
    await admin.decideCase("adm-ward-12", "case-1", "rejected", "Not following guidelines.");
    await admin.advanceClock(5 * HOUR);
    const c = (await admin.getCase("adm-ward-12", "case-1")).case;
    expect(c.status).toBe("rejected");
    expect(c.escalatedToDistrictAt).toBeUndefined();
  });

  it("rejection requires a reason; out-of-level decisions are refused", async () => {
    await expect(admin.decideCase("adm-ward-12", "case-1", "rejected", "no")).rejects.toThrow(/reason/);
    await expect(admin.decideCase("adm-ward-12", "case-2", "approved", "")).rejects.toThrow(/currently with/);
  });

  it("AI Guardian never changes a case's status", async () => {
    const before = getDB().cases.find((c) => c.id === "case-1")!.status;
    const g = await admin.runGuardian("adm-ward-12", "case-1");
    expect(g.recommended).toBeTruthy();
    expect(getDB().cases.find((c) => c.id === "case-1")!.status).toBe(before);
    expect(getDB().reels.find((r) => r.id === "reel-r6")!.published).toBe(false);
  });

  it("Guardian flags the privacy-exposure case", async () => {
    const g = await admin.runGuardian("adm-central", "case-3");
    expect(g.flags.map((f) => f.category)).toContain("privacy");
    expect(g.recommended).toBe("needs_correction");
  });

  it("nominations: pending nominees have no privileges until Central approves", async () => {
    const n = await admin.createNomination("adm-dist-chn", { nomineeName: "Test Nominee", contact: "9876543210", targetRole: "ac", districtId: "chennai", acId: "velachery", rationale: "Reliable organiser with local experience." });
    expect(n.status).toBe("nominated");
    const nominee = () => getDB().admins.find((a) => a.name === "Test Nominee")!;
    expect(nominee().active).toBe(false);
    await expect(admin.decideNomination("adm-dist-chn", n.id, "approved", "")).rejects.toThrow(/Central/);
    await admin.decideNomination("adm-central", n.id, "approved", "");
    expect(nominee().active).toBe(true);
  });

  it("District can't nominate a Ward Admin; AC nominations stay in scope", async () => {
    await expect(admin.createNomination("adm-dist-chn", { nomineeName: "X Person", contact: "9876543210", targetRole: "ward", districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-14", rationale: "Long enough rationale text." })).rejects.toThrow();
    await expect(admin.createNomination("adm-ac-myl", { nomineeName: "X Person", contact: "9876543210", targetRole: "ward", districtId: "chennai", acId: "velachery", wardId: "w-velachery-22", rationale: "Long enough rationale text." })).rejects.toThrow(/scope/);
  });

  it("dashboard numbers come from the same data as the queue", async () => {
    const home = await admin.getAdminHome("adm-ward-12");
    const open = await admin.listCases("adm-ward-12", { view: "open" });
    expect(home.metrics.queue.value).toBe(open.length);
    const mine = await admin.listCases("adm-ward-12", { view: "mine" });
    expect(home.metrics.mine.value).toBe(mine.length);
    const central = await admin.getAdminHome("adm-central");
    expect(central.metrics.queue.value).toBeGreaterThan(home.metrics.queue.value);
  });

  it("messages are scoped to participants and system notices are read-only", async () => {
    await expect(admin.getConversation("adm-ward-12", "conv-5")).rejects.toThrow(/access/);
    await expect(admin.sendMessage("adm-ward-12", "conv-3", "hello")).rejects.toThrow(/read-only/);
    const m = await admin.sendMessage("adm-ward-12", "conv-1", "On it.");
    expect(m.status).toBe("delivered");
    await expect(admin.sendMessage("adm-ward-12", "conv-1", "id 123456789012")).rejects.toThrow(/identity/);
  });

  it("quiz publish needs explicit approval and valid content", async () => {
    const q = await admin.generateQuiz("adm-central", { subject: "movie-dragon", difficulty: "easy", count: 4, tone: "classic" });
    expect(q.status).toBe("draft");
    await expect(admin.publishQuiz("adm-central", q.id, false)).rejects.toThrow(/reviewed/);
    await expect(admin.publishQuiz("adm-ward-12", q.id, true)).rejects.toThrow(/District or Central/);
    expect((await admin.publishQuiz("adm-central", q.id, true)).status).toBe("published");
    expect((await fan.listPublishedQuizzes()).some((x) => x.id === q.id)).toBe(true);
  });

  it("announcements create notifications for members in the audience only", async () => {
    const a = await admin.saveAnnouncement("adm-dist-chn", { title: "Chennai volunteers", body: "Volunteers needed for the weekend drive in Chennai.", audience: "district", districtId: "chennai", hue: 10, schedule: false }, true);
    expect(a.status).toBe("published");
    const chennai = (await fan.listNotifications("fan-meera")).some((n) => n.title === "Chennai volunteers");
    const cbe = (await fan.listNotifications("fan-sanjay")).some((n) => n.title === "Chennai volunteers");
    expect(chennai).toBe(true);
    expect(cbe).toBe(false);
  });

  it("mock API can be forced to fail and recovers on retry", async () => {
    useDemoStore.getState().armFailNext(1);
    await expect(fan.listPublicReels()).rejects.toThrow(/simulated failure/);
    await expect(fan.listPublicReels()).resolves.toBeTruthy();
  });

  it("reset restores the seed", async () => {
    await admin.advanceClock(5 * HOUR);
    resetDB();
    expect(getDB().clockOffset).toBe(0);
  });
});
