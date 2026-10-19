import type {
  AdminConversation, AdminMessage, AdminProfile, Announcement, AIQuizGenerationJob, ContentModerationCase, GalleryAlbum, Loc, ModerationDecision,
  Nomination, PREvent, Quiz, QuizQuestion, ReviewLevel, VerificationStatus, WelfareActivity, RewardConfig, Difficulty,
} from "@/types";
import { hash } from "@/lib/utils";
import { analyseText } from "@/lib/moderation/guardian";
import { canTransition, currentDeadline, reviewLevel, isOpen } from "@/lib/moderation/workflow";
import {
  canDecideCase, canDecideNomination, canEditRewards, canEscalateCase, canManageEvent, canManageGlobalContent, canNominate, canPublishAnnouncement,
  canPublishQuiz, canReviewVerification, canViewNomination, scopeCovers,
} from "@/lib/permissions/policy";
import { generateDraftQuestions, validateQuiz, type GenerationInput } from "@/lib/quiz-generator";
import { ApiError, read, write } from "./client";
import {
  activeAdminsFor, addPoints, adminById, awardBadges, fanById, getDB, now, notify, personName, pushAudit, scopedCases, scopedEvents, scopedFans, scopedWelfare, uid,
} from "./db";
import { eventStats } from "./fan";
import { BASE_TIME } from "@/data/seeds/time";

export const needAdmin = (id: string): AdminProfile => {
  const a = adminById(id);
  if (!a) throw new ApiError("Admin profile not found.", "not_found");
  return a;
};
const guard = (p: { allowed: boolean; reason?: string }) => { if (!p.allowed) throw new ApiError(p.reason ?? "You don't have permission for this action.", "forbidden"); };
const levelOfRole = (role: AdminProfile["role"]): ReviewLevel | null => (role === "ward" || role === "ac" ? "ward" : role === "district" ? "district" : "central");

/* ============ Dashboard (every metric is derived from the same selectors as queues & detail pages) ============ */
export function getAdminHome(adminId: string, rangeDays = 7) {
  return read(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const t = now();
    const cases = scopedCases(admin);
    const open = cases.filter(isOpen);
    const myLevel = levelOfRole(admin.role);
    const mine = open.filter((c) => reviewLevel(c, t) === myLevel);
    const overdue = open.filter((c) => { const dl = currentDeadline(c, t); return dl !== undefined && t > dl; });
    const fans = scopedFans(admin);
    const pendingVer = fans.filter((f) => f.verification === "pending_review" || f.verification === "submitted");
    const events = scopedEvents(admin).filter((e) => e.status === "published" && e.endsAt >= t);
    const rsvpCount = events.reduce((s, e) => s + eventStats(e).confirmed, 0);
    const noms = d.nominations.filter((n) => canViewNomination(admin, n));
    const awaitingNoms = noms.filter((n) => n.status === "nominated");
    const since = t - rangeDays * 86_400_000;
    const scopedAudit = d.audit.filter((a) => a.at >= since && (admin.role === "central" || !a.districtId || a.districtId === admin.scope.districtId));
    return {
      admin, rangeDays, now: t,
      metrics: {
        queue: { value: open.length, label: "Open moderation items", explain: "Fan submissions in your scope that have no decision yet." },
        mine: { value: mine.length, label: myLevel === "ward" ? "Awaiting your review" : `Escalated to ${myLevel}`, explain: "Open items currently owned by your review level." },
        overdue: { value: overdue.length, label: "Past their window", explain: "Open items that have passed their review deadline and will escalate (or already did)." },
        verification: { value: pendingVer.length, label: "Verifications to review", explain: "Members in your scope with a submitted demo verification awaiting a decision." },
        members: { value: fans.filter((f) => f.verification === "approved").length, label: "Approved members", explain: "Members with an approved membership inside your scope." },
        events: { value: events.length, label: "Upcoming events", explain: "Published events in your scope that haven't ended." },
        rsvps: { value: rsvpCount, label: "Confirmed RSVPs", explain: "Confirmed seats across those upcoming events (waitlist excluded)." },
        nominations: { value: awaitingNoms.length, label: admin.role === "central" ? "Awaiting your approval" : "Nominations pending", explain: "Appointment nominations awaiting Central's final decision." },
      },
      urgent: [...mine].sort((a, b) => (currentDeadline(a, t) ?? Infinity) - (currentDeadline(b, t) ?? Infinity)).slice(0, 4),
      pendingVerifications: pendingVer.slice(0, 3),
      upcomingEvents: events.sort((a, b) => a.startsAt - b.startsAt).slice(0, 3).map((e) => ({ event: e, stats: eventStats(e) })),
      awaitingNoms: awaitingNoms.slice(0, 3),
      announcements: d.announcements.filter((a) => a.status === "published" && (admin.role === "central" || a.audience === "all" || a.districtId === admin.scope.districtId)).slice(0, 3),
      activity: scopedAudit.slice(0, 8),
      unreadMessages: unreadFor(adminId),
    };
  });
}

