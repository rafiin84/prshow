import type {
  AppNotification, Announcement, EventRSVP, FanProfile, GameMode, Loc, PREvent, Quiz, QuizAttempt, Reel, VerificationStatus, WelfareActivity,
  WelfareParticipation, GalleryAlbum, Movie, Badge, Reward,
} from "@/types";
import { BADGES } from "@/data/seeds/content";
import { hash } from "@/lib/utils";
import { quizPoints, journeyProgress } from "@/lib/rewards/rules";
import { ApiError, read, write } from "./client";
import { activeAdminsFor, addPoints, awardBadges, dayKey, fanById, getDB, now, notify, personName, pointsOf, pushAudit, uid, adminById } from "./db";

const needFan = (id: string): FanProfile => {
  const f = fanById(id);
  if (!f) throw new ApiError("Profile not found.", "not_found");
  return f;
};
const audienceMatch = (a: Announcement, loc?: Loc) => {
  if (a.status !== "published") return false;
  if (a.audience === "all") return true;
  if (!loc) return false;
  if (a.audience === "district") return a.districtId === loc.districtId;
  if (a.audience === "ac") return a.acId === loc.acId;
  return a.wardId === loc.wardId;
};

/* ============ Home ============ */
export function getHome(userId: string) {
  return read(() => {
    const d = getDB();
    const fan = needFan(userId);
    const t = now();
    const points = pointsOf(userId);
    const publicReels = d.reels.filter((r) => r.status === "approved" && r.published);
    const dk = dayKey(t);
    const doneToday = d.attempts.some((a) => a.userId === userId && a.quizId === "quiz-daily" && dayKey(a.completedAt) === dk);
    const myAttempts = d.attempts.filter((a) => a.userId === userId);
    return {
      fan, points, journey: journeyProgress(points),
      unread: d.notifications.filter((n) => n.userId === userId && !n.read).length,
      featuredMovie: d.movies.find((m) => m.id === "movie-dragon")!,
      announcements: d.announcements.filter((a) => audienceMatch(a, fan.loc)).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.publishedAt ?? 0) - (a.publishedAt ?? 0)),
      officialReels: publicReels.filter((r) => r.source === "official"),
      highlights: publicReels.filter((r) => r.source === "fan").slice(0, 4),
      posts: d.posts.filter((p) => p.status === "approved"),
      now: t,
      upcomingEvents: d.events.filter((e) => e.status === "published" && e.startsAt >= t).sort((a, b) => Number(b.loc.districtId === fan.loc.districtId) - Number(a.loc.districtId === fan.loc.districtId) || a.startsAt - b.startsAt).slice(0, 3).map((e) => ({ event: e, stats: eventStats(e), myRsvp: d.rsvps.find((r) => r.eventId === e.id && r.userId === userId && r.status !== "cancelled") })),
      daily: { done: doneToday, streak: streakOf(userId) },
      recentUnlocks: d.unlocked.filter((u) => u.userId === userId).map((u) => ({ ...u, reward: d.rewards.find((r) => r.id === u.rewardId)! })).slice(-2).reverse(),
      newBadges: d.earnedBadges.filter((b) => b.userId === userId).slice(-3).reverse().map((b) => BADGES.find((x) => x.id === b.badgeId)!).filter(Boolean),
      firstVisit: myAttempts.length === 0 && !d.rsvps.some((r) => r.userId === userId) && fan.verification !== "approved",
    };
  });
}

function streakOf(userId: string) {
  const d = getDB();
  const days = new Set(d.attempts.filter((a) => a.userId === userId).map((a) => dayKey(a.completedAt)));
  let streak = 0;
  let cursor = now();
  if (!days.has(dayKey(cursor))) cursor -= 86_400_000;
  while (days.has(dayKey(cursor))) { streak += 1; cursor -= 86_400_000; }
  return streak;
}

