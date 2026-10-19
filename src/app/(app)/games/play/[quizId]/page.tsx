"use client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { QuizPlayer } from "@/features/games/components";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { useLastResult } from "@/stores/last-result";
import { PageHeader } from "@/components/data-display";

export default function PlayPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const setLast = useLastResult((s) => s.set);
  const q = useApiQuery(["quiz", quizId], () => fan.getQuiz(quizId));
  const submit = useApiMutation((v: { answers: number[]; dur: number }) => fan.submitAttempt(userId!, quizId, v.answers, v.dur), {
    onSuccess: (r) => { setLast(r.attempt.id, r.newBadges); router.replace(`/games/result/${r.attempt.id}`); },
  });
  return (
    <div>
      <PageHeader backHref="/games" backLabel="Quit to Fan Arena" title="" />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {(quiz) => <QuizPlayer quiz={quiz} submitting={submit.isPending} onFinish={(answers, dur) => submit.mutate({ answers, dur })} />}
      </QueryBoundary>
    </div>
  );
}
