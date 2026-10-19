// Domain models for PR Show. Everything here is demo data — no real identities.

export type Role = "fan" | "central" | "district" | "ac" | "ward";
export type AdminRole = Exclude<Role, "fan">;

/** Where a person or item sits in the Tamil Nadu hierarchy. */
export interface Loc {
  districtId: string;
  acId: string;
  wardId: string;
}

/** What an admin is allowed to operate on. Central has no restriction. */
export interface GeoScope {
  level: AdminRole;
  districtId?: string;
  acId?: string;
  wardId?: string;
}

export interface Ward { id: string; name: string }
export interface AC { id: string; name: string; wards: Ward[] }
export interface District { id: string; name: string; acs: AC[] }

export type VerificationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_correction";

export interface Membership {
  memberNo: string;
  status: "pending" | "active";
  issuedAt?: number;
  qrToken: string; // opaque random-looking token — never personal data
}

export interface FanProfile {
  id: string;
  name: string;
  handle: string;
  phoneMasked: string;
  bio: string;
  hue: number;
  loc: Loc;
  verification: VerificationStatus;
  verificationNote?: string;
  membership?: Membership;
  joinedAt: number;
  prefs: { notifyEvents: boolean; notifyQuiz: boolean; notifyOfficial: boolean; showCity: boolean };
  savedIds: string[];
  likedIds: string[];
}

export interface AdminProfile {
  id: string;
  name: string;
  role: AdminRole;
  hue: number;
  scope: GeoScope;
  active: boolean; // false while appointment is pending
  title: string;
}

export interface AuditEvent {
  id: string;
  at: number;
  actorId: string;
  actorName: string;
  actorRole: Role | "system" | "ai";
  action: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  districtId?: string;
  reason?: string;
}

export type AppointmentStatus = "nominated" | "approved" | "rejected" | "needs_correction";
export interface Nomination {
  id: string;
  nomineeName: string;
  nomineeContact: string; // masked
  targetRole: "district" | "ac" | "ward";
  scope: GeoScope;
  nominatedById: string;
  nominatedByRole: AdminRole;
  status: AppointmentStatus;
  rationale: string;
  decisionReason?: string;
  decidedBy?: string;
  createdAt: number;
  updatedAt: number;
  history: AuditEvent[];
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  role: string;
  genres: string[];
  runtime?: string;
  synopsis: string;
  hue: number;
  cast: { name: string; as?: string }[];
  crew: { name: string; job: string }[];
  verified: boolean;
  /** Optional approved poster path under /public (e.g. /images/movies/dragon.jpg). Falls back to demo art if missing. */
  poster?: string;
  /** Optional wide image for the detail-page header. */
  backdrop?: string;
  mediaSlots: { id: string; kind: "trailer" | "song" | "bts"; title: string; available: boolean }[];
  stills: string[];
  status: "published" | "draft";
}

export interface GalleryAsset { id: string; albumId: string; caption: string; credit: string; hue: number; ratio: number }
export interface GalleryAlbum {
  id: string;
  title: string;
  category: "stills" | "bts" | "posters" | "events" | "promo";
  description: string;
  hue: number;
  status: "published" | "draft";
  rights: string;
  assets: GalleryAsset[];
}

export type ReelStatus = "draft" | "submitted" | "pending_review" | "approved" | "rejected" | "needs_correction" | "escalated";
export interface ReelComment { id: string; author: string; body: string; at: number }
export interface Reel {
  id: string;
  title: string;
  caption: string;
  category: string;
  source: "official" | "fan";
  creatorId: string;
  creatorName: string;
  status: ReelStatus;
  durationSec: number;
  hue: number;
  likes: number;
  saves: number;
  comments: ReelComment[];
  loc?: Loc;
  createdAt: number;
  published: boolean;
  caseId?: string;
  reviewNote?: string;
  captionsAvailable: boolean;
}

export type GameMode = "trivia" | "dialogue" | "scene" | "song" | "daily" | "onboarding";
export type Difficulty = "easy" | "medium" | "hard";
export interface QuizQuestion {
  id: string;
  prompt: string;
  clue?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  difficulty: Difficulty;
}
export interface Quiz {
  id: string;
  title: string;
  blurb: string;
  mode: GameMode;
  difficulty: Difficulty;
  hue: number;
  status: "draft" | "review" | "published";
  questions: QuizQuestion[];
  pointsPerCorrect: number;
  createdBy: string;
  aiGenerated: boolean;
  updatedAt: number;
}
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  mode: GameMode;
  answers: number[];
  score: number;
  total: number;
  points: number;
  completedAt: number;
  durationSec: number;
}
export interface AIQuizGenerationJob {
  id: string;
  movieOrCategory: string;
  difficulty: Difficulty;
  count: number;
  tone: "playful" | "classic" | "challenging";
  status: "completed";
  quizId: string;
  createdAt: number;
}