/* ============ Movies & gallery ============ */
export function listMovies(p: { q?: string; genre?: string; sort?: "year-desc" | "year-asc" | "title" } = {}) {
  return read(() => {
    let list = getDB().movies.filter((m) => m.status === "published");
    if (p.q) list = list.filter((m) => `${m.title} ${m.genres.join(" ")} ${m.role}`.toLowerCase().includes(p.q!.toLowerCase()));
    if (p.genre && p.genre !== "all") list = list.filter((m) => m.genres.includes(p.genre!));
    const sort = p.sort ?? "year-desc";
    return [...list].sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : sort === "year-asc" ? a.year - b.year : b.year - a.year));
  });
}
export function getMovie(id: string) {
  return read(() => {
    const m = getDB().movies.find((x) => x.id === id && x.status === "published");
    if (!m) throw new ApiError("We couldn't find that movie.", "not_found");
    return { movie: m, relatedAlbums: getDB().albums.filter((a) => a.status === "published").slice(0, 2), related: getDB().movies.filter((x) => x.id !== id && x.status === "published").slice(0, 3) };
  });
}
export function listAlbums() { return read(() => getDB().albums.filter((a) => a.status === "published")); }
export function getAlbum(id: string) {
  return read(() => {
    const a = getDB().albums.find((x) => x.id === id && x.status === "published");
    if (!a) throw new ApiError("We couldn't find that album.", "not_found");
    return a;
  });
}

/* ============ Reels ============ */
export function listPublicReels() { return read(() => getDB().reels.filter((r) => r.status === "approved" && r.published).sort((a, b) => b.createdAt - a.createdAt)); }
export function getReel(id: string, viewerId?: string) {
  return read(() => {
    const r = getDB().reels.find((x) => x.id === id);
    const isPublic = r && r.status === "approved" && r.published;
    const isOwner = r && viewerId && r.creatorId === viewerId;
    const isAdmin = viewerId ? !!adminById(viewerId) : false;
    if (!r || !(isPublic || isOwner || isAdmin)) throw new ApiError("This reel isn't available. It may still be in review.", "not_found");
    return r;
  });
}
export function toggleLike(userId: string, reelId: string) {
  return write(() => {
    const f = needFan(userId);
    const r = getDB().reels.find((x) => x.id === reelId);
    if (!r) throw new ApiError("Reel not found.", "not_found");
    const liked = f.likedIds.includes(reelId);
    f.likedIds = liked ? f.likedIds.filter((i) => i !== reelId) : [...f.likedIds, reelId];
    r.likes += liked ? -1 : 1;
    return { liked: !liked, likes: r.likes };
  });
}
export function toggleSave(userId: string, itemId: string) {
  return write(() => {
    const f = needFan(userId);
    const saved = f.savedIds.includes(itemId);
    f.savedIds = saved ? f.savedIds.filter((i) => i !== itemId) : [...f.savedIds, itemId];
    const r = getDB().reels.find((x) => x.id === itemId);
    if (r) r.saves += saved ? -1 : 1;
    return { saved: !saved };
  });
}
export function listSaved(userId: string) {
  return read(() => {
    const d = getDB();
    const f = needFan(userId);
    return {
      movies: d.movies.filter((m) => f.savedIds.includes(m.id)),
      reels: d.reels.filter((r) => f.savedIds.includes(r.id) && r.status === "approved" && r.published),
      assets: d.albums.flatMap((a) => a.assets.filter((x) => f.savedIds.includes(x.id)).map((x) => ({ ...x, albumTitle: a.title, albumId: a.id }))),
    };
  });
}
export function addComment(userId: string, reelId: string, body: string) {
  return write(() => {
    const text = body.trim();
    if (text.length < 2) throw new ApiError("Write a little more before posting.", "validation");
    const r = getDB().reels.find((x) => x.id === reelId);
    if (!r) throw new ApiError("Reel not found.", "not_found");
    r.comments.push({ id: uid("c"), author: personName(userId), body: text, at: now() });
    return r.comments;
  });
}
export const REPORT_REASONS = ["Harassment or hate", "Violence", "Sexual content", "Misinformation", "Privacy exposure", "Copyright concern", "Spam or resale", "Something else"] as const;
export function reportReel(userId: string, reelId: string, reason: string, details?: string) {
  return write(() => {
    const r = getDB().reels.find((x) => x.id === reelId);
    if (!r) throw new ApiError("Reel not found.", "not_found");
    const loc = r.loc ?? needFan(userId).loc;
    pushAudit({ actorId: userId, actorName: personName(userId), actorRole: "fan", action: "reported", subjectType: "reel", subjectId: reelId, summary: `Reported “${r.title}”: ${reason}.`, reason: details, districtId: loc.districtId });
    activeAdminsFor("ward", loc).forEach((a) => notify(a.id, "admin", "Fan report received", `“${r.title}” was reported: ${reason}.`, `/admin/reels`));
    return { ok: true };
  });
}

