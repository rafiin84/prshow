import type {
  AdminConversation, AdminMessage, Announcement, AppNotification, AuditEvent, ContentModerationCase, EventRSVP, Nomination,
  PREvent, PointsLedgerEntry, QuizAttempt, UnlockedReward, VerificationSubmission, WelfareActivity, WelfareParticipation, Loc,
} from "@/types";
import { BASE_TIME, DAY, HOUR, MIN } from "./time";

const L = (districtId: string, acId: string, wardId: string): Loc => ({ districtId, acId, wardId });
const MYL12 = L("chennai", "mylapore", "w-mylapore-12");

let aid = 0;
export const audit = (p: Omit<AuditEvent, "id">): AuditEvent => ({ id: `aud-${++aid}`, ...p });

/* ---------- Events ---------- */
export const EVENTS: PREvent[] = [
  {
    id: "evt-meetup", title: "Mylapore Fan Meet-up", category: "meetup", hue: 330, status: "published",
    summary: "An evening of games, filter coffee and conversation with fellow members.",
    purpose: "Bring local members together offline, run the PR trivia final, and hear community plans for the year.",
    startsAt: BASE_TIME + 9 * DAY + 8 * HOUR, endsAt: BASE_TIME + 9 * DAY + 11 * HOUR, venue: "Mandaveli Community Hall, Chennai", loc: MYL12,
    capacity: 4, eligibility: "Approved members aged 18+ in Chennai.", accessibility: "Step-free entrance, reserved seating and a quiet corner available.",
    organiser: "Mylapore AC Team", requiresMembership: true,
    schedule: [{ time: "5:30 PM", item: "Doors open and check-in" }, { time: "6:00 PM", item: "Welcome and community update" }, { time: "6:30 PM", item: "Trivia finals" }, { time: "7:30 PM", item: "Open mic and refreshments" }],
  },
  {
    id: "evt-screening", title: "Community Screening Night", category: "screening", hue: 262, status: "published",
    summary: "A members-only screening with a short discussion afterwards. Demo event.",
    purpose: "Watch together, discuss, and collect feedback for the next community programme.",
    startsAt: BASE_TIME + 16 * DAY + 9 * HOUR, endsAt: BASE_TIME + 16 * DAY + 13 * HOUR, venue: "Theatre hall, T. Nagar (venue to be confirmed)", loc: L("chennai", "t-nagar", "w-tnagar-8"),
    capacity: 120, eligibility: "Approved members.", accessibility: "Wheelchair spaces; captioned screening requested.", organiser: "Chennai District Team", requiresMembership: true,
    schedule: [{ time: "6:00 PM", item: "Entry" }, { time: "6:30 PM", item: "Screening" }, { time: "9:00 PM", item: "Discussion circle" }],
  },
  {
    id: "evt-workshop", title: "Short-Film Basics Workshop", category: "workshop", hue: 38, status: "published",
    summary: "A beginner workshop on storyboarding and phone-camera filmmaking.",
    purpose: "Help fan creators make better reels that meet community guidelines.",
    startsAt: BASE_TIME + 22 * DAY + 4 * HOUR, endsAt: BASE_TIME + 22 * DAY + 8 * HOUR, venue: "Library Auditorium, Coimbatore", loc: L("coimbatore", "cbe-north", "w-cbn-3"),
    capacity: 40, eligibility: "Open to members; beginners welcome.", accessibility: "Hearing-loop available on request.", organiser: "Coimbatore District Team", requiresMembership: false,
    schedule: [{ time: "10:00 AM", item: "Storyboard basics" }, { time: "11:30 AM", item: "Shoot a 20-second scene" }, { time: "1:00 PM", item: "Review and feedback" }],
  },
  {
    id: "evt-bloodcamp", title: "Community Blood Donation Drive", category: "welfare", hue: 12, status: "published",
    summary: "A volunteer-led drive organised with a licensed local blood bank. Demo event.",
    purpose: "Encourage safe, voluntary donation and thank volunteers.",
    startsAt: BASE_TIME + 12 * DAY + 3 * HOUR, endsAt: BASE_TIME + 12 * DAY + 8 * HOUR, venue: "Government clinic grounds, Velachery", loc: L("chennai", "velachery", "w-velachery-21"),
    capacity: 60, eligibility: "Adults who meet the blood bank's health criteria.", accessibility: "Ground-floor setup with seating.", organiser: "Velachery AC Team", requiresMembership: true,
    schedule: [{ time: "9:00 AM", item: "Registration" }, { time: "9:30 AM", item: "Screening and donation" }, { time: "1:00 PM", item: "Volunteer thank-you" }],
  },
  {
    id: "evt-anniv", title: "Fan Club Anniversary Day", category: "celebration", hue: 150, status: "published",
    summary: "A celebration of the first year of the community. Past event.",
    purpose: "Recognise volunteers and look back on the year.",
    startsAt: BASE_TIME - 30 * DAY + 4 * HOUR, endsAt: BASE_TIME - 30 * DAY + 8 * HOUR, venue: "Mandaveli Community Hall, Chennai", loc: MYL12,
    capacity: 80, eligibility: "Approved members.", accessibility: "Step-free entrance.", organiser: "Central Team", requiresMembership: true,
    schedule: [{ time: "10:00 AM", item: "Welcome" }, { time: "11:00 AM", item: "Volunteer recognition" }],
  },
  {
    id: "evt-draft", title: "Madurai Reels Meet (Draft)", category: "meetup", hue: 100, status: "draft",
    summary: "Draft event awaiting publication.", purpose: "Local creators meet to share work.",
    startsAt: BASE_TIME + 40 * DAY + 5 * HOUR, endsAt: BASE_TIME + 40 * DAY + 8 * HOUR, venue: "To be confirmed", loc: L("madurai", "madurai-central", "w-mdc-5"),
    capacity: 50, eligibility: "Approved members.", accessibility: "To be confirmed.", organiser: "Madurai District Team", requiresMembership: true, schedule: [],
  },
];