/* ============ Moderation ============ */
export function listCases(adminId: string, p: { view?: "open" | "mine" | "decided" | "all"; q?: string } = {}) {
  return read(() => {
    const admin = needAdmin(adminId);
    const t = now();
    let list = scopedCases(admin);
    const view = p.view ?? "open";
    if (view === "open") list = list.filter(isOpen);
    if (view === "mine") list = list.filter((c) => isOpen(c) && reviewLevel(c, t) === levelOfRole(admin.role));
    if (view === "decided") list = list.filter((c) => !isOpen(c));
    if (p.q) list = list.filter((c) => `${c.title} ${c.submitterName} ${c.excerpt}`.toLowerCase().includes(p.q!.toLowerCase()));
    return list.sort((a, b) => (currentDeadline(a, t) ?? Infinity) - (currentDeadline(b, t) ?? Infinity) || b.submittedAt - a.submittedAt);
  });
}
export function getCase(adminId: string, caseId: string) {
  return read(() => {
    const admin = needAdmin(adminId);
    const c = getDB().cases.find((x) => x.id === caseId);
    if (!c || !scopeCovers(admin.scope, c.loc)) throw new ApiError("This item isn't available in your scope.", "not_found");
    const reel = getDB().reels.find((r) => r.id === c.subjectId);
    return { case: c, reel, admin };
  });
}
/** Viewing records who looked — it never pauses or resets any escalation timer. */
export function markCaseViewed(adminId: string, caseId: string) {
  return write(() => {
    const c = getDB().cases.find((x) => x.id === caseId);
    if (c && !c.viewedBy.some((v) => v.id === adminId)) c.viewedBy.push({ id: adminId, at: now() });
    return true;
  });
}
export function decideCase(adminId: string, caseId: string, outcome: ModerationDecision["outcome"], reason: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) throw new ApiError("Item not found.", "not_found");
    guard(canDecideCase(admin, c, now()));
    if (outcome !== "approved" && reason.trim().length < 8) throw new ApiError("Add a reason of at least 8 characters.", "validation");
    if (!canTransition(c.status, outcome)) throw new ApiError("That status change isn't allowed.", "conflict");
    const decision: ModerationDecision = { id: uid("dec"), outcome, reason: reason.trim() || "Meets the community guidelines.", byId: admin.id, byName: admin.name, byRole: admin.role, at: now() };
    const ev = pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: outcome, subjectType: "case", subjectId: c.id, summary: `${outcome === "approved" ? "Approved" : outcome === "rejected" ? "Rejected" : "Requested correction on"} “${c.title}”.`, reason: decision.reason, districtId: c.loc.districtId });
    c.status = outcome;
    c.decision = decision;
    c.history.push(ev);
    const reel = d.reels.find((r) => r.id === c.subjectId);
    if (reel) {
      reel.status = outcome;
      reel.published = outcome === "approved";
      reel.reviewNote = outcome === "approved" ? undefined : decision.reason;
      if (outcome === "approved" && !d.points.some((p) => p.ref === `reel:${reel.id}`)) { addPoints(reel.creatorId, d.rewardConfig.reelApprovedPoints, `Reel approved: ${reel.title}`, `reel:${reel.id}`); awardBadges(reel.creatorId); }
    }
    const post = d.posts.find((p) => p.id === c.subjectId);
    if (post) { if (outcome === "approved") post.status = "approved"; else d.posts = d.posts.filter((p) => p.id !== post.id); }
    notify(c.submitterId, "submission", outcome === "approved" ? `Approved: ${c.title}` : outcome === "rejected" ? `Not approved: ${c.title}` : `Changes requested: ${c.title}`, outcome === "approved" ? "It's now visible to the community." : decision.reason, "/profile/submissions");
    return c;
  });
}
export function escalateCase(adminId: string, caseId: string, reason: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const c = d.cases.find((x) => x.id === caseId);
    if (!c) throw new ApiError("Item not found.", "not_found");
    guard(canEscalateCase(admin, c, now()));
    if (reason.trim().length < 8) throw new ApiError("Add a reason of at least 8 characters.", "validation");
    const level = reviewLevel(c, now());
    const to = level === "ward" ? "district" : "central";
    if (to === "district") c.escalatedToDistrictAt = now(); else c.escalatedToCentralAt = now();
    c.status = "escalated";
    const reel = d.reels.find((r) => r.id === c.subjectId);
    if (reel) reel.status = "escalated";
    c.history.push(pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "escalated", subjectType: "case", subjectId: c.id, summary: `Manually escalated to ${to === "district" ? "District" : "Central"} Admin.`, reason: reason.trim(), districtId: c.loc.districtId }));
    activeAdminsFor(to, c.loc).forEach((a) => notify(a.id, "admin", `Escalated to you: ${c.title}`, reason.trim(), `/admin/moderation/${c.id}`));
    return c;
  });
}
export function advanceClock(ms: number) { return write(() => { getDB().clockOffset += ms; return now(); }); }
export function getClock() { return read(() => ({ now: now(), offsetMs: getDB().clockOffset, base: BASE_TIME })); }

/* ============ AI Content Guardian (mock) ============ */
export function runGuardian(adminId: string, caseId: string) {
  return write(() => {
    needAdmin(adminId);
    const c = getDB().cases.find((x) => x.id === caseId);
    if (!c) throw new ApiError("Item not found.", "not_found");
    c.guardian = analyseText(c.id, `${c.title}. ${c.excerpt}`, now());
    pushAudit({ actorId: "ai", actorName: "AI Content Guardian (mock)", actorRole: "ai", action: "analysed", subjectType: "case", subjectId: c.id, summary: "Mock analysis produced a suggestion. Human decision required.", districtId: c.loc.districtId });
    return c.guardian;
  });
}
export function respondGuardian(adminId: string, caseId: string, action: "accepted" | "overridden" | "dismissed", reason: string) {
  return write(() => {
    const admin = needAdmin(adminId);
    const c = getDB().cases.find((x) => x.id === caseId);
    if (!c?.guardian) throw new ApiError("Run the analysis first.", "validation");
    if (reason.trim().length < 5) throw new ApiError("Add a short reason for the record.", "validation");
    c.guardian.adminResponse = { action, reason: reason.trim(), byId: admin.id, at: now() };
    c.history.push(pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: `ai_${action}`, subjectType: "case", subjectId: c.id, summary: `${admin.name} ${action} the AI suggestion (${c.guardian.recommended}).`, reason: reason.trim(), districtId: c.loc.districtId }));
    return c.guardian;
  });
}

