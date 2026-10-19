import type {
  AdminConversation, AdminMessage, AdminProfile, Announcement, AppNotification, AuditEvent, ContentModerationCase, EventRSVP, FanProfile,
  GalleryAlbum, Movie, Nomination, PREvent, PointsLedgerEntry, Quiz, QuizAttempt, Reel, Reward, RewardConfig, UnlockedReward,
  VerificationSubmission, WelfareActivity, WelfareParticipation, AIQuizGenerationJob, Role, Loc,
} from "@/types";
import { ADMINS, FANS } from "@/data/seeds/people";
import { ALBUMS, BADGES, MOVIES, QUIZZES, REELS, REWARDS, REWARD_CONFIG } from "@/data/seeds/content";
import {
  ANNOUNCEMENTS, ATTEMPTS, CASES, CONVERSATIONS, EARNED_BADGES, EVENTS, MESSAGES, NOMINATIONS, NOTIFICATIONS, PARTICIPATIONS, POINTS,
  RSVPS, SEED_AUDIT, UNLOCKED, VERIFICATIONS, WELFARE, audit as mkAudit,
} from "@/data/seeds/ops";
import { BASE_TIME, DAY } from "@/data/seeds/time";
import { applyEscalations } from "@/lib/moderation/workflow";
import { analyseText } from "@/lib/moderation/guardian";
import { earnedBadgeIds, type BadgeFacts } from "@/lib/rewards/rules";
import { hash } from "@/lib/utils";
import { scopeCovers } from "@/lib/permissions/policy";

export interface FanPost { id: string; authorName: string; authorId: string; body: string; status: "approved" | "pending_review"; at: number; hue: number }
export interface DB {
  fans: FanProfile[]; admins: AdminProfile[]; movies: Movie[]; albums: GalleryAlbum[]; reels: Reel[]; posts: FanPost[];
  quizzes: Quiz[]; attempts: QuizAttempt[]; points: PointsLedgerEntry[]; earnedBadges: { userId: string; badgeId: string; at: number }[];
  unlocked: UnlockedReward[]; rewards: Reward[]; rewardConfig: RewardConfig; events: PREvent[]; rsvps: EventRSVP[]; welfare: WelfareActivity[];
  participations: WelfareParticipation[]; announcements: Announcement[]; notifications: AppNotification[]; cases: ContentModerationCase[];
  nominations: Nomination[]; conversations: AdminConversation[]; messages: AdminMessage[]; verifications: VerificationSubmission[];
  audit: AuditEvent[]; jobs: AIQuizGenerationJob[]; clockOffset: number; counter: number; memberCounter: number;
}

const STORAGE_KEY = "prshow.demo.db.v7"; // demo data only — never identity documents or biometrics

function extraAttempts(): QuizAttempt[] {
  const published = QUIZZES.filter((q) => q.status === "published" && q.mode !== "onboarding");
  const out: QuizAttempt[] = [];
  FANS.filter((f) => f.membership && f.id !== "fan-meera").forEach((f) => {
    const n = 2 + (hash(f.id) % 3);
    for (let i = 0; i < n; i++) {
      const quiz = published[(hash(f.id) + i) % published.length];
      const total = quiz.questions.length;
      const score = Math.max(1, total - ((hash(f.id + i) % 3)));
      const daysAgo = (hash(f.id + "d" + i) % 55) + 1;
      out.push({ id: `att-${f.id}-${i}`, userId: f.id, quizId: quiz.id, quizTitle: quiz.title, mode: quiz.mode, answers: quiz.questions.map((q) => q.correctIndex), score, total, points: score * 10 + (score === total ? 20 : 0), completedAt: BASE_TIME - daysAgo * DAY, durationSec: 30 + (hash(f.id + i) % 60) });
    }
  });
  return out;
}