const r = (id: string, eventId: string, userId: string, status: EventRSVP["status"], at: number, checkedInAt?: number): EventRSVP => ({ id, eventId, userId, status, at, checkedInAt });
export const RSVPS: EventRSVP[] = [
  r("rsvp-1", "evt-meetup", "fan-arjun", "confirmed", BASE_TIME - 6 * DAY),
  r("rsvp-2", "evt-meetup", "fan-nisha", "confirmed", BASE_TIME - 5 * DAY),
  r("rsvp-3", "evt-meetup", "fan-divya", "confirmed", BASE_TIME - 4 * DAY),
  r("rsvp-4", "evt-meetup", "fan-karthi", "confirmed", BASE_TIME - 3 * DAY),
  r("rsvp-5", "evt-meetup", "fan-sanjay", "waitlisted", BASE_TIME - 2 * DAY),
  r("rsvp-6", "evt-anniv", "fan-meera", "checked_in", BASE_TIME - 40 * DAY, BASE_TIME - 30 * DAY + 4 * HOUR),
  r("rsvp-7", "evt-anniv", "fan-arjun", "checked_in", BASE_TIME - 40 * DAY, BASE_TIME - 30 * DAY + 5 * HOUR),
  r("rsvp-8", "evt-anniv", "fan-nisha", "confirmed", BASE_TIME - 39 * DAY),
  r("rsvp-9", "evt-screening", "fan-meera", "confirmed", BASE_TIME - 1 * DAY),
];

export const WELFARE: WelfareActivity[] = [
  { id: "wel-trees", title: "Neighbourhood Tree Planting", purpose: "Plant native saplings in public spaces with permission from the local body. Demo activity.", startsAt: BASE_TIME + 14 * DAY + 2 * HOUR, venue: "Besant Nagar park (to be confirmed)", loc: L("chennai", "mylapore", "w-mylapore-12"),
    eligibility: "Approved members; minors need a guardian.", steps: ["Register your participation", "Receive confirmation from your Ward Admin", "Arrive 15 minutes early with a water bottle", "Check in with the volunteer lead"], capacity: 30, hue: 130, status: "published" },
  { id: "wel-kits", title: "School Kit Collection", purpose: "Collect notebooks and stationery for a partner school. Demo activity — partner details pending.", startsAt: BASE_TIME + 20 * DAY + 4 * HOUR, venue: "Community hall, Velachery", loc: L("chennai", "velachery", "w-velachery-21"),
    eligibility: "Open to approved members.", steps: ["Register participation", "Pack your donation using the checklist", "Drop off at the community hall", "Confirm with the volunteer"], capacity: 50, hue: 38, status: "published" },
  { id: "wel-cleanup", title: "Beach Clean-up Morning", purpose: "A volunteer clean-up held earlier this year. Demo record.", startsAt: BASE_TIME - 45 * DAY, venue: "Marina Beach", loc: L("chennai", "mylapore", "w-mylapore-12"),
    eligibility: "Approved members.", steps: ["Register", "Collect gloves and bags", "Clean the assigned stretch"], capacity: 40, hue: 200, status: "completed" },
];
export const PARTICIPATIONS: WelfareParticipation[] = [
  { id: "part-1", activityId: "wel-trees", userId: "fan-arjun", status: "approved", at: BASE_TIME - 3 * DAY },
  { id: "part-2", activityId: "wel-trees", userId: "fan-nisha", status: "registered", at: BASE_TIME - 1 * DAY },
  { id: "part-3", activityId: "wel-cleanup", userId: "fan-meera", status: "attended", at: BASE_TIME - 50 * DAY },
  { id: "part-4", activityId: "wel-kits", userId: "fan-karthi", status: "registered", at: BASE_TIME - 6 * HOUR },
];