export interface ReelSubmissionInput { title: string; caption: string; category: string; mediaName: string; rights: boolean; guidelines: boolean }
function openCase(userId: string, reel: Reel) {
  const d = getDB();
  const fan = needFan(userId);
  const caseId = uid("case");
  const entry = pushAudit({ actorId: "system", actorName: "PR Show System", actorRole: "system", action: "submitted", subjectType: "case", subjectId: caseId, summary: `Submitted by ${fan.name}. Ward review window opened (1 hour).`, districtId: fan.loc.districtId });
  d.cases.unshift({ id: caseId, subjectType: "reel", subjectId: reel.id, title: reel.title, excerpt: reel.caption, submitterId: userId, submitterName: fan.name, loc: fan.loc, status: "pending_review", submittedAt: now(), viewedBy: [], history: [entry] });
  reel.caseId = caseId;
  reel.status = "pending_review";
  activeAdminsFor("ward", fan.loc).forEach((a) => notify(a.id, "admin", "New item in your queue", `“${reel.title}” was submitted. Review within 1 hour.`, `/admin/moderation/${caseId}`));
  notify(userId, "submission", "Your reel is in review", `“${reel.title}” is pending review. It stays private until approved.`, "/profile/submissions");
  return caseId;
}
export function submitReel(userId: string, input: ReelSubmissionInput, existingId?: string) {
  return write(() => {
    if (!input.rights || !input.guidelines) throw new ApiError("Confirm the rights and guidelines checkboxes to submit.", "validation");
    if (input.title.trim().length < 3) throw new ApiError("Add a title with at least 3 characters.", "validation");
    const d = getDB();
    const fan = needFan(userId);
    if (fan.verification !== "approved") throw new ApiError("Only approved members can submit reels.", "forbidden");
    let reel = existingId ? d.reels.find((r) => r.id === existingId) : undefined;
    if (!reel) {
      reel = { id: uid("reel"), title: input.title, caption: input.caption, category: input.category, source: "fan", creatorId: userId, creatorName: fan.name, status: "draft", durationSec: 20 + (hash(input.title) % 40), hue: hash(input.title) % 360, likes: 0, saves: 0, comments: [], loc: fan.loc, createdAt: now(), published: false, captionsAvailable: false };
      d.reels.unshift(reel);
    } else Object.assign(reel, { title: input.title, caption: input.caption, category: input.category });
    openCase(userId, reel);
    return reel;
  });
}
export function saveReelDraft(userId: string, input: Omit<ReelSubmissionInput, "rights" | "guidelines">) {
  return write(() => {
    const fan = needFan(userId);
    if (input.title.trim().length < 3) throw new ApiError("Add a title to save a draft.", "validation");
    const reel: Reel = { id: uid("reel"), title: input.title, caption: input.caption, category: input.category, source: "fan", creatorId: userId, creatorName: fan.name, status: "draft", durationSec: 24, hue: hash(input.title) % 360, likes: 0, saves: 0, comments: [], loc: fan.loc, createdAt: now(), published: false, captionsAvailable: false };
    getDB().reels.unshift(reel);
    return reel;
  });
}
export function mySubmissions(userId: string) {
  return read(() => {
    const d = getDB();
    return d.reels.filter((r) => r.creatorId === userId).map((r) => ({ reel: r, case: d.cases.find((c) => c.id === r.caseId) })).sort((a, b) => b.reel.createdAt - a.reel.createdAt);
  });
}