/* ============ Members & verification ============ */
export function listMembers(adminId: string, p: { q?: string; status?: VerificationStatus | "all"; districtId?: string } = {}) {
  return read(() => {
    const admin = needAdmin(adminId);
    let list = scopedFans(admin);
    if (p.q) list = list.filter((f) => `${f.name} ${f.handle} ${f.membership?.memberNo ?? ""}`.toLowerCase().includes(p.q!.toLowerCase()));
    if (p.status && p.status !== "all") list = list.filter((f) => f.verification === p.status);
    if (p.districtId && p.districtId !== "all") list = list.filter((f) => f.loc.districtId === p.districtId);
    return list;
  });
}
export function getMember(adminId: string, fanId: string) {
  return read(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const f = fanById(fanId);
    if (!f || !scopeCovers(admin.scope, f.loc)) throw new ApiError("This member isn't in your scope.", "not_found");
    return {
      fan: f, admin, submission: d.verifications.find((v) => v.fanId === fanId),
      participation: { rsvps: d.rsvps.filter((r) => r.userId === fanId && r.status !== "cancelled").length, checkedIn: d.rsvps.filter((r) => r.userId === fanId && r.status === "checked_in").length, welfare: d.participations.filter((p) => p.userId === fanId).length, quizzes: d.attempts.filter((a) => a.userId === fanId).length, reels: d.reels.filter((r) => r.creatorId === fanId).length },
      events: d.audit.filter((a) => a.subjectId === fanId || a.subjectId === `ver-${fanId}` || a.actorId === fanId).slice(0, 8),
      policy: canReviewVerification(admin, f),
    };
  });
}
export function decideVerification(adminId: string, fanId: string, outcome: "approved" | "rejected" | "needs_correction", reason: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const f = fanById(fanId);
    if (!f) throw new ApiError("Member not found.", "not_found");
    guard(canReviewVerification(admin, f));
    if (outcome !== "approved" && reason.trim().length < 8) throw new ApiError("Add a reason of at least 8 characters.", "validation");
    f.verification = outcome;
    f.verificationNote = outcome === "approved" ? undefined : reason.trim();
    if (outcome === "approved") {
      d.memberCounter += 1;
      f.membership = { memberNo: `PRS-26-${String(d.memberCounter).padStart(5, "0")}`, status: "active", issuedAt: now(), qrToken: `tk_${hash(fanId + d.memberCounter).toString(36)}` };
      addPoints(fanId, 50, "Welcome bonus");
      awardBadges(fanId);
    }
    const sub = d.verifications.find((v) => v.fanId === fanId);
    const ev = pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: outcome, subjectType: "verification", subjectId: `ver-${fanId}`, summary: `Membership verification ${outcome === "approved" ? "approved" : outcome === "rejected" ? "rejected" : "needs correction"} for ${f.name}.`, reason: reason.trim() || undefined, districtId: f.loc.districtId });
    if (sub) { sub.status = outcome; sub.reviewerNote = reason.trim() || undefined; sub.history.push(ev); }
    notify(fanId, "verification", outcome === "approved" ? "Membership approved" : outcome === "rejected" ? "Verification not approved" : "Verification needs correction", outcome === "approved" ? "Your digital membership card is ready." : reason.trim(), outcome === "approved" ? "/profile/membership" : "/join/status");
    return f;
  });
}

/* ============ Appointments ============ */
export function listAdmins(adminId: string) {
  return read(() => {
    const admin = needAdmin(adminId);
    return getDB().admins.filter((a) => admin.role === "central" || (a.scope.districtId === admin.scope.districtId && (admin.role === "district" || (admin.role === "ac" ? a.scope.acId === admin.scope.acId || a.role === "district" : a.scope.wardId === admin.scope.wardId || a.id === admin.id))));
  });
}
export function listNominations(adminId: string) {
  return read(() => { const admin = needAdmin(adminId); return getDB().nominations.filter((n) => canViewNomination(admin, n)).sort((a, b) => b.updatedAt - a.updatedAt); });
}
export interface NominationInput { nomineeName: string; contact: string; targetRole: "district" | "ac" | "ward"; districtId: string; acId?: string; wardId?: string; rationale: string }
export function createNomination(adminId: string, input: NominationInput) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    guard(canNominate(admin, input.targetRole));
    if (input.nomineeName.trim().length < 3 || input.rationale.trim().length < 15) throw new ApiError("Add the nominee's name and a rationale of at least 15 characters.", "validation");
    const scope = { level: input.targetRole, districtId: input.districtId, acId: input.acId, wardId: input.wardId } as Nomination["scope"];
    if (!scopeCovers(admin.scope, { districtId: input.districtId, acId: input.acId, wardId: input.wardId })) throw new ApiError("That scope is outside your own scope.", "forbidden");
    if (input.targetRole === "ac" && !input.acId) throw new ApiError("Choose an AC.", "validation");
    if (input.targetRole === "ward" && (!input.acId || !input.wardId)) throw new ApiError("Choose an AC and ward.", "validation");
    if (d.nominations.some((n) => n.status === "nominated" && n.scope.level === scope.level && n.scope.districtId === scope.districtId && n.scope.acId === scope.acId && n.scope.wardId === scope.wardId)) throw new ApiError("A nomination for this scope is already pending.", "conflict");
    const direct = admin.role === "central"; // Central appoints District Admins directly
    const id = uid("nom");
    const ev = pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: direct ? "approved" : "nominated", subjectType: "nomination", subjectId: id, summary: `${direct ? "Appointed" : "Nominated"} ${input.nomineeName} as ${input.targetRole.toUpperCase()} Admin.`, districtId: input.districtId });
    const nomination: Nomination = { id, nomineeName: input.nomineeName.trim(), nomineeContact: "+91 ••••• •" + input.contact.slice(-4), targetRole: input.targetRole, scope, nominatedById: admin.id, nominatedByRole: admin.role, status: direct ? "approved" : "nominated", rationale: input.rationale.trim(), createdAt: now(), updatedAt: now(), history: [ev], decidedBy: direct ? admin.name : undefined };
    d.nominations.unshift(nomination);
    d.admins.push({ id: `adm-${id}`, name: input.nomineeName.trim(), role: input.targetRole, hue: hash(input.nomineeName) % 360, scope, active: direct, title: direct ? `District Admin · ${input.districtId}` : `${input.targetRole.toUpperCase()} Admin nominee` });
    if (!direct) activeAdminsFor("central", { districtId: input.districtId, acId: "", wardId: "" }).forEach((a) => notify(a.id, "admin", "Nomination awaiting final approval", `${input.nomineeName} (${input.targetRole.toUpperCase()} Admin).`, "/admin/appointments"));
    return nomination;
  });
}
export function decideNomination(adminId: string, nomId: string, outcome: "approved" | "rejected" | "needs_correction", reason: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const n = d.nominations.find((x) => x.id === nomId);
    if (!n) throw new ApiError("Nomination not found.", "not_found");
    guard(canDecideNomination(admin, n));
    if (outcome !== "approved" && reason.trim().length < 8) throw new ApiError("Add a reason of at least 8 characters.", "validation");
    n.status = outcome;
    n.decisionReason = reason.trim() || "Approved.";
    n.decidedBy = admin.name;
    n.updatedAt = now();
    n.history.push(pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: outcome, subjectType: "nomination", subjectId: n.id, summary: outcome === "approved" ? `Approved ${n.nomineeName}. Admin privileges activated.` : `${outcome === "rejected" ? "Rejected" : "Requested correction for"} ${n.nomineeName}.`, reason: n.decisionReason, districtId: n.scope.districtId }));
    const nominee = d.admins.find((a) => a.scope.level === n.targetRole && a.name === n.nomineeName);
    if (nominee && outcome === "approved") { nominee.active = true; nominee.title = nominee.title.replace(" nominee", ""); }
    notify(n.nominatedById, "admin", `Nomination ${outcome === "approved" ? "approved" : outcome === "rejected" ? "rejected" : "needs correction"}: ${n.nomineeName}`, n.decisionReason, "/admin/appointments");
    return n;
  });
}
export function resubmitNomination(adminId: string, nomId: string, rationale: string) {
  return write(() => {
    const admin = needAdmin(adminId);
    const n = getDB().nominations.find((x) => x.id === nomId);
    if (!n || n.nominatedById !== admin.id) throw new ApiError("Only the nominating admin can resubmit.", "forbidden");
    if (n.status !== "needs_correction") throw new ApiError("This nomination doesn't need correction.", "conflict");
    if (rationale.trim().length < 15) throw new ApiError("Add a rationale of at least 15 characters.", "validation");
    n.rationale = rationale.trim(); n.status = "nominated"; n.updatedAt = now();
    n.history.push(pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "resubmitted", subjectType: "nomination", subjectId: n.id, summary: `Resubmitted nomination for ${n.nomineeName}.`, districtId: n.scope.districtId }));
    return n;
  });
}