/* ---------- Moderation ---------- */
const sys = { actorId: "system", actorName: "PR Show System", actorRole: "system" as const };
const mkCase = (c: Partial<ContentModerationCase> & Pick<ContentModerationCase, "id" | "subjectId" | "title" | "excerpt" | "submitterId" | "submitterName" | "loc" | "status" | "submittedAt">): ContentModerationCase => ({
  subjectType: "reel", viewedBy: [], history: [], ...c,
});
export const CASES: ContentModerationCase[] = [
  mkCase({
    id: "case-1", subjectId: "reel-r6", title: "Mandaveli fan club banner timelapse", excerpt: "Painting the community banner for the meet-up.", submitterId: "fan-meera", submitterName: "Meera Sundaram", loc: MYL12,
    status: "pending_review", submittedAt: BASE_TIME - 20 * MIN,
    history: [audit({ at: BASE_TIME - 20 * MIN, ...sys, action: "submitted", subjectType: "case", subjectId: "case-1", summary: "Submitted by Meera Sundaram. Ward 12 review window opened (1 hour).", districtId: "chennai" })],
  }),
  mkCase({
    id: "case-2", subjectId: "reel-r7", title: "Dialogue mashup (needs clearance)", excerpt: "Clips cut from the film with background music.", submitterId: "fan-arjun", submitterName: "Arjun Venkat", loc: MYL12,
    status: "escalated", submittedAt: BASE_TIME - 70 * MIN, escalatedToDistrictAt: BASE_TIME - 10 * MIN,
    history: [
      audit({ at: BASE_TIME - 70 * MIN, ...sys, action: "submitted", subjectType: "case", subjectId: "case-2", summary: "Submitted by Arjun Venkat. Ward 12 review window opened.", districtId: "chennai" }),
      audit({ at: BASE_TIME - 10 * MIN, ...sys, action: "escalated", subjectType: "case", subjectId: "case-2", summary: "No decision within 1 hour. Escalated to District Admin (Chennai).", districtId: "chennai" }),
    ],
  }),
  mkCase({
    id: "case-3", subjectId: "reel-r8", title: "Bike ride to the premiere", excerpt: "Sharing my route and exact home address in the comments!", submitterId: "fan-karthi", submitterName: "Karthikeyan P", loc: L("chennai", "velachery", "w-velachery-21"),
    status: "escalated", submittedAt: BASE_TIME - 200 * MIN, escalatedToDistrictAt: BASE_TIME - 140 * MIN, escalatedToCentralAt: BASE_TIME - 20 * MIN,
    history: [
      audit({ at: BASE_TIME - 200 * MIN, ...sys, action: "submitted", subjectType: "case", subjectId: "case-3", summary: "Submitted by Karthikeyan P.", districtId: "chennai" }),
      audit({ at: BASE_TIME - 140 * MIN, ...sys, action: "escalated", subjectType: "case", subjectId: "case-3", summary: "Escalated to District Admin (Chennai).", districtId: "chennai" }),
      audit({ at: BASE_TIME - 20 * MIN, ...sys, action: "escalated", subjectType: "case", subjectId: "case-3", summary: "District window (2 hours) elapsed. Escalated to Central Admin.", districtId: "chennai" }),
    ],
  }),
  mkCase({
    id: "case-4", subjectId: "reel-r10", title: "Poster collage speed-art", excerpt: "Digital painting of the festival poster concept.", submitterId: "fan-nisha", submitterName: "Nisha Rahman", loc: L("chennai", "mylapore", "w-mylapore-13"),
    status: "needs_correction", submittedAt: BASE_TIME - 1 * DAY,
    decision: { id: "dec-1", outcome: "needs_correction", reason: "Please add the rights confirmation for the reference image and resubmit.", byId: "adm-ward-13", byName: "Mohan Raj", byRole: "ward", at: BASE_TIME - 1 * DAY + 25 * MIN },
    history: [
      audit({ at: BASE_TIME - 1 * DAY, ...sys, action: "submitted", subjectType: "case", subjectId: "case-4", summary: "Submitted by Nisha Rahman.", districtId: "chennai" }),
      audit({ at: BASE_TIME - 1 * DAY + 25 * MIN, actorId: "adm-ward-13", actorName: "Mohan Raj", actorRole: "ward", action: "needs_correction", subjectType: "case", subjectId: "case-4", summary: "Correction requested.", reason: "Please add the rights confirmation for the reference image and resubmit.", districtId: "chennai" }),
    ],
  }),
  mkCase({
    id: "case-5", subjectId: "reel-r9", title: "Unauthorised ticket resale", excerpt: "DM me for extra tickets, cheap price.", submitterId: "fan-ravi", submitterName: "Ravichandran S", loc: L("madurai", "madurai-central", "w-mdc-5"),
    status: "rejected", submittedAt: BASE_TIME - 2 * DAY,
    decision: { id: "dec-2", outcome: "rejected", reason: "Ticket resale is not allowed under the community guidelines.", byId: "adm-central", byName: "Karthik Raman", byRole: "central", at: BASE_TIME - 2 * DAY + 3 * HOUR + 10 * MIN },
    escalatedToDistrictAt: BASE_TIME - 2 * DAY + HOUR, escalatedToCentralAt: BASE_TIME - 2 * DAY + 3 * HOUR,
    history: [
      audit({ at: BASE_TIME - 2 * DAY, ...sys, action: "submitted", subjectType: "case", subjectId: "case-5", summary: "Submitted by Ravichandran S.", districtId: "madurai" }),
      audit({ at: BASE_TIME - 2 * DAY + HOUR, ...sys, action: "escalated", subjectType: "case", subjectId: "case-5", summary: "Escalated to District Admin (Madurai).", districtId: "madurai" }),
      audit({ at: BASE_TIME - 2 * DAY + 3 * HOUR, ...sys, action: "escalated", subjectType: "case", subjectId: "case-5", summary: "Escalated to Central Admin.", districtId: "madurai" }),
      audit({ at: BASE_TIME - 2 * DAY + 3 * HOUR + 10 * MIN, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "rejected", subjectType: "case", subjectId: "case-5", summary: "Rejected.", reason: "Ticket resale is not allowed under the community guidelines.", districtId: "madurai" }),
    ],
  }),
  mkCase({
    id: "case-6", subjectType: "post", subjectId: "post-1", title: "Fan post: meet-up carpool request", excerpt: "Anyone from Abiramapuram travelling together to the meet-up? Happy to share a cab, my number is 98xxxxxx21.", submitterId: "fan-nisha", submitterName: "Nisha Rahman", loc: L("chennai", "mylapore", "w-mylapore-13"),
    status: "pending_review", submittedAt: BASE_TIME - 5 * MIN,
    history: [audit({ at: BASE_TIME - 5 * MIN, ...sys, action: "submitted", subjectType: "case", subjectId: "case-6", summary: "Submitted by Nisha Rahman. Ward 13 review window opened.", districtId: "chennai" })],
  }),
];