/* ============ Games ============ */
export function listPublishedQuizzes() { return read(() => getDB().quizzes.filter((q) => q.status === "published")); }
export function getQuiz(id: string, preview = false) {
  return read(() => {
    const q = getDB().quizzes.find((x) => x.id === id && (preview || x.status === "published"));
    if (!q) throw new ApiError("That quiz isn't available.", "not_found");
    return q;
  });
}
export function getGamesHome(userId: string) {
  return read(() => {
    const d = getDB();
    const mine = d.attempts.filter((a) => a.userId === userId);
    const dk = dayKey(now());
    const dailyDone = mine.some((a) => a.quizId === "quiz-daily" && dayKey(a.completedAt) === dk);
    const best = mine.reduce<QuizAttempt | undefined>((b, a) => (!b || a.score / a.total > b.score / b.total ? a : b), undefined);
    return {
      quizzes: d.quizzes.filter((q) => q.status === "published"), dailyDone, streak: streakOf(userId), points: pointsOf(userId), attempts: mine.length,
      best, recent: [...mine].sort((a, b) => b.completedAt - a.completedAt).slice(0, 3),
      quizPoints: mine.reduce((s, a) => s + a.points, 0),
    };
  });
}
export function submitAttempt(userId: string, quizId: string, answers: number[], durationSec: number) {
  return write(() => {
    const d = getDB();
    const quiz = d.quizzes.find((q) => q.id === quizId && q.status === "published");
    if (!quiz) throw new ApiError("That quiz isn't available.", "not_found");
    if (quizId === "quiz-daily" && d.attempts.some((a) => a.userId === userId && a.quizId === quizId && dayKey(a.completedAt) === dayKey(now()))) {
      throw new ApiError("You've already completed today's challenge. Use the demo control to reset it.", "conflict");
    }
    const score = quiz.questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const cfg = d.rewardConfig;
    const points = quizPoints(score, quiz.questions.length, cfg.pointsPerCorrect, cfg.perfectBonus);
    const attempt: QuizAttempt = { id: uid("att"), userId, quizId, quizTitle: quiz.title, mode: quiz.mode, answers, score, total: quiz.questions.length, points, completedAt: now(), durationSec };
    d.attempts.push(attempt);
    if (points > 0) addPoints(userId, points, `Quiz: ${quiz.title} (${score}/${quiz.questions.length})`, attempt.id);
    const newBadges = awardBadges(userId).map((id) => BADGES.find((b) => b.id === id)!).filter(Boolean);
    return { attempt, newBadges, totalPoints: pointsOf(userId) };
  });
}
export function getAttempt(id: string) {
  return read(() => {
    const a = getDB().attempts.find((x) => x.id === id);
    if (!a) throw new ApiError("Result not found.", "not_found");
    const quiz = getDB().quizzes.find((q) => q.id === a.quizId);
    const best = getDB().attempts.filter((x) => x.userId === a.userId && x.quizId === a.quizId).reduce((m, x) => Math.max(m, x.score), 0);
    return { attempt: a, quiz, personalBest: best, badges: BADGES.filter((b) => getDB().earnedBadges.some((e) => e.userId === a.userId && e.badgeId === b.id)) };
  });
}
export function listAttempts(userId: string) { return read(() => getDB().attempts.filter((a) => a.userId === userId).sort((a, b) => b.completedAt - a.completedAt)); }

