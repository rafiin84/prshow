import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name (at least 2 characters).").max(60, "Name is too long."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number starting with 6–9."),
  adult: z.literal(true, { error: "You must confirm you are 18 or older." }),
  consent: z.literal(true, { error: "Please accept the privacy explanation to continue." }),
});
export type SignupValues = z.infer<typeof signupSchema>;

export const signinSchema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number starting with 6–9.") });
export const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code.") });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  handle: z.string().trim().regex(/^[a-z0-9._]{3,20}$/i, "3–20 characters: letters, numbers, dot or underscore."),
  bio: z.string().max(160, "Keep your bio under 160 characters."),
});

export const reelSchema = z.object({
  title: z.string().trim().min(3, "Add a title (at least 3 characters).").max(80, "Keep the title under 80 characters."),
  caption: z.string().max(220, "Keep the caption under 220 characters."),
  category: z.string().min(1, "Choose a category."),
  rights: z.literal(true, { error: "Confirm that you own or have permission to use this content." }),
  guidelines: z.literal(true, { error: "Acknowledge the community guidelines." }),
});

export const reasonSchema = z.object({ reason: z.string().trim().min(8, "Give a reason of at least 8 characters so the contributor understands.").max(400) });
export const reportSchema = z.object({ reason: z.string().min(1, "Choose a reason."), details: z.string().max(300).optional() });

export const nominationSchema = z.object({
  nomineeName: z.string().trim().min(3, "Enter the nominee's full name."),
  contact: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  districtId: z.string().min(1, "Choose a district."),
  acId: z.string().optional(),
  wardId: z.string().optional(),
  rationale: z.string().trim().min(15, "Explain why this person is a good fit (at least 15 characters).").max(500),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(4, "Add a title (at least 4 characters).").max(90),
  body: z.string().trim().min(20, "Write a message of at least 20 characters.").max(600),
  audience: z.enum(["all", "district", "ac", "ward"]),
  districtId: z.string().optional(),
  acId: z.string().optional(),
  wardId: z.string().optional(),
  schedule: z.boolean(),
});

export const eventSchema = z.object({
  title: z.string().trim().min(4, "Add a title (at least 4 characters)."),
  category: z.enum(["meetup", "screening", "workshop", "welfare", "celebration"]),
  summary: z.string().trim().min(10, "Add a one-line summary."),
  purpose: z.string().trim().min(20, "Describe the purpose (at least 20 characters)."),
  date: z.string().min(1, "Choose a date."),
  start: z.string().min(1, "Choose a start time."),
  end: z.string().min(1, "Choose an end time."),
  venue: z.string().trim().min(4, "Add a venue."),
  districtId: z.string().min(1, "Choose a district."),
  acId: z.string().min(1, "Choose an AC."),
  wardId: z.string().min(1, "Choose a ward."),
  capacity: z.coerce.number().int("Whole numbers only.").min(1, "Capacity must be at least 1.").max(5000),
  eligibility: z.string().trim().min(4, "Describe who can attend."),
  accessibility: z.string().trim().min(4, "Add accessibility details."),
  requiresMembership: z.boolean(),
}).refine((v) => v.end > v.start, { path: ["end"], message: "End time must be after the start time." });

export const messageSchema = z.object({ body: z.string().trim().min(1, "Write a message first.").max(1000) });
export const albumSchema = z.object({
  title: z.string().trim().min(3, "Album title needs at least 3 characters."),
  description: z.string().trim().min(10, "Add a short description."),
  category: z.enum(["stills", "bts", "posters", "events", "promo"]),
  rights: z.string().trim().min(10, "Add rights and attribution metadata (at least 10 characters)."),
});
export const rewardReasonSchema = z.object({ reason: z.string().trim().min(8, "Add a reason (at least 8 characters) for the audit log.") });