/* ============ Announcements & notifications ============ */
export function listAnnouncements(adminId: string) {
  return read(() => {
    const admin = needAdmin(adminId);
    return getDB().announcements.filter((a) => admin.role === "central" || a.authorId === admin.id || a.audience === "all" || a.districtId === admin.scope.districtId).sort((a, b) => b.createdAt - a.createdAt);
  });
}
export interface AnnouncementInput { id?: string; title: string; body: string; audience: Announcement["audience"]; districtId?: string; acId?: string; wardId?: string; hue: number; schedule: boolean }
function fansInAudience(a: Pick<Announcement, "audience" | "districtId" | "acId" | "wardId">) {
  return getDB().fans.filter((f) => f.verification === "approved" && (a.audience === "all" || (a.audience === "district" && f.loc.districtId === a.districtId) || (a.audience === "ac" && f.loc.acId === a.acId) || (a.audience === "ward" && f.loc.wardId === a.wardId)));
}
export function saveAnnouncement(adminId: string, input: AnnouncementInput, publish: boolean) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    guard(canPublishAnnouncement(admin));
    if (input.title.trim().length < 4 || input.body.trim().length < 20) throw new ApiError("Add a title and a message of at least 20 characters.", "validation");
    if (input.audience === "all" && admin.role !== "central") throw new ApiError("Only Central Admin can announce to everyone.", "forbidden");
    if (input.audience !== "all" && !scopeCovers(admin.scope, { districtId: input.districtId, acId: input.acId, wardId: input.wardId })) throw new ApiError("That audience is outside your scope.", "forbidden");
    let a = input.id ? d.announcements.find((x) => x.id === input.id) : undefined;
    if (a && a.status === "published") throw new ApiError("Published announcements can only be archived.", "conflict");
    if (!a) { a = { id: uid("ann"), title: "", body: "", audience: input.audience, hue: input.hue, status: "draft", authorId: admin.id, authorName: admin.name, createdAt: now() }; d.announcements.unshift(a); }
    Object.assign(a, { title: input.title.trim(), body: input.body.trim(), audience: input.audience, districtId: input.districtId, acId: input.acId, wardId: input.wardId, hue: input.hue });
    if (!publish) { a.status = input.schedule ? "scheduled" : "draft"; return a; }
    a.status = "published"; a.publishedAt = now();
    const targets = fansInAudience(a);
    targets.forEach((f) => notify(f.id, "official", a!.title, a!.body.slice(0, 90), "/"));
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "published", subjectType: "announcement", subjectId: a.id, summary: `Published “${a.title}” to ${targets.length} members.`, districtId: admin.scope.districtId });
    return a;
  });
}
export function archiveAnnouncement(adminId: string, id: string) {
  return write(() => {
    const admin = needAdmin(adminId);
    const a = getDB().announcements.find((x) => x.id === id);
    if (!a) throw new ApiError("Announcement not found.", "not_found");
    a.status = "archived";
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "archived", subjectType: "announcement", subjectId: id, summary: `Archived “${a.title}”.`, districtId: admin.scope.districtId });
    return a;
  });
}
export function listSentNotifications(adminId: string) {
  return read(() => {
    const admin = needAdmin(adminId);
    return getDB().audit.filter((a) => ((a.action === "published" && a.subjectType === "announcement") || a.action === "broadcast") && (admin.role === "central" || a.districtId === admin.scope.districtId || a.actorId === admin.id));
  });
}
/** Direct notification broadcast to approved members in scope. Audience is validated against the sender's scope. */
export function broadcastNotification(adminId: string, input: { title: string; body: string; audience: Announcement["audience"]; districtId?: string; acId?: string; wardId?: string }) {
  return write(() => {
    const admin = needAdmin(adminId);
    guard(canPublishAnnouncement(admin));
    if (input.title.trim().length < 4 || input.body.trim().length < 10) throw new ApiError("Add a title and a message of at least 10 characters.", "validation");
    if (input.audience === "all" && admin.role !== "central") throw new ApiError("Only Central Admin can notify everyone.", "forbidden");
    if (input.audience !== "all" && !scopeCovers(admin.scope, { districtId: input.districtId, acId: input.acId, wardId: input.wardId })) throw new ApiError("That audience is outside your scope.", "forbidden");
    const targets = fansInAudience(input);
    targets.forEach((f) => notify(f.id, "official", input.title.trim(), input.body.trim().slice(0, 90), "/"));
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "broadcast", subjectType: "notification", subjectId: uid("bc"), summary: `Sent “${input.title.trim()}” to ${targets.length} members.`, districtId: input.districtId ?? admin.scope.districtId });
    return { delivered: targets.length };
  });
}
export function getAdminProfile(adminId: string) { return read(() => needAdmin(adminId)); }
export function checkInByToken(adminId: string, eventId: string, token: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const e = d.events.find((x) => x.id === eventId); if (!e) throw new ApiError("Event not found.", "not_found");
    guard(canManageEvent(admin, e.loc));
    const r = d.rsvps.find((x) => x.eventId === eventId && `PRS-PASS-${hash(eventId + x.userId).toString(36).toUpperCase()}` === token.trim().toUpperCase());
    if (!r) throw new ApiError("No pass with that token for this event.", "not_found");
    if (r.status === "checked_in") throw new ApiError(`${personName(r.userId)} is already checked in.`, "conflict");
    if (r.status !== "confirmed") throw new ApiError(`${personName(r.userId)} isn't confirmed (status: ${r.status}).`, "conflict");
    r.status = "checked_in"; r.checkedInAt = now();
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "checked_in", subjectType: "event", subjectId: e.id, summary: `QR check-in: ${personName(r.userId)} at “${e.title}”.`, districtId: e.loc.districtId });
    return { name: personName(r.userId) };
  });
}
export function passTokenFor(eventId: string, userId: string) { return `PRS-PASS-${hash(eventId + userId).toString(36).toUpperCase()}`; }