/* ---------- Appointments ---------- */
const nom = (id: string, nomineeName: string, targetRole: Nomination["targetRole"], scope: Nomination["scope"], by: string, byRole: Nomination["nominatedByRole"], status: Nomination["status"], rationale: string, createdAt: number, extra: Partial<Nomination> = {}): Nomination => ({
  id, nomineeName, nomineeContact: "+91 ••••• ••" + (20 + id.length * 7), targetRole, scope, nominatedById: by, nominatedByRole: byRole, status, rationale, createdAt, updatedAt: createdAt, history: [], ...extra,
});
export const NOMINATIONS: Nomination[] = [
  nom("nom-1", "Gokul Anand", "ac", { level: "ac", districtId: "chennai", acId: "t-nagar" }, "adm-dist-chn", "district", "nominated", "Has organised three T. Nagar screenings and coordinated volunteers reliably.", BASE_TIME - 2 * DAY, {
    history: [audit({ at: BASE_TIME - 2 * DAY, actorId: "adm-dist-chn", actorName: "Lakshmi Narayanan", actorRole: "district", action: "nominated", subjectType: "nomination", subjectId: "nom-1", summary: "Nominated Gokul Anand as AC Admin, T. Nagar.", districtId: "chennai" })],
  }),
  nom("nom-2", "Revathi Selvam", "ward", { level: "ward", districtId: "chennai", acId: "mylapore", wardId: "w-mylapore-14" }, "adm-ac-myl", "ac", "nominated", "Active community volunteer in Luz with strong moderation judgement.", BASE_TIME - 1 * DAY, {
    history: [audit({ at: BASE_TIME - 1 * DAY, actorId: "adm-ac-myl", actorName: "Suresh Babu", actorRole: "ac", action: "nominated", subjectType: "nomination", subjectId: "nom-2", summary: "Nominated Revathi Selvam as Ward Admin, Ward 14.", districtId: "chennai" })],
  }),
  nom("nom-3", "Fathima Beevi", "ward", { level: "ward", districtId: "chennai", acId: "velachery", wardId: "w-velachery-21" }, "adm-ac-vel", "ac", "approved", "Led the Velachery volunteer team through two community days.", BASE_TIME - 20 * DAY, {
    decisionReason: "Strong record. Approved.", decidedBy: "Karthik Raman", updatedAt: BASE_TIME - 18 * DAY,
    history: [
      audit({ at: BASE_TIME - 20 * DAY, actorId: "adm-ac-vel", actorName: "Anitha Krishnan", actorRole: "ac", action: "nominated", subjectType: "nomination", subjectId: "nom-3", summary: "Nominated Fathima Beevi as Ward Admin, Ward 21.", districtId: "chennai" }),
      audit({ at: BASE_TIME - 18 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "approved", subjectType: "nomination", subjectId: "nom-3", summary: "Approved. Admin privileges activated.", reason: "Strong record. Approved.", districtId: "chennai" }),
    ],
  }),
  nom("nom-4", "Dinesh Pandian", "ac", { level: "ac", districtId: "coimbatore", acId: "singanallur" }, "adm-dist-cbe", "district", "needs_correction", "Experienced event coordinator.", BASE_TIME - 6 * DAY, {
    decisionReason: "Please add which wards he has coordinated in before.", decidedBy: "Karthik Raman", updatedAt: BASE_TIME - 5 * DAY,
    history: [
      audit({ at: BASE_TIME - 6 * DAY, actorId: "adm-dist-cbe", actorName: "Prakash Rajan", actorRole: "district", action: "nominated", subjectType: "nomination", subjectId: "nom-4", summary: "Nominated Dinesh Pandian as AC Admin, Singanallur.", districtId: "coimbatore" }),
      audit({ at: BASE_TIME - 5 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "needs_correction", subjectType: "nomination", subjectId: "nom-4", summary: "Correction requested.", reason: "Please add which wards he has coordinated in before.", districtId: "coimbatore" }),
    ],
  }),
  nom("nom-5", "Selvi Arumugam", "ward", { level: "ward", districtId: "chennai", acId: "t-nagar", wardId: "w-tnagar-9" }, "adm-ac-myl", "ac", "rejected", "Offered to help occasionally.", BASE_TIME - 12 * DAY, {
    decisionReason: "Scope mismatch: this ward is outside the nominating AC.", decidedBy: "Karthik Raman", updatedAt: BASE_TIME - 11 * DAY,
    history: [audit({ at: BASE_TIME - 11 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "rejected", subjectType: "nomination", subjectId: "nom-5", summary: "Rejected.", reason: "Scope mismatch: this ward is outside the nominating AC.", districtId: "chennai" })],
  }),
];

