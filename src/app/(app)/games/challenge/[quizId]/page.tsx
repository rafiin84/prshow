"use client";
import Link from "next/link";
import { use } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge, DemoContentBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { MODE_LABEL } from "@/features/games/history-list";
import { useSession } from "@/stores/session";

export default function ChallengeDetail({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["quiz", quizId], () => fan.getQuiz(quizId));
  const hist = useApiQuery(["attempts"], () => fan.listAttempts(userId!), !!userId);
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {(quiz) => {
        const mine = (hist.data ?? []).filter((a) => a.quizId === quiz.id);
        const best = mine.reduce((m, a) => Math.max(m, a.score), 0);
        return (
          <div className="mx-auto max-w-3xl">
            <PageHeader backHref={`/games/mode/${quiz.mode === "daily" || quiz.mode === "onboarding" ? "trivia" : quiz.mode}`} backLabel="Back" eyebrow={MODE_LABEL[quiz.mode]} title={quiz.title} subtitle={quiz.blurb} />
            <DemoArt hue={quiz.hue} ratio="21/8" label={false} className="mb-6" />
            <div className="mb-6 flex flex-wrap gap-2"><Badge>{quiz.questions.length} questions</Badge><Badge tone="gold" className="capitalize">{quiz.difficulty}</Badge><Badge tone="accent">Up to {quiz.questions.length * 10} pts</Badge>{quiz.aiGenerated && <DemoContentBadge label="Mock-AI drafted" />}</div>
            <Card><h2 className="text-lg font-semibold">How it works</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-fg"><li>One question at a time. You&apos;ll see the answer and a short explanation straight away.</li><li>Keyboard friendly: press 1–4 to answer, Enter to continue.</li><li>An optional 20-second timer can be switched on while you play.</li></ul></Card>
            {mine.length > 0 && <p className="mt-4 text-sm text-muted-fg">You&apos;ve played this {mine.length}×. Personal best: <strong className="text-fg">{best}/{quiz.questions.length}</strong></p>}
            <Link href={`/games/play/${quiz.id}`} className={buttonStyles({ size: "lg" }) + " mt-6 w-full sm:w-auto"}>Start quiz</Link>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