/* ============ PR content management ============ */
export function adminListContent() { return read(() => ({ movies: getDB().movies, albums: getDB().albums })); }
export function setMovieStatus(adminId: string, id: string, status: "published" | "draft") {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    const m = getDB().movies.find((x) => x.id === id); if (!m) throw new ApiError("Movie not found.", "not_found");
    m.status = status;
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: status === "published" ? "published" : "unpublished", subjectType: "movie", subjectId: id, summary: `${status === "published" ? "Published" : "Unpublished"} “${m.title}”.` });
    return m;
  });
}
export function updateMovieMeta(adminId: string, id: string, patch: { synopsis: string; verified: boolean }) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    const m = getDB().movies.find((x) => x.id === id); if (!m) throw new ApiError("Movie not found.", "not_found");
    if (patch.synopsis.trim().length < 20) throw new ApiError("Synopsis needs at least 20 characters.", "validation");
    Object.assign(m, patch);
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "edited", subjectType: "movie", subjectId: id, summary: `Edited metadata for “${m.title}”.` });
    return m;
  });
}
export function setAlbumStatus(adminId: string, id: string, status: "published" | "draft") {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    const a = getDB().albums.find((x) => x.id === id); if (!a) throw new ApiError("Album not found.", "not_found");
    if (status === "published" && a.assets.length === 0) throw new ApiError("Add at least one asset before publishing.", "validation");
    a.status = status;
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: status === "published" ? "published" : "unpublished", subjectType: "album", subjectId: id, summary: `${status === "published" ? "Published" : "Unpublished"} album “${a.title}”.` });
    return a;
  });
}
export function saveAlbum(adminId: string, input: { id?: string; title: string; description: string; category: GalleryAlbum["category"]; rights: string }) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    if (input.title.trim().length < 3) throw new ApiError("Album title needs at least 3 characters.", "validation");
    if (input.rights.trim().length < 10) throw new ApiError("Add rights and attribution metadata.", "validation");
    const d = getDB();
    let a = input.id ? d.albums.find((x) => x.id === input.id) : undefined;
    if (!a) { a = { id: uid("alb"), title: "", category: input.category, description: "", hue: hash(input.title) % 360, status: "draft", rights: "", assets: [] }; d.albums.push(a); }
    Object.assign(a, { title: input.title.trim(), description: input.description.trim(), category: input.category, rights: input.rights.trim() });
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: input.id ? "edited" : "created", subjectType: "album", subjectId: a.id, summary: `${input.id ? "Edited" : "Created"} album “${a.title}”.` });
    return a;
  });
}
export function addAssetPlaceholder(adminId: string, albumId: string, caption: string) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    const a = getDB().albums.find((x) => x.id === albumId); if (!a) throw new ApiError("Album not found.", "not_found");
    if (caption.trim().length < 3) throw new ApiError("Add a caption.", "validation");
    a.assets.push({ id: `${albumId}-a${a.assets.length + 1}-${getDB().counter}`, albumId, caption: caption.trim(), credit: "Placeholder upload — no file stored", hue: hash(caption) % 360, ratio: [0.75, 1, 1.3, 1.6][hash(caption) % 4] });
    return a;
  });
}
export function moveAsset(adminId: string, albumId: string, assetId: string, dir: -1 | 1) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canManageGlobalContent(admin.role));
    const a = getDB().albums.find((x) => x.id === albumId); if (!a) throw new ApiError("Album not found.", "not_found");
    const i = a.assets.findIndex((x) => x.id === assetId); const j = i + dir;
    if (i < 0 || j < 0 || j >= a.assets.length) return a;
    [a.assets[i], a.assets[j]] = [a.assets[j], a.assets[i]];
    return a;
  });
}