/* ---------- Messages (admin-only) ---------- */
export const CONVERSATIONS: AdminConversation[] = [
  { id: "conv-1", title: "Divya Prakash ⇄ Suresh Babu", kind: "direct", participantIds: ["adm-ward-12", "adm-ac-myl"], scopeNote: "Mylapore AC" },
  { id: "conv-2", title: "Chennai District coordination", kind: "group", participantIds: ["adm-dist-chn", "adm-ac-myl", "adm-ac-vel", "adm-ward-12", "adm-central"], scopeNote: "Chennai District" },
  { id: "conv-3", title: "Escalation notices", kind: "system", participantIds: ["adm-dist-chn", "adm-central", "adm-ward-12", "adm-ac-myl"], scopeNote: "System" },
  { id: "conv-4", title: "Central ⇄ Lakshmi Narayanan", kind: "direct", participantIds: ["adm-central", "adm-dist-chn"], scopeNote: "Chennai District" },
  { id: "conv-5", title: "Coimbatore ⇄ Central", kind: "direct", participantIds: ["adm-central", "adm-dist-cbe"], scopeNote: "Coimbatore District" },
];
const m = (id: string, conversationId: string, fromId: string, fromName: string, body: string, at: number, status: AdminMessage["status"] = "read", attachment?: AdminMessage["attachment"]): AdminMessage => ({ id, conversationId, fromId, fromName, body, at, status, attachment, readBy: status === "read" ? ["adm-ward-12", "adm-ac-myl", "adm-dist-chn", "adm-central"] : [] });
export const MESSAGES: AdminMessage[] = [
  m("msg-1", "conv-1", "adm-ac-myl", "Suresh Babu", "Divya, the banner timelapse reel from Ward 12 is in your queue. Could you review it today?", BASE_TIME - 3 * HOUR),
  m("msg-2", "conv-1", "adm-ward-12", "Divya Prakash", "On it. I'll check the rights confirmation first.", BASE_TIME - 2 * HOUR - 40 * MIN),
  m("msg-3", "conv-1", "adm-ac-myl", "Suresh Babu", "Thanks. Meet-up capacity is only 4 in the demo setup, so expect a waitlist.", BASE_TIME - 40 * MIN, "delivered"),
  m("msg-4", "conv-2", "adm-dist-chn", "Lakshmi Narayanan", "Reminder: welfare drive registrations close in a week. Please confirm volunteer leads for your ACs.", BASE_TIME - 1 * DAY),
  m("msg-5", "conv-2", "adm-ac-vel", "Anitha Krishnan", "Velachery lead confirmed. Attaching the draft volunteer roster.", BASE_TIME - 22 * HOUR, "read", { name: "velachery-volunteers-draft.pdf", sizeKb: 184 }),
  m("msg-6", "conv-3", "system", "PR Show System", "Case case-2 (Dialogue mashup) was escalated to District Admin (Chennai) after the 1-hour Ward window.", BASE_TIME - 10 * MIN, "delivered"),
  m("msg-7", "conv-3", "system", "PR Show System", "Case case-3 (Bike ride to the premiere) was escalated to Central Admin. AI Content Guardian flagged a possible privacy exposure.", BASE_TIME - 20 * MIN, "delivered"),
  m("msg-8", "conv-4", "adm-central", "Karthik Raman", "Please nominate an AC Admin for T. Nagar when ready. I'll give final approval.", BASE_TIME - 3 * DAY),
  m("msg-9", "conv-4", "adm-dist-chn", "Lakshmi Narayanan", "Nominated Gokul Anand. Rationale attached in the appointment record.", BASE_TIME - 2 * DAY),
  m("msg-10", "conv-5", "adm-dist-cbe", "Prakash Rajan", "I've updated Dinesh's nomination with ward history.", BASE_TIME - 4 * HOUR, "delivered"),
];