export type LeaderboardPeriod = "week" | "month" | "all";
/** Individual ranking only. Based on quiz points from attempts so period filters stay honest. */
export function getLeaderboard(p: { period: LeaderboardPeriod; mode: GameMode | "all" }, userId: string) {
  return read(() => {
    const d = getDB();
    const t = now();
    const windowMs = p.period === "week" ? 7 * 86_400_000 : p.period === "month" ? 30 * 86_400_000 : Infinity;
    const totals = new Map<string, { points: number; quizzes: number }>();
    d.attempts.filter((a) => t - a.completedAt <= windowMs && (p.mode === "all" || a.mode === p.mode)).forEach((a) => {
      const cur = totals.get(a.userId) ?? { points: 0, quizzes: 0 };
      totals.set(a.userId, { points: cur.points + a.points, quizzes: cur.quizzes + 1 });
    });
    return [...totals.entries()].map(([id, v]) => ({ fan: fanById(id)!, ...v })).filter((r) => r.fan?.membership).sort((a, b) => b.points - a.points || a.fan.name.localeCompare(b.fan.name)).map((r, i) => ({ rank: i + 1, fanId: r.fan.id, name: r.fan.name, handle: r.fan.handle, hue: r.fan.hue, districtId: r.fan.loc.districtId, points: r.points, quizzes: r.quizzes, isMe: r.fan.id === userId }));
  });
}
export function resetDaily(userId: string) {
  return write(() => {
    const d = getDB();
    const dk = dayKey(now());
    const gone = d.attempts.filter((a) => a.userId === userId && a.quizId === "quiz-daily" && dayKey(a.completedAt) === dk);
    d.attempts = d.attempts.filter((a) => !gone.includes(a));
    d.points = d.points.filter((p) => !gone.some((g) => g.id === p.ref));
    return { cleared: gone.length };
  });
}

/* ============ Rewards & profile ============ */
export function getRewards(userId: string) {
  return read(() => {
    const d = getDB();
    const points = pointsOf(userId);
    const earned = new Set(d.earnedBadges.filter((b) => b.userId === userId).map((b) => b.badgeId));
    const unlocked = new Set(d.unlocked.filter((u) => u.userId === userId).map((u) => u.rewardId));
    return {
      points, journey: journeyProgress(points),
      badges: BADGES.map((b: Badge) => ({ ...b, earned: earned.has(b.id), at: d.earnedBadges.find((e) => e.userId === userId && e.badgeId === b.id)?.at })),
      rewards: d.rewards.map((r: Reward) => ({ ...r, unlocked: unlocked.has(r.id), eligible: points >= r.pointsRequired, remaining: Math.max(0, r.pointsRequired - points) })),
      ledger: d.points.filter((p) => p.userId === userId).sort((a, b) => b.at - a.at),
    };
  });
}
export function unlockReward(userId: string, rewardId: string) {
  return write(() => {
    const d = getDB();
    const r = d.rewards.find((x) => x.id === rewardId);
    if (!r) throw new ApiError("Reward not found.", "not_found");
    if (pointsOf(userId) < r.pointsRequired) throw new ApiError(`You need ${r.pointsRequired - pointsOf(userId)} more points to unlock this.`, "forbidden");
    if (d.unlocked.some((u) => u.userId === userId && u.rewardId === rewardId)) throw new ApiError("Already unlocked.", "conflict");
    d.unlocked.push({ userId, rewardId, at: now() });
    notify(userId, "reward", `${r.name} unlocked`, r.kind === "wallpaper" ? "Preview and save it from Rewards." : "Simulated demo reward — not redeemable.", "/profile/rewards");
    return r;
  });
}
export function getProfile(userId: string) {
  return read(() => {
    const d = getDB();
    const fan = needFan(userId);
    const t = now();
    const points = pointsOf(userId);
    const passes = d.rsvps.filter((r) => r.userId === userId && (r.status === "confirmed" || r.status === "checked_in")).map((r) => ({ rsvp: r, event: d.events.find((e) => e.id === r.eventId)! })).filter((x) => x.event);
    return {
      fan, points, journey: journeyProgress(points),
      badgeCount: d.earnedBadges.filter((b) => b.userId === userId).length, rewardCount: d.unlocked.filter((u) => u.userId === userId).length,
      passes: passes.filter((p) => p.event.endsAt >= t), attended: passes.filter((p) => p.rsvp.status === "checked_in").length,
      submissionCount: d.reels.filter((r) => r.creatorId === userId).length, savedCount: fan.savedIds.length, quizCount: d.attempts.filter((a) => a.userId === userId).length,
    };
  });
}
export function updateProfile(userId: string, patch: { name: string; handle: string; bio: string }) {
  return write(() => {
    const f = needFan(userId);
    if (patch.name.trim().length < 2) throw new ApiError("Name must be at least 2 characters.", "validation");
    if (getDB().fans.some((x) => x.id !== userId && x.handle.toLowerCase() === patch.handle.toLowerCase())) throw new ApiError("That handle is taken.", "conflict");
    Object.assign(f, { name: patch.name.trim(), handle: patch.handle.trim(), bio: patch.bio.trim() });
    return f;
  });
}
export function updatePrefs(userId: string, prefs: Partial<FanProfile["prefs"]>) {
  return write(() => { const f = needFan(userId); f.prefs = { ...f.prefs, ...prefs }; return f.prefs; });
}