/* ============ Reels admin ============ */
export function adminListReels(adminId: string) {
  return read(() => {
    const admin = needAdmin(adminId);
    const d = getDB();
    return d.reels.filter((r) => r.source === "official" || !r.loc || scopeCovers(admin.scope, r.loc)).map((r) => ({ reel: r, case: d.cases.find((c) => c.id === r.caseId) }));
  });
}
export function setReelPublished(adminId: string, reelId: string, published: boolean) {
  return write(() => {
    const admin = needAdmin(adminId);
    const r = getDB().reels.find((x) => x.id === reelId); if (!r) throw new ApiError("Reel not found.", "not_found");
    if (r.status !== "approved") throw new ApiError("Only approved reels can be published. Review it in the moderation queue first.", "validation");
    if (r.loc && !scopeCovers(admin.scope, r.loc)) throw new ApiError("This reel is outside your scope.", "forbidden");
    r.published = published;
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: published ? "published" : "unpublished", subjectType: "reel", subjectId: reelId, summary: `${published ? "Published" : "Unpublished"} reel “${r.title}”.`, districtId: r.loc?.districtId });
    return r;
  });
}

/* ============ Events & welfare admin ============ */
export function adminListEvents(adminId: string) {
  return read(() => { const admin = needAdmin(adminId); return scopedEvents(admin).sort((a, b) => b.startsAt - a.startsAt).map((e) => ({ event: e, stats: eventStats(e) })); });
}
export interface EventInput { id?: string; title: string; category: PREvent["category"]; summary: string; purpose: string; startsAt: number; endsAt: number; venue: string; loc: Loc; capacity: number; eligibility: string; accessibility: string; requiresMembership: boolean }
export function saveEvent(adminId: string, input: EventInput) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    guard(canManageEvent(admin, input.loc));
    if (input.endsAt <= input.startsAt) throw new ApiError("The event must end after it starts.", "validation");
    if (input.capacity < 1) throw new ApiError("Capacity must be at least 1.", "validation");
    let e = input.id ? d.events.find((x) => x.id === input.id) : undefined;
    if (!e) { e = { id: uid("evt"), title: "", category: input.category, summary: "", purpose: "", startsAt: 0, endsAt: 0, venue: "", loc: input.loc, capacity: 1, status: "draft", hue: hash(input.title) % 360, eligibility: "", accessibility: "", organiser: `${admin.title}`, schedule: [], requiresMembership: true }; d.events.unshift(e); }
    Object.assign(e, { ...input, id: e.id });
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: input.id ? "edited" : "created", subjectType: "event", subjectId: e.id, summary: `${input.id ? "Edited" : "Created draft"} event “${e.title}”.`, districtId: e.loc.districtId });
    return e;
  });
}
export function setEventStatus(adminId: string, eventId: string, status: PREvent["status"], reason?: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const e = d.events.find((x) => x.id === eventId); if (!e) throw new ApiError("Event not found.", "not_found");
    guard(canManageEvent(admin, e.loc));
    if (status === "cancelled" && (reason ?? "").trim().length < 8) throw new ApiError("Add a reason for cancelling (visible to attendees).", "validation");
    e.status = status;
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: status, subjectType: "event", subjectId: eventId, summary: `Event “${e.title}” ${status}.`, reason, districtId: e.loc.districtId });
    if (status === "cancelled") d.rsvps.filter((r) => r.eventId === eventId && r.status !== "cancelled").forEach((r) => notify(r.userId, "event", `Cancelled: ${e.title}`, reason ?? "", `/events/${eventId}`));
    return e;
  });
}
export function listAttendees(adminId: string, eventId: string) {
  return read(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const e = d.events.find((x) => x.id === eventId); if (!e) throw new ApiError("Event not found.", "not_found");
    if (!scopeCovers(admin.scope, e.loc)) throw new ApiError("This event is outside your scope.", "forbidden");
    return { event: e, stats: eventStats(e), rows: d.rsvps.filter((r) => r.eventId === eventId).map((r) => ({ rsvp: r, fan: fanById(r.userId)! })).filter((x) => x.fan).sort((a, b) => a.rsvp.at - b.rsvp.at), policy: canManageEvent(admin, e.loc) };
  });
}
export function checkInAttendee(adminId: string, rsvpId: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const r = d.rsvps.find((x) => x.id === rsvpId); if (!r) throw new ApiError("RSVP not found.", "not_found");
    const e = d.events.find((x) => x.id === r.eventId)!;
    guard(canManageEvent(admin, e.loc));
    if (r.status !== "confirmed") throw new ApiError(r.status === "checked_in" ? "Already checked in." : "Only confirmed attendees can be checked in.", "conflict");
    r.status = "checked_in"; r.checkedInAt = now();
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "checked_in", subjectType: "event", subjectId: e.id, summary: `Checked in ${personName(r.userId)} at “${e.title}”.`, districtId: e.loc.districtId });
    return r;
  });
}
export function promoteWaitlisted(adminId: string, rsvpId: string) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const r = d.rsvps.find((x) => x.id === rsvpId); if (!r) throw new ApiError("RSVP not found.", "not_found");
    const e = d.events.find((x) => x.id === r.eventId)!;
    guard(canManageEvent(admin, e.loc));
    if (r.status !== "waitlisted") throw new ApiError("Only waitlisted attendees can be promoted.", "conflict");
    if (eventStats(e).full) throw new ApiError("The event is at capacity. Raise the capacity first.", "conflict");
    r.status = "confirmed";
    notify(r.userId, "event", `A seat opened: ${e.title}`, "Your pass is ready.", `/events/${e.id}`);
    return r;
  });
}
export function adminListWelfare(adminId: string) {
  return read(() => { const admin = needAdmin(adminId); const d = getDB(); return scopedWelfare(admin).map((w) => ({ activity: w, rows: d.participations.filter((p) => p.activityId === w.id).map((p) => ({ part: p, fan: fanById(p.userId)! })).filter((x) => x.fan) })); });
}
export function saveWelfare(adminId: string, input: { id?: string; title: string; purpose: string; startsAt: number; venue: string; loc: Loc; eligibility: string; capacity: number; steps: string[] }) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    if (!admin.active || !scopeCovers(admin.scope, input.loc)) throw new ApiError("That location is outside your scope.", "forbidden");
    if (input.title.trim().length < 4 || input.purpose.trim().length < 20) throw new ApiError("Add a title and a purpose of at least 20 characters.", "validation");
    let w = input.id ? d.welfare.find((x) => x.id === input.id) : undefined;
    if (!w) { w = { id: uid("wel"), title: "", purpose: "", startsAt: 0, venue: "", loc: input.loc, eligibility: "", steps: [], capacity: 1, hue: hash(input.title) % 360, status: "draft" }; d.welfare.unshift(w); }
    Object.assign(w, { ...input, id: w.id, steps: input.steps.filter((s) => s.trim()) });
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: input.id ? "edited" : "created", subjectType: "welfare", subjectId: w.id, summary: `${input.id ? "Edited" : "Created draft"} welfare activity “${w.title}”.`, districtId: w.loc.districtId });
    return w;
  });
}
export function setWelfareStatus(adminId: string, id: string, status: WelfareActivity["status"]) {
  return write(() => {
    const admin = needAdmin(adminId);
    const w = getDB().welfare.find((x) => x.id === id); if (!w) throw new ApiError("Activity not found.", "not_found");
    if (!scopeCovers(admin.scope, w.loc)) throw new ApiError("Outside your scope.", "forbidden");
    w.status = status;
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: status, subjectType: "welfare", subjectId: id, summary: `Welfare activity “${w.title}” set to ${status}.`, districtId: w.loc.districtId });
    return w;
  });
}
export function decideParticipation(adminId: string, partId: string, status: "approved" | "declined" | "attended") {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const p = d.participations.find((x) => x.id === partId); if (!p) throw new ApiError("Participation not found.", "not_found");
    const w = d.welfare.find((x) => x.id === p.activityId)!;
    if (!scopeCovers(admin.scope, w.loc)) throw new ApiError("Outside your scope.", "forbidden");
    p.status = status;
    if (status === "attended" && !d.points.some((x) => x.ref === `welfare:${p.id}`)) addPoints(p.userId, d.rewardConfig.welfarePoints, `Welfare: ${w.title}`, `welfare:${p.id}`);
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: status, subjectType: "welfare", subjectId: w.id, summary: `${personName(p.userId)} marked ${status} for “${w.title}”.`, districtId: w.loc.districtId });
    notify(p.userId, "event", `Participation ${status}: ${w.title}`, status === "attended" ? "Thank you for taking part." : "", `/events/welfare/${w.id}`);
    return p;
  });
}