/* ---------- Announcements ---------- */
export const ANNOUNCEMENTS: Announcement[] = [
  { id: "ann-1", title: "Welcome to PR Show — Beyond the Screen", body: "PR Show is the official community home for fans of Pradeep Ranganathan. Play, watch, meet and give back — all in one place. Demo announcement.", audience: "all", hue: 330, status: "published", authorId: "adm-central", authorName: "Central Team", createdAt: BASE_TIME - 14 * DAY, publishedAt: BASE_TIME - 14 * DAY, pinned: true },
  { id: "ann-2", title: "Mylapore Fan Meet-up: RSVPs are open", body: "Seats are limited, and the waitlist opens once capacity is reached. Approved members only. Demo announcement.", audience: "district", districtId: "chennai", hue: 38, status: "published", authorId: "adm-dist-chn", authorName: "Chennai District Team", createdAt: BASE_TIME - 6 * DAY, publishedAt: BASE_TIME - 6 * DAY },
  { id: "ann-3", title: "Community guidelines refreshed", body: "We've clarified rules about ticket resale, personal information and rights for fan-created reels.", audience: "all", hue: 262, status: "published", authorId: "adm-central", authorName: "Central Team", createdAt: BASE_TIME - 3 * DAY, publishedAt: BASE_TIME - 3 * DAY },
  { id: "ann-4", title: "Welfare drive volunteers needed (draft)", body: "Draft announcement for the school-kit collection.", audience: "ac", districtId: "chennai", acId: "velachery", hue: 120, status: "draft", authorId: "adm-ac-vel", authorName: "Anitha Krishnan", createdAt: BASE_TIME - 1 * DAY },
];

