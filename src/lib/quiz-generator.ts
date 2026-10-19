import type { Difficulty, Quiz, QuizQuestion } from "@/types";
import { MOVIES } from "@/data/seeds/content";
import { hash } from "@/lib/utils";

export interface GenerationInput { subject: string; difficulty: Difficulty; count: number; tone: "playful" | "classic" | "challenging" }

const shuffle = <T,>(arr: T[], seed: number): T[] => {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const place = (correct: string, wrong: string[], seed: number): { options: string[]; correctIndex: number } => {
  const options = shuffle([correct, ...wrong.slice(0, 3)], seed);
  return { options, correctIndex: options.indexOf(correct) };
};
const lead: Record<GenerationInput["tone"], string> = { playful: "Quick one: ", classic: "", challenging: "Think carefully: " };

/** Deterministic mock "AI". Same inputs always return the same draft. */
export function generateDraftQuestions(input: GenerationInput): QuizQuestion[] {
  const movie = MOVIES.find((m) => m.id === input.subject);
  const out: QuizQuestion[] = [];
  const seed = hash(`${input.subject}|${input.difficulty}|${input.tone}`);
  const builders: ((i: number) => Omit<QuizQuestion, "id" | "difficulty">)[] = [];
  if (movie) {
    const years = [movie.year - 2, movie.year - 1, movie.year + 1, movie.year + 2].map(String);
    builders.push(
      (i) => ({ prompt: `${lead[input.tone]}In which year was ${movie.title} released?`, ...place(String(movie.year), years, seed + i), explanation: `${movie.title} is listed as a ${movie.year} release in the demo catalogue.`, category: movie.title }),
      (i) => ({ prompt: `${lead[input.tone]}What is Pradeep Ranganathan's listed role in ${movie.title}?`, ...place(movie.role, ["Cinematographer", "Music director", "Editor"], seed + i), explanation: `The demo catalogue lists his role as: ${movie.role}.`, category: movie.title }),
      (i) => ({ prompt: `${lead[input.tone]}Which genre best describes ${movie.title}?`, ...place(movie.genres[0], ["Horror", "Documentary", "War"], seed + i), explanation: `Demo catalogue genre: ${movie.genres.join(", ")}.`, category: movie.title }),
    );
  }
  const generic: [string, string, string[], string][] = [
    ["Which part of PR Show is for official and approved media?", "The PR tab", ["Direct messages", "Checkout", "Settings only"], "The PR tab holds movies and the official gallery."],
    ["What must happen before a fan reel appears in the feed?", "A moderator approves it", ["It gets 100 likes", "It is shared once", "Nothing"], "Fan reels remain private until approved."],
    ["Which rewards in PR Show are simulated?", "Movie passes and event tickets", ["Only wallpapers", "None", "Quiz questions"], "Passes and tickets are simulated demo rewards."],
    ["Who can message inside PR Show?", "Admins only", ["Any fan", "Verified fans", "Only reel creators"], "Messaging is admin-only."],
    ["What does the tagline say?", "Beyond the Screen.", ["Lights, Camera.", "Fans Forever.", "Only Cinema."], "The product tagline is “Beyond the Screen.”"],
    ["The leaderboard ranks…", "Individuals", ["Fan clubs head-to-head", "Districts only", "Admins"], "Leaderboards are individual only."],
    ["Membership becomes active when…", "An admin approves it", ["You finish the form", "You play a quiz", "You RSVP"], "Approval is always manual."],
  ];
  generic.forEach(([prompt, correct, wrong, explanation], gi) => builders.push((i) => ({ prompt: `${lead[input.tone]}${prompt}`, ...place(correct, wrong, seed + i + gi), explanation, category: movie ? "Community" : input.subject })));
  const n = Math.max(1, Math.min(input.count, builders.length));
  for (let i = 0; i < n; i++) {
    const b = builders[i](i);
    out.push({ id: `gen-${seed.toString(36)}-${i + 1}`, difficulty: input.difficulty, ...b });
  }
  return out;
}

export interface QuizValidationIssue { questionIndex: number | null; field: string; message: string }
export function validateQuiz(quiz: Pick<Quiz, "title" | "questions">): QuizValidationIssue[] {
  const issues: QuizValidationIssue[] = [];
  if (!quiz.title.trim()) issues.push({ questionIndex: null, field: "title", message: "Quiz title is required." });
  if (quiz.questions.length === 0) issues.push({ questionIndex: null, field: "questions", message: "Add at least one question." });
  quiz.questions.forEach((q, i) => {
    if (!q.prompt.trim()) issues.push({ questionIndex: i, field: "prompt", message: "Question text is missing." });
    const trimmed = q.options.map((o) => o.trim().toLowerCase());
    if (trimmed.some((o) => !o)) issues.push({ questionIndex: i, field: "options", message: "Every answer option needs text." });
    if (new Set(trimmed.filter(Boolean)).size !== trimmed.filter(Boolean).length) issues.push({ questionIndex: i, field: "options", message: "Answer options must be unique." });
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) issues.push({ questionIndex: i, field: "correctIndex", message: "Choose a valid correct answer." });
    if (!q.explanation.trim()) issues.push({ questionIndex: i, field: "explanation", message: "Add a short explanation." });
  });
  return issues;
}