/* ============ Messages (admin-only) ============ */
const unreadFor = (adminId: string) => {
  const d = getDB();
  return d.messages.filter((m) => m.fromId !== adminId && !m.readBy.includes(adminId) && d.conversations.find((c) => c.id === m.conversationId)?.participantIds.includes(adminId)).length;
};
export function listConversations(adminId: string) {
  return read(() => {
    const d = getDB();
    needAdmin(adminId);
    return d.conversations.filter((c) => c.participantIds.includes(adminId)).map((c) => {
      const msgs = d.messages.filter((m) => m.conversationId === c.id).sort((a, b) => a.at - b.at);
      return { conversation: c, last: msgs[msgs.length - 1], unread: msgs.filter((m) => m.fromId !== adminId && !m.readBy.includes(adminId)).length, participants: c.participantIds.map((id) => adminById(id)).filter(Boolean) as AdminProfile[] };
    }).sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
  });
}
export function getConversation(adminId: string, convId: string) {
  return read(() => {
    const d = getDB();
    needAdmin(adminId);
    const c = d.conversations.find((x) => x.id === convId);
    if (!c || !c.participantIds.includes(adminId)) throw new ApiError("You don't have access to this conversation.", "forbidden");
    return { conversation: c, messages: d.messages.filter((m) => m.conversationId === convId).sort((a, b) => a.at - b.at), participants: c.participantIds.map((id) => adminById(id)).filter(Boolean) as AdminProfile[] };
  });
}
export function markConversationRead(adminId: string, convId: string) {
  return write(() => { getDB().messages.forEach((m) => { if (m.conversationId === convId && !m.readBy.includes(adminId)) m.readBy.push(adminId); }); return true; });
}
export function sendMessage(adminId: string, convId: string, body: string, attachment?: AdminMessage["attachment"]) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const c = d.conversations.find((x) => x.id === convId);
    if (!c || !c.participantIds.includes(adminId)) throw new ApiError("You don't have access to this conversation.", "forbidden");
    if (c.kind === "system") throw new ApiError("System notices are read-only.", "forbidden");
    if (body.trim().length === 0) throw new ApiError("Write a message first.", "validation");
    if (/\b\d{12}\b/.test(body)) throw new ApiError("Messages can't include identity numbers. Remove the number and try again.", "validation");
    const m: AdminMessage = { id: uid("msg"), conversationId: convId, fromId: admin.id, fromName: admin.name, body: body.trim(), at: now(), status: "delivered", attachment, readBy: [admin.id] };
    d.messages.push(m);
    return m;
  });
}

