"use client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Timer } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { Switch } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types";

export function QuizProgress({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <Progress value={((index) / total) * 100} label={`Question ${index + 1} of ${total}`} className="flex-1" />
      <span className="text-sm font-medium tabular-nums text-muted-fg">{index + 1}/{total}</span>
    </div>
  );
}

export function AnswerOption({ letter, text, state, onSelect, disabled }: { letter: string; text: string; state: "idle" | "correct" | "wrong" | "dim"; onSelect: () => void; disabled: boolean }) {
  return (
    <motion.button
      type="button" role="radio" aria-checked={state === "correct" || state === "wrong"} disabled={disabled} onClick={onSelect}
      animate={state === "wrong" ? { x: [0, -8, 8, -5, 5, 0] } : state === "correct" ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 0.4 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn("flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 text-left text-[1rem] font-medium transition-colors disabled:cursor-default",
        state === "idle" && "border-border bg-surface hover:border-fg/40", state === "correct" && "border-success bg-success-soft", state === "wrong" && "border-danger bg-danger-soft", state === "dim" && "border-border bg-surface opacity-50")}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", state === "correct" ? "bg-success text-white dark:text-ink" : state === "wrong" ? "bg-danger text-white dark:text-ink" : "bg-muted text-muted-fg")} aria-hidden>{letter}</span>
      <span className="flex-1">{text}</span>
      {state === "correct" && <><CheckCircle weight="fill" className="size-6 text-success" aria-hidden /><span className="sr-only">Correct answer</span></>}
      {state === "wrong" && <><XCircle weight="fill" className="size-6 text-danger" aria-hidden /><span className="sr-only">Incorrect answer</span></>}
    </motion.button>
  );
}

const SECONDS = 20;
/** One question at a time. Keys 1–4 choose an answer; Enter moves on. Timer is optional and off by default. */
export function QuizPlayer({ quiz, onFinish, submitting, label }: { quiz: Quiz; onFinish: (answers: number[], durationSec: number) => void; submitting?: boolean; label?: string }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timerOn, setTimerOn] = useState(false);
  const [left, setLeft] = useState(SECONDS);
  const started = useRef(0);
  const q = quiz.questions[i];
  const last = i === quiz.questions.length - 1;
  const locked = picked !== null;

  useEffect(() => { started.current = performance.now(); }, []);
  const choose = (idx: number) => { if (locked) return; setPicked(idx); };
  const next = () => {
    if (!locked) return;
    const all = [...answers, picked!];
    if (last) { onFinish(all, Math.max(1, Math.round((performance.now() - started.current) / 1000))); setAnswers(all); return; }
    setAnswers(all); setPicked(null); setLeft(SECONDS); setI(i + 1);
  };

  useEffect(() => {
    if (!timerOn || locked || submitting) return;
    if (left <= 0) { setPicked(-1); return; }
    const id = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerOn, left, locked, submitting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key >= "1" && e.key <= String(q.options.length)) choose(Number(e.key) - 1);
      if (e.key === "Enter" && locked && !submitting) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const correct = picked === q.correctIndex;
  return (
    <div className="mx-auto max-w-2xl">
      <QuizProgress index={i} total={quiz.questions.length} />
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{label ?? quiz.title}</p>
        <div className="flex items-center gap-3">
          {timerOn && <span aria-live="off" className={cn("flex items-center gap-1 text-sm font-semibold tabular-nums", left <= 5 && "text-danger")}><Timer className="size-4" aria-hidden />{left}s</span>}
          <div className="w-44"><Switch checked={timerOn} onChange={(v) => { setTimerOn(v); setLeft(SECONDS); }} label="Timer" description="Optional, 20s" /></div>
        </div>
      </div>
      <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <h2 className="font-display mt-4 text-[1.7rem] leading-snug font-semibold sm:text-3xl">{q.prompt}</h2>
        {q.clue && <p className="mt-2 rounded-xl bg-gold-soft px-3 py-2 text-sm text-gold">{q.clue}</p>}
        <div role="radiogroup" aria-label="Answer options" className="mt-6 space-y-3">
          {q.options.map((o, idx) => (
            <AnswerOption key={idx} letter={String(idx + 1)} text={o} disabled={locked}
              state={!locked ? "idle" : idx === q.correctIndex ? "correct" : idx === picked ? "wrong" : "dim"} onSelect={() => choose(idx)} />
          ))}
        </div>
      </motion.div>
      <div aria-live="polite" className="mt-5 min-h-24">
        {locked && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-2xl p-4 text-sm", correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            <p className="font-semibold">{picked === -1 ? "Time's up" : correct ? "Correct!" : "Not quite"}</p>
            <p className="mt-0.5 text-fg/80">{q.explanation}</p>
          </motion.div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="hidden text-xs text-muted-fg sm:block">Tip: press 1–{q.options.length} to answer, Enter to continue.</p>
        <Button size="lg" className="ml-auto" disabled={!locked} loading={submitting} onClick={next}>{last ? "See my result" : "Next question"}</Button>
      </div>
    </div>
  );
}

export function ScoreRing({ score, total }: { score: number; total: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = total ? score / total : 0;
  return (
    <div className="relative grid size-40 place-items-center" role="img" aria-label={`Score ${score} out of ${total}`}>
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <motion.circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-accent" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 0.9, ease: "easeOut" }} />
      </svg>
      <div className="absolute text-center"><p className="font-display text-4xl font-bold">{score}<span className="text-xl text-muted-fg">/{total}</span></p></div>
    </div>
  );
}
