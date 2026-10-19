import type { Badge } from "@/types";

export interface BadgeFacts {
  quizAttempts: number;
  perfectAttempts: number;
  verified: boolean;
  confirmedRsvps: number;
  welfareRegistrations: number;
  approvedReels: number;
}

/** Badge id -> predicate. Badges recognise genuine participation, never raw clicks. */
export const BADGE_RULES: Record<string, (f: BadgeFacts) => boolean> = {
  "b-first-quiz": (f) => f.quizAttempts >= 1,
  "b-perfect": (f) => f.perfectAttempts >= 1,
  "b-three-quizzes": (f) => f.quizAttempts >= 3,
  "b-verified": (f) => f.verified,
  "b-event": (f) => f.confirmedRsvps >= 1,
  "b-welfare": (f) => f.welfareRegistrations >= 1,
  "b-creator": (f) => f.approvedReels >= 1,
};

export function earnedBadgeIds(facts: BadgeFacts, badges: Badge[]): string[] {
  return badges.filter((b) => BADGE_RULES[b.id]?.(facts)).map((b) => b.id);
}

export function quizPoints(score: number, total: number, perCorrect: number, perfectBonus: number) {
  return score * perCorrect + (total > 0 && score === total ? perfectBonus : 0);
}

export const JOURNEY_TIERS = [
  { name: "Newcomer", min: 0 }, { name: "Regular", min: 100 }, { name: "Insider", min: 250 }, { name: "Front Row", min: 450 }, { name: "Legend", min: 700 },
];
export function journeyProgress(points: number) {
  let idx = 0;
  JOURNEY_TIERS.forEach((t, i) => { if (points >= t.min) idx = i; });
  const cur = JOURNEY_TIERS[idx];
  const next = JOURNEY_TIERS[idx + 1];
  return { tier: cur.name, next: next?.name, pct: next ? Math.round(((points - cur.min) / (next.min - cur.min)) * 100) : 100, toNext: next ? next.min - points : 0 };
}