/* ============ Notifications ============ */
export function listNotifications(userId: string): Promise<AppNotification[]> {
  return read(() => getDB().notifications.filter((n) => n.userId === userId).sort((a, b) => b.at - a.at));
}
export function markNotificationRead(id: string) { return write(() => { const n = getDB().notifications.find((x) => x.id === id); if (n) n.read = true; return true; }); }
export function markAllNotificationsRead(userId: string) { return write(() => { getDB().notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); return true; }); }

/* ============ Events ============ */
const active = (r: EventRSVP) => r.status !== "cancelled";
export function eventStats(e: PREvent) {
  const rs = getDB().rsvps.filter((r) => r.eventId === e.id);
  const confirmed = rs.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;
  return { confirmed, waitlisted: rs.filter((r) => r.status === "waitlisted").length, checkedIn: rs.filter((r) => r.status === "checked_in").length, full: confirmed >= e.capacity, seatsLeft: Math.max(0, e.capacity - confirmed) };
}
export function listEvents(userId: string, p: { q?: string; category?: string; when?: "upcoming" | "past"; districtId?: string } = {}) {
  return read(() => {
    const t = now();
    let list = getDB().events.filter((e) => e.status === "published");
    const when = p.when ?? "upcoming";
    list = list.filter((e) => (when === "upcoming" ? e.endsAt >= t : e.endsAt < t));
    if (p.q) list = list.filter((e) => `${e.title} ${e.venue} ${e.summary}`.toLowerCase().includes(p.q!.toLowerCase()));
    if (p.category && p.category !== "all") list = list.filter((e) => e.category === p.category);
    if (p.districtId && p.districtId !== "all") list = list.filter((e) => e.loc.districtId === p.districtId);
    list = list.sort((a, b) => (when === "upcoming" ? a.startsAt - b.startsAt : b.startsAt - a.startsAt));
    return list.map((e) => ({ event: e, stats: eventStats(e), myRsvp: getDB().rsvps.find((r) => r.eventId === e.id && r.userId === userId && active(r)) }));
  });
}
export function getEvent(id: string, userId: string) {
  return read(() => {
    const e = getDB().events.find((x) => x.id === id && x.status !== "draft");
    if (!e) throw new ApiError("We couldn't find that event.", "not_found");
    const fan = needFan(userId);
    const my = getDB().rsvps.find((r) => r.eventId === id && r.userId === userId && active(r));
    const position = my?.status === "waitlisted" ? getDB().rsvps.filter((r) => r.eventId === id && r.status === "waitlisted").sort((a, b) => a.at - b.at).findIndex((r) => r.id === my.id) + 1 : 0;
    return { event: e, stats: eventStats(e), myRsvp: my, waitlistPosition: position, canRsvp: !e.requiresMembership || fan.verification === "approved", ended: e.endsAt < now() };
  });
}
export function rsvp(userId: string, eventId: string) {
  return write(() => {
    const d = getDB();
    const e = d.events.find((x) => x.id === eventId && x.status === "published");
    const fan = needFan(userId);
    if (!e) throw new ApiError("This event isn't open for RSVP.", "not_found");
    if (e.endsAt < now()) throw new ApiError("This event has ended.", "validation");
    if (e.requiresMembership && fan.verification !== "approved") throw new ApiError("This event is for approved members. Complete verification first.", "forbidden");
    if (d.rsvps.some((r) => r.eventId === eventId && r.userId === userId && active(r))) throw new ApiError("You already have an RSVP for this event.", "conflict");
    const status = eventStats(e).full ? "waitlisted" : "confirmed";
    const r: EventRSVP = { id: uid("rsvp"), eventId, userId, status, at: now() };
    d.rsvps.push(r);
    if (status === "confirmed" && !d.points.some((p) => p.userId === userId && p.ref === `rsvp:${eventId}`)) addPoints(userId, d.rewardConfig.rsvpPoints, `Event RSVP: ${e.title}`, `rsvp:${eventId}`);
    awardBadges(userId);
    notify(userId, "event", status === "confirmed" ? `You're in: ${e.title}` : `Waitlisted: ${e.title}`, status === "confirmed" ? "Your event pass is ready." : "We'll notify you if a seat opens up.", `/events/${eventId}`);
    return r;
  });
}
export function cancelRsvp(userId: string, eventId: string) {
  return write(() => {
    const d = getDB();
    const r = d.rsvps.find((x) => x.eventId === eventId && x.userId === userId && active(x));
    if (!r) throw new ApiError("No active RSVP found.", "not_found");
    if (r.status === "checked_in") throw new ApiError("You've already checked in, so this RSVP can't be cancelled.", "conflict");
    const wasConfirmed = r.status === "confirmed";
    r.status = "cancelled";
    const e = d.events.find((x) => x.id === eventId)!;
    if (wasConfirmed) {
      const next = d.rsvps.filter((x) => x.eventId === eventId && x.status === "waitlisted").sort((a, b) => a.at - b.at)[0];
      if (next) { next.status = "confirmed"; notify(next.userId, "event", `A seat opened: ${e.title}`, "You've moved off the waitlist. Your pass is ready.", `/events/${eventId}`); }
    }
    return true;
  });
}
export function myEvents(userId: string) {
  return read(() => {
    const d = getDB();
    const t = now();
    const mine = d.rsvps.filter((r) => r.userId === userId && active(r)).map((r) => ({ rsvp: r, event: d.events.find((e) => e.id === r.eventId)! })).filter((x) => x.event);
    return { upcoming: mine.filter((x) => x.event.endsAt >= t).sort((a, b) => a.event.startsAt - b.event.startsAt), past: mine.filter((x) => x.event.endsAt < t), attended: mine.filter((x) => x.rsvp.status === "checked_in").length };
  });
}
export function getPass(eventId: string, userId: string) {
  return read(() => {
    const e = getDB().events.find((x) => x.id === eventId);
    const r = getDB().rsvps.find((x) => x.eventId === eventId && x.userId === userId && (x.status === "confirmed" || x.status === "checked_in"));
    if (!e || !r) throw new ApiError("You need a confirmed RSVP to see the pass.", "forbidden");
    // Opaque token. Contains no personal data.
    return { event: e, rsvp: r, token: `PRS-PASS-${hash(eventId + userId).toString(36).toUpperCase()}`, holder: needFan(userId).name };
  });
}

