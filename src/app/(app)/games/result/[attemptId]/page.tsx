"use client";
import { ArrowCounterClockwise, Medal, ShareNetwork } from "@phosphor-icons/react";
import Link from "next/link";
import { use } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/features/games/components";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useLastResult } from "@/stores/last-result";
import { toast } from "@/stores/toast";
import { motion } from "framer-motion";

export default function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const q = useApiQuery(["attempt", attemptId], () => fan.getAttempt(attemptId));
  const last = useLastResult();
  const fresh = last.attemptId === attemptId ? last.newBadges : [];
  const share = async (text: string) => {
    try {
      if (navigator.share) await navigator.share({ title: "PR Show", text });
      else { await navigator.clipboard.writeText(text); toast.success("Result copied to clipboard"); }
    } catch { /* user dismissed the share sheet */ }
  };
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ attempt: a, quiz, personalBest }) => {
        const pct = Math.round((a.score / a.total) * 100);
        const msg = pct === 100 ? "Flawless!" : pct >= 60 ? "Nicely done" : "Good effort. Every round teaches something.";
        return (
          <div className="mx-auto max-w-2xl text-center">
            <PageHeader backHref="/games" backLabel="Fan Arena" title="" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <ScoreRing score={a.score} total={a.total} />
              <h1 className="mt-5 text-4xl font-semibold">{msg}</h1>
              <p className="mt-1 text-muted-fg">{a.quizTitle} · {a.durationSec}s</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2"><Badge tone="gold">+{a.points} points</Badge><Badge>Personal best {personalBest}/{a.total}</Badge>{a.score === personalBest && a.score > 0 && <Badge tone="success">Matches your best</Badge>}</div>
            </motion.div>
            {fresh.length > 0 && (
              <Card className="mt-8 text-left"><p className="flex items-center gap-2 font-semibold"><Medal weight="fill" className="size-5 text-accent" aria-hidden />New badge{fresh.length > 1 ? "s" : ""} earned</p>
                <ul className="mt-3 space-y-2">{fresh.map((b) => <li key={b.id} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full text-white" style={{ background: `hsl(${b.hue} 65% 42%)` }}><Medal weight="fill" className="size-5" aria-hidden /></span><div><p className="font-medium">{b.name}</p><p className="text-sm text-muted-fg">{b.description}</p></div></li>)}</ul>
              </Card>
            )}
            {quiz && (
              <section className="mt-8 text-left"><h2 className="mb-3 text-lg font-semibold">Review</h2>
                <ol className="space-y-3">{quiz.questions.map((qq, i) => { const ok = a.answers[i] === qq.correctIndex; return (
                  <li key={qq.id} className="rounded-2xl border border-border bg-surface p-4"><p className="text-sm font-medium"><span className={ok ? "text-success" : "text-danger"}>{ok ? "✓ Correct" : "✗ Missed"}</span> · {qq.prompt}</p><p className="mt-1 text-sm text-muted-fg">Answer: {qq.options[qq.correctIndex]}. {qq.explanation}</p></li>
                ); })}</ol>
              </section>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/games/play/${a.quizId}`} className={buttonStyles({ variant: "outline" })}><ArrowCounterClockwise className="size-4" aria-hidden />Try again</Link>
              <Button variant="outline" onClick={() => share(`I scored ${a.score}/${a.total} on “${a.quizTitle}” in PR Show. Beyond the Screen.`)}><ShareNetwork className="size-4" aria-hidden />Share result</Button>
              <Link href="/games/leaderboard" className={buttonStyles()}>View leaderboard</Link>
            </div>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