function createDB(): DB {
  const clone = <T,>(x: T): T => structuredClone(x);
  const cases = clone(CASES).map((c) => ({ ...c }));
  const db: DB = {
    fans: clone(FANS), admins: clone(ADMINS), movies: clone(MOVIES), albums: clone(ALBUMS), reels: clone(REELS),
    posts: [
      { id: "post-2", authorId: "fan-divya", authorName: "Divya Lakshmi", body: "Queue energy at the last screening was unreal. Looking forward to the next one with everyone.", status: "approved", at: BASE_TIME - 30 * 3_600_000, hue: 40 },
      { id: "post-3", authorId: "fan-janani", authorName: "Janani Murugan", body: "Played my veena cover for the Srirangam group today. Thank you for the kind words!", status: "approved", at: BASE_TIME - 52 * 3_600_000, hue: 300 },
      { id: "post-1", authorId: "fan-nisha", authorName: "Nisha Rahman", body: "Anyone from Abiramapuram travelling together to the meet-up? Happy to share a cab, my number is 98xxxxxx21.", status: "pending_review", at: BASE_TIME - 5 * 60_000, hue: 320 },
    ],
    quizzes: clone(QUIZZES), attempts: [...clone(ATTEMPTS), ...extraAttempts()], points: clone(POINTS), earnedBadges: clone(EARNED_BADGES), unlocked: clone(UNLOCKED),
    rewards: clone(REWARDS), rewardConfig: { ...REWARD_CONFIG }, events: clone(EVENTS), rsvps: clone(RSVPS), welfare: clone(WELFARE), participations: clone(PARTICIPATIONS),
    announcements: clone(ANNOUNCEMENTS), notifications: clone(NOTIFICATIONS), cases, nominations: clone(NOMINATIONS), conversations: clone(CONVERSATIONS),
    messages: clone(MESSAGES), verifications: clone(VERIFICATIONS), audit: clone(SEED_AUDIT), jobs: [], clockOffset: 0, counter: 100, memberCounter: 10900,
  };
  // Pre-run the mock guardian on the two most escalated cases so the Guardian screen is populated.
  ["case-2", "case-3"].forEach((id) => {
    const c = db.cases.find((x) => x.id === id);
    if (c) c.guardian = analyseText(c.id, `${c.title}. ${c.excerpt}`, BASE_TIME - 15 * 60_000);
  });
  return db;
}

let db: DB | null = null;

export function getDB(): DB {
  if (db) return db;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) { db = JSON.parse(raw) as DB; return db; }
    } catch { /* storage unavailable: fall through to seed */ }
  }
  db = createDB();
  return db;
}

export function persist() {
  if (typeof window === "undefined" || !db) return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* ignore quota/private mode */ }
}

export function resetDB() {
  db = createDB();
  persist();
}

/* ---------- clock ---------- */
export const now = () => BASE_TIME + getDB().clockOffset;
export function uid(prefix: string) {
  const d = getDB();
  d.counter += 1;
  return `${prefix}-${d.counter}`;
}
/** IST calendar-day key from a timestamp. */
export const dayKey = (ts: number) => new Date(ts + 5.5 * 3_600_000).toISOString().slice(0, 10);

/* ---------- people ---------- */
export const fanById = (id: string) => getDB().fans.find((f) => f.id === id);
export const adminById = (id: string) => getDB().admins.find((a) => a.id === id);
export function personName(id: string) { return fanById(id)?.name ?? adminById(id)?.name ?? "Unknown"; }
export function roleOf(id: string): Role { return adminById(id)?.role ?? "fan"; }

export function activeAdminsFor(level: "district" | "central" | "ward", loc: Loc) {
  return getDB().admins.filter((a) => {
    if (!a.active) return false;
    if (level === "central") return a.role === "central";
    if (level === "district") return a.role === "district" && a.scope.districtId === loc.districtId;
    return a.role === "ward" && a.scope.wardId === loc.wardId;
  });
}

/* ---------- audit + notifications ---------- */
export function pushAudit(e: Omit<AuditEvent, "id" | "at"> & { at?: number }): AuditEvent {
  const ev = mkAudit({ at: e.at ?? now(), ...e });
  getDB().audit.unshift(ev);
  return ev;
}
export function notify(userId: string, category: AppNotification["category"], title: string, body: string, href: string) {
  getDB().notifications.unshift({ id: uid("n"), userId, category, title, body, at: now(), read: false, href });
}

