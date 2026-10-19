"use client";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { GAME_MODES } from "@/data/seeds/content";
import { quizImage } from "@/data/images";


export default function ModePage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = use(params);
  const m = GAME_MODES.find((x) => x.mode === mode);
  if (!m) notFound();
  const q = useApiQuery(["quizzes"], () => fan.listPublishedQuizzes());
  return (
    <div>
      <PageHeader backHref="/games" backLabel="Fan Arena" eyebrow="Game category" title={m.name} subtitle={m.blurb} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" />} isEmpty={(d) => d.filter((x) => x.mode === mode).length === 0} empty={<EmptyState title="No quizzes here yet" body="New challenges are published by the admin team after review." />}>
        {(list) => (
          <ul className="grid gap-4 sm:grid-cols-2">
            {list.filter((x) => x.mode === mode).map((quiz) => (
              <li key={quiz.id}><Link href={`/games/challenge/${quiz.id}`} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface hover:shadow-card">
                <DemoArt hue={quiz.hue} src={quizImage(quiz)} ratio="16/7" rounded={false} label={false} />
                <div className="p-5"><h3 className="text-xl font-semibold">{quiz.title}</h3><p className="mt-1 text-sm text-muted-fg">{quiz.blurb}</p><div className="mt-3 flex gap-2"><Badge>{quiz.questions.length} questions</Badge><Badge tone="gold" className="capitalize">{quiz.difficulty}</Badge></div></div>
              </Link></li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
