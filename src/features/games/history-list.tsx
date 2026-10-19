"use client";
import Link from "next/link";
import { QueryBoundary, EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { buttonStyles } from "@/components/ui/button";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtDateTime } from "@/lib/utils";

export const MODE_LABEL: Record<string, string> = { trivia: "Movie trivia", dialogue: "Dialogue guess", scene: "Scene guess", song: "Song guess", daily: "Daily challenge", onboarding: "Welcome quiz" };

export function QuizHistoryList() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["attempts"], () => fan.listAttempts(userId!), !!userId);
  return (
    <QueryBoundary query={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No quizzes played yet" body="Your results and personal bests will appear here." action={<Link href="/games" className={buttonStyles()}>Play a quiz</Link>} />}>
      {(list) => {
        const best = Math.max(...list.map((a) => a.score / a.total));
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-fg">{list.length} attempt{list.length === 1 ? "" : "s"} · personal best {Math.round(best * 100)}%</p>
            <ul className="space-y-3">
              {list.map((a) => (
                <li key={a.id}><Link href={`/games/result/${a.id}`} className="block"><Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-card">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft font-display text-xl font-bold text-accent">{a.score}/{a.total}</div>
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{a.quizTitle}</p><p className="text-sm text-muted-fg">{MODE_LABEL[a.mode]} · {fmtDateTime(a.completedAt)}</p></div>
                  <Badge tone="gold">+{a.points} pts</Badge>
                </Card></Link></li>
              ))}
            </ul>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