/* ---------- points, badges ---------- */
export const pointsOf = (userId: string) => getDB().points.filter((p) => p.userId === userId).reduce((s, p) => s + p.delta, 0);
export function addPoints(userId: string, delta: number, reason: string, ref?: string) {
  getDB().points.unshift({ id: uid("pt"), userId, delta, reason, at: now(), ref });
}
export function badgeFacts(userId: string): BadgeFacts {
  const d = getDB();
  const mine = d.attempts.filter((a) => a.userId === userId);
  return {
    quizAttempts: mine.length,
    perfectAttempts: mine.filter((a) => a.score === a.total && a.total > 0).length,
    verified: fanById(userId)?.verification === "approved",
    confirmedRsvps: d.rsvps.filter((r) => r.userId === userId && (r.status === "confirmed" || r.status === "checked_in")).length,
    welfareRegistrations: d.participations.filter((p) => p.userId === userId).length,
    approvedReels: d.reels.filter((r) => r.creatorId === userId && r.status === "approved").length,
  };
}
/** Award any newly-earned badges; returns the new badge ids. */
export function awardBadges(userId: string): string[] {
  const d = getDB();
  const earned = new Set(d.earnedBadges.filter((b) => b.userId === userId).map((b) => b.badgeId));
  const fresh = earnedBadgeIds(badgeFacts(userId), BADGES).filter((id) => !earned.has(id));
  fresh.forEach((badgeId) => {
    d.earnedBadges.push({ userId, badgeId, at: now() });
    const badge = BADGES.find((b) => b.id === badgeId);
    notify(userId, "reward", `Badge earned: ${badge?.name ?? badgeId}`, badge?.description ?? "", "/profile/rewards");
  });
  return fresh;
}

/* ---------- moderation clock ---------- */
const LEVEL_LABEL = { district: "District Admin", central: "Central Admin" } as const;
/** Materialise escalations that are due at the current demo time. Safe to call repeatedly. */
export function syncEscalations() {
  const d = getDB();
  const t = now();
  d.cases = d.cases.map((c) => {
    const res = applyEscalations(c, t);
    if (res.events.length === 0 && res.case.status === c.status) return c;
    let next = res.case;
    res.events.forEach((ev) => {
      const entry = mkAudit({
        at: ev.at, actorId: "system", actorName: "PR Show System", actorRole: "system", action: "escalated", subjectType: "case", subjectId: c.id,
        summary: ev.to === "district" ? "No decision within 1 hour. Escalated to District Admin." : "District window (2 hours) elapsed. Escalated to Central Admin.", districtId: c.loc.districtId,
      });
      d.audit.unshift(entry);
      next = { ...next, history: [...next.history, entry] };
      activeAdminsFor(ev.to, c.loc).forEach((a) => notify(a.id, "admin", `Escalated to you: ${c.title}`, `${LEVEL_LABEL[ev.to]} decision needed.`, `/admin/moderation/${c.id}`));
      d.messages.push({ id: uid("msg"), conversationId: "conv-3", fromId: "system", fromName: "PR Show System", body: `Case ${c.id} (${c.title}) was escalated to ${LEVEL_LABEL[ev.to]}.`, at: ev.at, status: "delivered", readBy: [] });
    });
    const reel = d.reels.find((r) => r.id === c.subjectId);
    if (reel && next.status === "escalated") reel.status = "escalated";
    else if (reel && next.status === "pending_review") reel.status = "pending_review";
    return next;
  });
}

/* ---------- scope selectors shared by queues, dashboard and detail views ---------- */
export function scopedCases(admin: AdminProfile) { return getDB().cases.filter((c) => scopeCovers(admin.scope, c.loc)); }
export function scopedFans(admin: AdminProfile) { return getDB().fans.filter((f) => f.verification !== "not_started" && f.verification !== "in_progress" && scopeCovers(admin.scope, f.loc)); }
export function scopedEvents(admin: AdminProfile) { return getDB().events.filter((e) => scopeCovers(admin.scope, e.loc)); }
export function scopedWelfare(admin: AdminProfile) { return getDB().welfare.filter((w) => scopeCovers(admin.scope, w.loc)); }