/* ============ Welfare ============ */
export function listWelfare(userId: string) {
  return read(() => getDB().welfare.filter((w) => w.status !== "draft").map((w) => ({ activity: w, mine: getDB().participations.find((p) => p.activityId === w.id && p.userId === userId), count: getDB().participations.filter((p) => p.activityId === w.id && p.status !== "declined").length })));
}
export function getWelfare(id: string, userId: string) {
  return read(() => {
    const w = getDB().welfare.find((x) => x.id === id && x.status !== "draft");
    if (!w) throw new ApiError("We couldn't find that activity.", "not_found");
    return { activity: w, mine: getDB().participations.find((p) => p.activityId === id && p.userId === userId), count: getDB().participations.filter((p) => p.activityId === id && p.status !== "declined").length, fan: needFan(userId) };
  });
}
export function registerWelfare(userId: string, activityId: string, ack: boolean) {
  return write(() => {
    const d = getDB();
    const w = d.welfare.find((x) => x.id === activityId);
    const fan = needFan(userId);
    if (!w || w.status !== "published") throw new ApiError("This activity isn't open for registration.", "not_found");
    if (!ack) throw new ApiError("Please acknowledge the participation guidelines.", "validation");
    if (fan.verification !== "approved") throw new ApiError("Participation is open to approved members.", "forbidden");
    if (d.participations.some((p) => p.activityId === activityId && p.userId === userId && p.status !== "declined")) throw new ApiError("You're already registered.", "conflict");
    const p: WelfareParticipation = { id: uid("part"), activityId, userId, status: "registered", at: now() };
    d.participations.push(p);
    awardBadges(userId);
    notify(userId, "event", `Registered: ${w.title}`, "Your Ward Admin will confirm your participation.", `/events/welfare/${activityId}`);
    activeAdminsFor("ward", fan.loc).forEach((a) => notify(a.id, "admin", "New welfare registration", `${fan.name} registered for ${w.title}.`, "/admin/events"));
    return p;
  });
}