/* ---------- Notifications ---------- */
const n = (id: string, userId: string, category: AppNotification["category"], title: string, body: string, ago: number, href: string, read = false): AppNotification => ({ id, userId, category, title, body, at: BASE_TIME - ago, read, href });
export const NOTIFICATIONS: AppNotification[] = [
  n("n-1", "fan-meera", "official", "New official announcement", "Community guidelines refreshed.", 3 * DAY, "/"),
  n("n-2", "fan-meera", "event", "Event reminder: Community Screening Night", "You're confirmed. Pass is ready.", 1 * DAY, "/events/evt-screening"),
  n("n-3", "fan-meera", "reward", "Wallpaper unlocked", "Golden Hour Wallpaper is now in your rewards.", 5 * DAY, "/profile/rewards", true),
  n("n-4", "fan-meera", "submission", "Your reel is in review", "“Mandaveli fan club banner timelapse” is pending review.", 20 * MIN, "/profile/submissions"),
  n("n-5", "fan-meera", "verification", "Membership approved", "Welcome to PR Show. Your membership card is ready.", 94 * DAY, "/profile/membership", true),
  n("n-6", "fan-meera", "reward", "Daily challenge is ready", "Three quick questions are waiting.", 1 * HOUR, "/games/play/quiz-daily"),
  n("a-1", "adm-ward-12", "admin", "New item in your queue", "“Mandaveli fan club banner timelapse” was submitted. Review within 1 hour.", 20 * MIN, "/admin/moderation/case-1"),
  n("a-2", "adm-ward-12", "admin", "Verification awaiting review", "Harish Babu submitted membership verification.", 2 * HOUR, "/admin/members/fan-harish"),
  n("a-3", "adm-ac-myl", "admin", "Nomination awaiting Central approval", "Revathi Selvam, Ward 14.", 1 * DAY, "/admin/appointments"),
  n("a-4", "adm-dist-chn", "admin", "Escalation: Dialogue mashup", "Escalated from Ward 12. District decision window is 2 hours.", 10 * MIN, "/admin/moderation/case-2"),
  n("a-5", "adm-dist-chn", "admin", "Nomination submitted", "Gokul Anand (T. Nagar) is awaiting Central.", 2 * DAY, "/admin/appointments"),
  n("a-6", "adm-central", "admin", "Escalation: Bike ride to the premiere", "Possible privacy exposure flagged. Needs a Central decision.", 20 * MIN, "/admin/moderation/case-3"),
  n("a-7", "adm-central", "admin", "Two nominations awaiting final approval", "Gokul Anand and Revathi Selvam.", 1 * DAY, "/admin/appointments"),
];