/* ============ Audit ============ */
export function listAudit(adminId: string, p: { q?: string; subjectType?: string } = {}) {
  return read(() => {
    const admin = needAdmin(adminId);
    let list = getDB().audit.filter((a) => admin.role === "central" || !a.districtId || a.districtId === admin.scope.districtId);
    if (p.subjectType && p.subjectType !== "all") list = list.filter((a) => a.subjectType === p.subjectType);
    if (p.q) list = list.filter((a) => `${a.summary} ${a.actorName} ${a.action}`.toLowerCase().includes(p.q!.toLowerCase()));
    return list;
  });
}

/* ============ Quiz studio ============ */
export function adminListQuizzes() { return read(() => getDB().quizzes); }
export function generateQuiz(adminId: string, input: GenerationInput) {
  return write(() => {
    const d = getDB();
    const admin = needAdmin(adminId);
    const questions = generateDraftQuestions(input);
    const quiz: Quiz = { id: uid("quiz"), title: `${input.subject.startsWith("movie-") ? d.movies.find((m) => m.id === input.subject)?.title : input.subject} — AI draft`, blurb: "Generated draft. Review every question before publishing.", mode: "trivia", difficulty: input.difficulty, hue: hash(input.subject) % 360, status: "draft", questions, pointsPerCorrect: d.rewardConfig.pointsPerCorrect, createdBy: admin.id, aiGenerated: true, updatedAt: now() };
    d.quizzes.unshift(quiz);
    const job: AIQuizGenerationJob = { id: uid("job"), movieOrCategory: input.subject, difficulty: input.difficulty, count: questions.length, tone: input.tone, status: "completed", quizId: quiz.id, createdAt: now() };
    d.jobs.unshift(job);
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "generated", subjectType: "quiz", subjectId: quiz.id, summary: `Generated a mock-AI draft with ${questions.length} questions.` });
    return quiz;
  });
}
export function saveQuiz(adminId: string, quiz: Pick<Quiz, "id" | "title" | "blurb" | "difficulty" | "mode" | "questions">) {
  return write(() => {
    const admin = needAdmin(adminId);
    const q = getDB().quizzes.find((x) => x.id === quiz.id); if (!q) throw new ApiError("Quiz not found.", "not_found");
    if (q.status === "published") throw new ApiError("Published quizzes can't be edited. Duplicate it as a draft instead.", "conflict");
    Object.assign(q, { ...quiz, status: "draft", updatedAt: now() });
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "saved_draft", subjectType: "quiz", subjectId: q.id, summary: `Saved draft “${q.title}”.` });
    return q;
  });
}
export function createBlankQuiz(adminId: string) {
  return write(() => {
    const admin = needAdmin(adminId);
    const blank: QuizQuestion = { id: uid("q"), prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", category: "Movies", difficulty: "easy" };
    const quiz: Quiz = { id: uid("quiz"), title: "Untitled quiz", blurb: "", mode: "trivia", difficulty: "easy", hue: 200, status: "draft", questions: [blank], pointsPerCorrect: getDB().rewardConfig.pointsPerCorrect, createdBy: admin.id, aiGenerated: false, updatedAt: now() };
    getDB().quizzes.unshift(quiz);
    return quiz;
  });
}
export function publishQuiz(adminId: string, quizId: string, approved: boolean) {
  return write(() => {
    const admin = needAdmin(adminId);
    guard(canPublishQuiz(admin.role));
    const q = getDB().quizzes.find((x) => x.id === quizId); if (!q) throw new ApiError("Quiz not found.", "not_found");
    if (!approved) throw new ApiError("Confirm that you've reviewed every question before publishing.", "validation");
    const issues = validateQuiz(q);
    if (issues.length) throw new ApiError(`Fix ${issues.length} issue${issues.length > 1 ? "s" : ""} before publishing.`, "validation");
    q.status = "published"; q.updatedAt = now();
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "published", subjectType: "quiz", subjectId: q.id, summary: `Published quiz “${q.title}” after explicit review.` });
    return q;
  });
}

/* ============ Rewards administration ============ */
export function getRewardAdmin() {
  return read(() => { const d = getDB(); return { config: d.rewardConfig, rewards: d.rewards, history: d.audit.filter((a) => a.subjectType === "reward"), totalPoints: d.points.reduce((s, p) => s + p.delta, 0), unlocks: d.unlocked.length }; });
}
export function updateRewardConfig(adminId: string, config: RewardConfig, reason: string) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canEditRewards(admin.role));
    if (reason.trim().length < 8) throw new ApiError("Add a reason for the record.", "validation");
    if (Object.values(config).some((v) => !Number.isFinite(v) || v < 0 || v > 500)) throw new ApiError("Values must be between 0 and 500.", "validation");
    const before = getDB().rewardConfig;
    getDB().rewardConfig = { ...config };
    const changed = (Object.keys(config) as (keyof RewardConfig)[]).filter((k) => config[k] !== before[k]).map((k) => `${k}: ${before[k]} → ${config[k]}`).join(", ");
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "reward_values_changed", subjectType: "reward", subjectId: "config", summary: changed ? `Changed ${changed}.` : "Saved without changes.", reason: reason.trim() });
    return getDB().rewardConfig;
  });
}
export function updateRewardThreshold(adminId: string, rewardId: string, points: number, reason: string) {
  return write(() => {
    const admin = needAdmin(adminId); guard(canEditRewards(admin.role));
    const r = getDB().rewards.find((x) => x.id === rewardId); if (!r) throw new ApiError("Reward not found.", "not_found");
    if (!Number.isFinite(points) || points < 0 || points > 5000) throw new ApiError("Threshold must be between 0 and 5000.", "validation");
    if (reason.trim().length < 8) throw new ApiError("Add a reason for the record.", "validation");
    pushAudit({ actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "reward_values_changed", subjectType: "reward", subjectId: rewardId, summary: `“${r.name}” threshold ${r.pointsRequired} → ${points} points.`, reason: reason.trim() });
    r.pointsRequired = points;
    return r;
  });
}

export type { Nomination, ContentModerationCase, AdminConversation, Difficulty };

export function unreadMessageCount(adminId: string) { return read(() => unreadFor(adminId)); }
