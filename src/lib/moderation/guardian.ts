import type { AIContentGuardianResult, GuardianCategory, GuardianFlag } from "@/types";
import { hash } from "@/lib/utils";

/** Mock analysis only. Deterministic keyword heuristics — NOT a real model. */
const LEXICON: Record<GuardianCategory, { words: string[]; why: string }> = {
  privacy: { words: ["address", "my number", "phone number", "whatsapp", "home at", "98xx", "aadhaar"], why: "Mentions personal contact or location details that could expose a private individual." },
  spam: { words: ["dm me", "cheap price", "extra tickets", "click here", "free tickets", "subscribe"], why: "Looks like promotion or resale rather than community participation." },
  copyright: { words: ["clips cut", "mashup", "background music", "full song", "ripped"], why: "May reuse film clips or music without rights clearance." },
  harassment: { words: ["idiot", "loser", "shut up", "stupid"], why: "Contains language that may target or demean another person." },
  hate: { words: ["hate all", "go back to"], why: "May contain hateful language about a group." },
  violence: { words: ["kill", "beat up", "attack"], why: "References violence." },
  sexual: { words: ["explicit", "nsfw"], why: "May include sexual content." },
  misinformation: { words: ["leaked", "confirmed release", "guaranteed", "insider says"], why: "Makes unverified claims about releases or official plans." },
};

export function analyseText(caseId: string, text: string, now: number): AIContentGuardianResult {
  const lower = text.toLowerCase();
  const flags: GuardianFlag[] = [];
  (Object.keys(LEXICON) as GuardianCategory[]).forEach((cat) => {
    const hit = LEXICON[cat].words.find((w) => lower.includes(w));
    if (!hit) return;
    const idx = lower.indexOf(hit);
    const excerpt = text.slice(Math.max(0, idx - 18), Math.min(text.length, idx + hit.length + 18)).trim();
    const confidence = Math.min(0.93, 0.52 + (hash(caseId + cat) % 30) / 100);
    flags.push({ category: cat, confidence: Math.round(confidence * 100) / 100, excerpt, explanation: LEXICON[cat].why });
  });
  const riskScore = flags.length ? Math.min(0.95, Math.max(...flags.map((f) => f.confidence)) + (flags.length - 1) * 0.04) : 0.08 + (hash(caseId) % 8) / 100;
  const top = [...flags].sort((a, b) => b.confidence - a.confidence)[0];
  let recommended: AIContentGuardianResult["recommended"] = "approve";
  let rationale = "No concerns detected by the mock analysis. A human should still review the media itself.";
  if (top) {
    if (["privacy", "copyright"].includes(top.category)) { recommended = "needs_correction"; rationale = `Possible ${top.category} concern. Ask the contributor to edit and resubmit.`; }
    else if (["violence", "hate", "sexual", "harassment", "spam"].includes(top.category)) { recommended = top.confidence > 0.7 ? "reject" : "escalate"; rationale = `Possible ${top.category} content. ${recommended === "escalate" ? "Confidence is moderate, so a senior review is suggested." : "Guidelines may be breached."}`; }
    else { recommended = "escalate"; rationale = "Unverified claims are hard to judge automatically. A senior review is suggested."; }
  }
  return { id: `ai-${caseId}`, caseId, analysedAt: now, flags, riskScore: Math.round(riskScore * 100) / 100, recommended, rationale };
}