export interface PointsLedgerEntry { id: string; userId: string; delta: number; reason: string; at: number; ref?: string }
export interface Badge { id: string; name: string; description: string; hint: string; hue: number }
export interface Reward {
  id: string;
  kind: "wallpaper" | "movie_pass" | "event_ticket";
  name: string;
  description: string;
  pointsRequired: number;
  hue: number;
}
export interface UnlockedReward { userId: string; rewardId: string; at: number }

export type EventCategory = "meetup" | "screening" | "workshop" | "welfare" | "celebration";
export type EventStatus = "draft" | "published" | "cancelled";
export interface PREvent {
  id: string;
  title: string;
  category: EventCategory;
  summary: string;
  purpose: string;
  startsAt: number;
  endsAt: number;
  venue: string;
  loc: Loc;
  capacity: number;
  status: EventStatus;
  hue: number;
  eligibility: string;
  accessibility: string;
  organiser: string;
  schedule: { time: string; item: string }[];
  requiresMembership: boolean;
  /** Optional approved image path under /public. Falls back to demo art. */
  image?: string;
}
export type RSVPStatus = "confirmed" | "waitlisted" | "cancelled" | "checked_in";
export interface EventRSVP { id: string; eventId: string; userId: string; status: RSVPStatus; at: number; checkedInAt?: number }
export interface EventPass { id: string; eventId: string; userId: string; token: string }

export interface WelfareActivity {
  id: string;
  title: string;
  purpose: string;
  startsAt: number;
  venue: string;
  loc: Loc;
  eligibility: string;
  steps: string[];
  capacity: number;
  hue: number;
  image?: string;
  status: "draft" | "published" | "completed";
}
export type ParticipationStatus = "registered" | "approved" | "declined" | "attended";
export interface WelfareParticipation { id: string; activityId: string; userId: string; status: ParticipationStatus; at: number; note?: string }

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "district" | "ac" | "ward";
  districtId?: string;
  acId?: string;
  wardId?: string;
  hue: number;
  status: "draft" | "scheduled" | "published" | "archived";
  authorId: string;
  authorName: string;
  createdAt: number;
  publishedAt?: number;
  pinned?: boolean;
}

export type NotificationCategory = "official" | "event" | "reward" | "submission" | "verification" | "admin";
export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  at: number;
  read: boolean;
  href: string;
}

export type CaseStatus = "submitted" | "pending_review" | "escalated" | "approved" | "rejected" | "needs_correction";
export type ReviewLevel = "ward" | "district" | "central";
export type GuardianCategory = "violence" | "harassment" | "hate" | "sexual" | "misinformation" | "privacy" | "copyright" | "spam";
export interface GuardianFlag { category: GuardianCategory; confidence: number; excerpt?: string; explanation: string }
export interface AIContentGuardianResult {
  id: string;
  caseId: string;
  analysedAt: number;
  flags: GuardianFlag[];
  riskScore: number; // 0..1 mock
  recommended: "approve" | "reject" | "needs_correction" | "escalate";
  rationale: string;
  adminResponse?: { action: "accepted" | "overridden" | "dismissed"; reason: string; byId: string; at: number };
}
export interface ModerationDecision {
  id: string;
  outcome: "approved" | "rejected" | "needs_correction";
  reason: string;
  byId: string;
  byName: string;
  byRole: Role;
  at: number;
}
export interface ContentModerationCase {
  id: string;
  subjectType: "reel" | "post" | "comment";
  subjectId: string;
  title: string;
  excerpt: string;
  submitterId: string;
  submitterName: string;
  loc: Loc;
  status: CaseStatus;
  submittedAt: number;
  escalatedToDistrictAt?: number;
  escalatedToCentralAt?: number;
  decision?: ModerationDecision;
  viewedBy: { id: string; at: number }[];
  history: AuditEvent[];
  guardian?: AIContentGuardianResult;
}

export interface AdminConversation {
  id: string;
  title: string;
  kind: "direct" | "group" | "system";
  participantIds: string[];
  scopeNote: string;
}
export interface AdminMessage {
  id: string;
  conversationId: string;
  fromId: string;
  fromName: string;
  body: string;
  at: number;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  attachment?: { name: string; sizeKb: number };
  readBy: string[];
}

export interface VerificationSubmission {
  id: string;
  fanId: string;
  status: VerificationStatus;
  submittedAt: number;
  // Only safe flags — never identity numbers, documents or face data.
  secureQrDone: boolean;
  livenessSimDone: boolean;
  reviewerNote?: string;
  history: AuditEvent[];
}

export interface RewardConfig {
  pointsPerCorrect: number;
  perfectBonus: number;
  rsvpPoints: number;
  welfarePoints: number;
  reelApprovedPoints: number;
}
