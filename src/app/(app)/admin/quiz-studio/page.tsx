"use client";
import { Plus, Robot, Sparkle, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { QueryBoundary, EmptyState, ErrorState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { Badge, DemoContentBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { InfoBanner, PolicyNote } from "@/features/admin/components";
import { QuizPlayer } from "@/features/games/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { canPublishQuiz } from "@/lib/permissions/policy";
import { validateQuiz, type GenerationInput } from "@/lib/quiz-generator";
import { MODE_LABEL } from "@/features/games/history-list";
import { cn } from "@/lib/utils";
import type { Difficulty, GameMode, Quiz, QuizQuestion } from "@/types";

const SUBJECTS = [{ v: "movie-comali", l: "Comali" }, { v: "movie-love-today", l: "Love Today" }, { v: "movie-dragon", l: "Dragon" }, { v: "Community & app basics", l: "Category: Community basics" }];

function QuestionEditor({ q, i, onChange, onRemove, issues, locked }: { q: QuizQuestion; i: number; onChange: (q: QuizQuestion) => void; onRemove: () => void; issues: string[]; locked: boolean }) {
  return (
    <fieldset disabled={locked} className="space-y-3 rounded-2xl border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Question {i + 1}</legend>
      <Field label="Question text" error={issues.find((m) => m.includes("Question text"))}>{(p) => <Textarea {...p} rows={2} value={q.prompt} onChange={(e) => onChange({ ...q, prompt: e.target.value })} />}</Field>
      <div role="radiogroup" aria-label={`Answer options for question ${i + 1}`} className="space-y-2">
        <p className="text-sm font-medium">Answers <span className="font-normal text-muted-fg">(select the correct one)</span></p>
        {q.options.map((o, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === idx} onChange={() => onChange({ ...q, correctIndex: idx })} aria-label={`Mark option ${idx + 1} as correct`} className="size-5 cursor-pointer accent-[var(--accent)]" />
            <Input aria-label={`Option ${idx + 1}`} value={o} onChange={(e) => onChange({ ...q, options: q.options.map((x, j) => (j === idx ? e.target.value : x)) })} aria-invalid={!o.trim() || undefined} />
          </div>
        ))}
        {issues.filter((m) => m.includes("option") || m.includes("correct")).map((m) => <p key={m} role="alert" className="text-xs font-medium text-danger">{m}</p>)}
      </div>
      <Field label="Explanation" error={issues.find((m) => m.includes("explanation"))}>{(p) => <Input {...p} value={q.explanation} onChange={(e) => onChange({ ...q, explanation: e.target.value })} />}</Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Category">{(p) => <Input {...p} value={q.category} onChange={(e) => onChange({ ...q, category: e.target.value })} />}</Field><Field label="Difficulty">{(p) => <Select {...p} value={q.difficulty} onChange={(e) => onChange({ ...q, difficulty: e.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select>}</Field></div>
      {!locked && <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={onRemove}><Trash className="size-4" aria-hidden />Remove question</Button>}
    </fieldset>
  );
}

export default function QuizStudio() {
  const { adminId, admin } = useAdmin();
  const list = useApiQuery(["admin-quizzes"], () => adminApi.adminListQuizzes());
  const [gen, setGen] = useState<GenerationInput>({ subject: "movie-love-today", difficulty: "medium", count: 5, tone: "playful" });
  const [draft, setDraft] = useState<Quiz | null>(null);
  const [dirty, setDirty] = useState(false);
  const [approved, setApproved] = useState(false);
  const [confirmPub, setConfirmPub] = useState(false);
  const [preview, setPreview] = useState<null | { done: false } | { done: true; score: number }>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const generate = useApiMutation((i: GenerationInput) => adminApi.generateQuiz(adminId, i), { silentError: true, success: "Mock-AI draft generated. Review it carefully.", onSuccess: (q) => { setDraft(structuredClone(q)); setDirty(false); setApproved(false); } });
  const blank = useApiMutation(() => adminApi.createBlankQuiz(adminId), { onSuccess: (q) => { setDraft(structuredClone(q)); setDirty(false); setApproved(false); } });
  const save = useApiMutation(() => adminApi.saveQuiz(adminId, draft!), { success: "Draft saved", onSuccess: () => setDirty(false) });
  const publish = useApiMutation(() => adminApi.publishQuiz(adminId, draft!.id, approved), { success: "Quiz published to Fan Arena", onSuccess: (q) => { setDraft(structuredClone(q)); setConfirmPub(false); setApproved(false); } });

  const issues = useMemo(() => (draft ? validateQuiz(draft) : []), [draft]);
  const policy = admin ? canPublishQuiz(admin.role) : { allowed: false };
  const locked = draft?.status === "published";
  const edit = (patch: Partial<Quiz>) => { setDraft((d) => (d ? { ...d, ...patch } : d)); setDirty(true); };
  const open = (q: Quiz) => { if (dirty) setPendingSwitch(q); else { setDraft(structuredClone(q)); setApproved(false); } };
  const issuesFor = (idx: number) => issues.filter((x) => x.questionIndex === idx).map((x) => x.message);

  return (
    <div>
      <PageHeader title="Quiz Studio" subtitle="Draft quizzes with a mock AI helper, edit every question, preview the fan experience, then publish after an explicit review." actions={<DemoContentBadge label="Mock AI · no external calls" />} />
      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-8">
          <Card className="space-y-4"><h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkle weight="fill" className="size-5 text-accent" aria-hidden />Generate a draft</h2>
            <Field label="Movie or category">{(p) => <Select {...p} value={gen.subject} onChange={(e) => setGen({ ...gen, subject: e.target.value })}>{SUBJECTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</Select>}</Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Difficulty">{(p) => <Select {...p} value={gen.difficulty} onChange={(e) => setGen({ ...gen, difficulty: e.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select>}</Field><Field label="Questions">{(p) => <Select {...p} value={gen.count} onChange={(e) => setGen({ ...gen, count: Number(e.target.value) })}>{[3, 4, 5, 6, 8, 10].map((n) => <option key={n}>{n}</option>)}</Select>}</Field></div>
            <Field label="Tone">{(p) => <Select {...p} value={gen.tone} onChange={(e) => setGen({ ...gen, tone: e.target.value as GenerationInput["tone"] })}><option value="playful">Playful</option><option value="classic">Classic</option><option value="challenging">Challenging</option></Select>}</Field>
            <Button className="w-full" loading={generate.isPending} onClick={() => generate.mutate(gen)}><Robot className="size-5" aria-hidden />Generate draft</Button>
            {generate.isError && <ErrorState error={generate.error} onRetry={() => generate.mutate(gen)} title="Generation failed" className="py-5" />}
            <Button variant="ghost" className="w-full" loading={blank.isPending} onClick={() => blank.mutate()}><Plus className="size-4" aria-hidden />Start a blank quiz</Button>
          </Card>
          <section aria-labelledby="ql"><SectionHeading title="All quizzes" as="h3" />
            <QueryBoundary query={list} skeleton={<LoadingSkeleton count={3} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No quizzes yet" body="Generate your first draft." />}>
              {(qs) => <ul id="ql" className="space-y-2">{qs.map((q) => <li key={q.id}><button onClick={() => open(q)} aria-pressed={draft?.id === q.id} className={cn("w-full cursor-pointer rounded-2xl border p-3 text-left transition-colors", draft?.id === q.id ? "border-accent bg-accent-soft/50" : "border-border bg-surface hover:bg-muted")}><p className="truncate font-medium">{q.title}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-fg"><StatusBadge status={q.status} />{q.questions.length} questions{q.aiGenerated && <Badge tone="gold">Mock AI</Badge>}</p></button></li>)}</ul>}
            </QueryBoundary>
          </section>
        </div>

        <div>
          {!draft ? <EmptyState icon={<Sparkle className="size-7" weight="duotone" aria-hidden />} title="Pick a quiz or generate a draft" body="Your editor appears here. Nothing is published until you explicitly approve it." /> : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={draft.status} />{draft.aiGenerated && <Badge tone="gold"><Robot className="size-3.5" aria-hidden />Mock-AI generated, human review required</Badge>}{dirty && <Badge tone="warning">Unsaved changes</Badge>}</div>
              {locked && <InfoBanner>This quiz is published and can&apos;t be edited.</InfoBanner>}
              <Card className="space-y-4">
                <Field label="Quiz title" error={issues.find((x) => x.field === "title")?.message}>{(p) => <Input {...p} disabled={locked} value={draft.title} onChange={(e) => edit({ title: e.target.value })} />}</Field>
                <Field label="Short description">{(p) => <Input {...p} disabled={locked} value={draft.blurb} onChange={(e) => edit({ blurb: e.target.value })} />}</Field>
                <div className="grid gap-3 sm:grid-cols-2"><Field label="Game category">{(p) => <Select {...p} disabled={locked} value={draft.mode} onChange={(e) => edit({ mode: e.target.value as GameMode })}>{(["trivia", "dialogue", "scene", "song"] as GameMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}</Select>}</Field><Field label="Overall difficulty">{(p) => <Select {...p} disabled={locked} value={draft.difficulty} onChange={(e) => edit({ difficulty: e.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select>}</Field></div>
              </Card>
              {draft.questions.length === 0 && <EmptyState title="No questions" body="Add the first question." />}
              {draft.questions.map((q, i) => <QuestionEditor key={q.id} q={q} i={i} locked={!!locked} issues={issuesFor(i)} onChange={(nq) => edit({ questions: draft.questions.map((x, j) => (j === i ? nq : x)) })} onRemove={() => edit({ questions: draft.questions.filter((_, j) => j !== i) })} />)}
              {!locked && <Button variant="outline" onClick={() => edit({ questions: [...draft.questions, { id: `q-new-${draft.questions.length + 1}-${Date.now()}`, prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", category: "Movies", difficulty: "easy" }] })}><Plus className="size-4" aria-hidden />Add question</Button>}
              <div aria-live="polite">{issues.length > 0 && !locked && <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">{issues.length} issue{issues.length > 1 ? "s" : ""} to fix before this can be published{issues.find((x) => x.questionIndex === null) ? `: ${issues.find((x) => x.questionIndex === null)!.message}` : "."}</p>}</div>
              <Card className="space-y-4">
                <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={draft.questions.length === 0} onClick={() => setPreview({ done: false })}>Preview as a fan</Button>{!locked && <Button variant="outline" loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>Save draft</Button>}</div>
                {!locked && (
                  <div className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Publish</h3>
                    <Checkbox checked={approved} onChange={(e) => setApproved(e.target.checked)} disabled={!policy.allowed} label="I've reviewed every question, answer and explanation, and approve this quiz for fans." />
                    <Button disabled={!policy.allowed || !approved || issues.length > 0 || dirty} onClick={() => setConfirmPub(true)}>Publish quiz</Button>
                    {dirty && <p className="text-xs text-muted-fg">Save your draft before publishing.</p>}
                    <PolicyNote policy={policy} />
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog open={confirmPub} onClose={() => setConfirmPub(false)} loading={publish.isPending} onConfirm={() => publish.mutate()} title="Publish this quiz?" description="It becomes playable in Fan Arena immediately. Published quizzes can't be edited." confirmLabel="Publish" />
      <ConfirmDialog open={!!pendingSwitch} onClose={() => setPendingSwitch(null)} onConfirm={() => { if (pendingSwitch) { setDraft(structuredClone(pendingSwitch)); setDirty(false); setApproved(false); } setPendingSwitch(null); }} tone="danger" title="Discard unsaved changes?" description="You have edits that haven't been saved." confirmLabel="Discard and switch" />
      <Modal open={preview !== null} onClose={() => setPreview(null)} title="Fan preview" description="Nothing is recorded. This is how fans will play it." size="lg" sheet={false}>
        {draft && preview && (preview.done ? <div className="py-6 text-center"><p className="font-display text-5xl font-semibold">{preview.score}/{draft.questions.length}</p><p className="mt-2 text-muted-fg">Preview complete.</p><Button className="mt-4" onClick={() => setPreview({ done: false })}>Play again</Button></div> : <QuizPlayer key={String(preview.done)} quiz={draft} label="Preview" onFinish={(answers) => setPreview({ done: true, score: draft.questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0) })} />)}
      </Modal>
    </div>
  );
}