/* ---------- Points, attempts, unlocks, verification ---------- */
export const POINTS: PointsLedgerEntry[] = [
  { id: "pt-1", userId: "fan-meera", delta: 50, reason: "Welcome bonus", at: BASE_TIME - 94 * DAY },
  { id: "pt-2", userId: "fan-meera", delta: 40, reason: "Quiz: The PR Film Shelf (4/5)", at: BASE_TIME - 20 * DAY, ref: "att-1" },
  { id: "pt-3", userId: "fan-meera", delta: 30, reason: "Welfare: Beach Clean-up Morning", at: BASE_TIME - 45 * DAY },
  { id: "pt-4", userId: "fan-meera", delta: 15, reason: "Event RSVP: Fan Club Anniversary Day", at: BASE_TIME - 40 * DAY },
  { id: "pt-5", userId: "fan-meera", delta: 40, reason: "Reel approved: Love Today rewatch ritual", at: BASE_TIME - 30 * DAY },
  { id: "pt-6", userId: "fan-arjun", delta: 180, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-7", userId: "fan-nisha", delta: 320, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-8", userId: "fan-karthi", delta: 90, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-9", userId: "fan-divya", delta: 260, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-10", userId: "fan-sanjay", delta: 140, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-11", userId: "fan-janani", delta: 410, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-12", userId: "fan-ravi", delta: 70, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
  { id: "pt-13", userId: "fan-pavithra", delta: 230, reason: "Seed balance", at: BASE_TIME - 30 * DAY },
];
export const ATTEMPTS: QuizAttempt[] = [
  { id: "att-1", userId: "fan-meera", quizId: "quiz-trivia-films", quizTitle: "The PR Film Shelf", mode: "trivia", answers: [1, 2, 0, 0, 1], score: 4, total: 5, points: 40, completedAt: BASE_TIME - 20 * DAY, durationSec: 74 },
  { id: "att-2", userId: "fan-meera", quizId: "quiz-onboarding", quizTitle: "Welcome Quiz", mode: "onboarding", answers: [0, 1], score: 2, total: 2, points: 20, completedAt: BASE_TIME - 93 * DAY, durationSec: 21 },
];
export const UNLOCKED: UnlockedReward[] = [{ userId: "fan-meera", rewardId: "rw-wall-1", at: BASE_TIME - 5 * DAY }];
export const EARNED_BADGES: { userId: string; badgeId: string; at: number }[] = [
  { userId: "fan-meera", badgeId: "b-first-quiz", at: BASE_TIME - 93 * DAY },
  { userId: "fan-meera", badgeId: "b-verified", at: BASE_TIME - 94 * DAY },
  { userId: "fan-meera", badgeId: "b-event", at: BASE_TIME - 40 * DAY },
  { userId: "fan-meera", badgeId: "b-welfare", at: BASE_TIME - 45 * DAY },
  { userId: "fan-meera", badgeId: "b-creator", at: BASE_TIME - 30 * DAY },
];
export const VERIFICATIONS: VerificationSubmission[] = [
  { id: "ver-harish", fanId: "fan-harish", status: "pending_review", submittedAt: BASE_TIME - 2 * HOUR, secureQrDone: true, livenessSimDone: true, history: [audit({ at: BASE_TIME - 2 * HOUR, actorId: "fan-harish", actorName: "Harish Babu", actorRole: "fan", action: "submitted", subjectType: "verification", subjectId: "ver-harish", summary: "Submitted demo verification.", districtId: "chennai" })] },
  { id: "ver-sowmya", fanId: "fan-sowmya", status: "needs_correction", submittedAt: BASE_TIME - 3 * DAY, secureQrDone: true, livenessSimDone: false, reviewerNote: "The selfie step timed out. Please repeat the liveness simulation.", history: [audit({ at: BASE_TIME - 3 * DAY, actorId: "fan-sowmya", actorName: "Sowmya Iyer", actorRole: "fan", action: "submitted", subjectType: "verification", subjectId: "ver-sowmya", summary: "Submitted demo verification.", districtId: "chennai" })] },
  { id: "ver-imran", fanId: "fan-imran", status: "rejected", submittedAt: BASE_TIME - 5 * DAY, secureQrDone: true, livenessSimDone: true, reviewerNote: "Location did not match the selected ward.", history: [audit({ at: BASE_TIME - 5 * DAY, actorId: "fan-imran", actorName: "Imran Sheikh", actorRole: "fan", action: "submitted", subjectType: "verification", subjectId: "ver-imran", summary: "Submitted demo verification.", districtId: "madurai" })] },
];

export const SEED_AUDIT: AuditEvent[] = [
  audit({ at: BASE_TIME - 14 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "published", subjectType: "announcement", subjectId: "ann-1", summary: "Published “Welcome to PR Show”." }),
  audit({ at: BASE_TIME - 6 * DAY, actorId: "adm-dist-chn", actorName: "Lakshmi Narayanan", actorRole: "district", action: "published", subjectType: "announcement", subjectId: "ann-2", summary: "Published “Mylapore Fan Meet-up: RSVPs are open”.", districtId: "chennai" }),
  audit({ at: BASE_TIME - 3 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "published", subjectType: "announcement", subjectId: "ann-3", summary: "Published “Community guidelines refreshed”." }),
  audit({ at: BASE_TIME - 18 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "approved", subjectType: "nomination", subjectId: "nom-3", summary: "Approved Fathima Beevi as Ward Admin, Ward 21.", districtId: "chennai" }),
  audit({ at: BASE_TIME - 20 * DAY, actorId: "adm-central", actorName: "Karthik Raman", actorRole: "central", action: "published", subjectType: "quiz", subjectId: "quiz-trivia-films", summary: "Published quiz “The PR Film Shelf”." }),
];