/* ============ Onboarding & verification (demo only) ============ */
export const DEMO_OTP = "123456";
export function startApplicant(input: { name: string; phone: string }) {
  return write(() => {
    const f = needFan("fan-new");
    f.name = input.name.trim();
    f.phoneMasked = "+91 ••••• •" + input.phone.slice(-4);
    f.verification = "in_progress";
    f.membership = undefined;
    return f;
  });
}
export function verifyOtp(code: string) {
  return write(() => {
    if (code !== DEMO_OTP) throw new ApiError("That code isn't right. In this demo, use 123456.", "validation");
    return true;
  });
}
export function setApplicantLocation(userId: string, loc: Loc) {
  return write(() => { const f = needFan(userId); f.loc = loc; return f; });
}
export function submitVerification(userId: string, flags: { secureQr: boolean; liveness: boolean }) {
  return write(() => {
    const d = getDB();
    const f = needFan(userId);
    if (!flags.secureQr || !flags.liveness) throw new ApiError("Complete both demo steps first.", "validation");
    f.verification = "pending_review";
    f.verificationNote = undefined;
    d.verifications = d.verifications.filter((v) => v.fanId !== userId);
    const ev = pushAudit({ actorId: userId, actorName: f.name, actorRole: "fan", action: "submitted", subjectType: "verification", subjectId: `ver-${userId}`, summary: "Submitted demo verification.", districtId: f.loc.districtId });
    d.verifications.push({ id: `ver-${userId}`, fanId: userId, status: "pending_review", submittedAt: now(), secureQrDone: true, livenessSimDone: true, history: [ev] });
    activeAdminsFor("ward", f.loc).forEach((a) => notify(a.id, "admin", "Verification awaiting review", `${f.name} submitted membership verification.`, `/admin/members/${userId}`));
    notify(userId, "verification", "Verification submitted", "A moderator will review it. Membership is not active until approved.", "/join/status");
    return f;
  });
}
export function getVerificationStatus(userId: string) {
  return read(() => {
    const f = needFan(userId);
    const v = getDB().verifications.find((x) => x.fanId === userId);
    return { fan: f, submission: v, status: f.verification as VerificationStatus };
  });
}

export type { Quiz, WelfareActivity, Movie, GalleryAlbum };

export function unreadNotificationCount(userId: string) { return read(() => getDB().notifications.filter((n) => n.userId === userId && !n.read).length); }

/** Simulated verification sub-steps (no camera, no real QR/identity service). Goes through the mock API so latency/failures apply. */
export function simulateVerificationStep(kind: "secure_qr" | "liveness") {
  return write(() => ({ kind, ok: true as const }));
}
export function getIdentity(userId: string) {
  return read(() => {
    const f = fanById(userId);
    const a = adminById(userId);
    const p = f ?? a;
    if (!p) throw new ApiError("Profile not found.", "not_found");
    return { id: p.id, name: p.name, hue: p.hue };
  });
}

export function getEngagement(userId: string) {
  return read(() => { const f = needFan(userId); return { likedIds: f.likedIds, savedIds: f.savedIds, verification: f.verification }; });
}
/** Simulated upload: the file itself is never read or stored. Exists so latency/failure injection applies. */
export function simulateUpload(name: string) { return write(() => ({ name, ok: true as const })); }
