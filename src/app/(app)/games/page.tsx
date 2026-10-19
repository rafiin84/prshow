"use client";
import { ArrowRight, Trophy, Flame, ClockCounterClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { GAME_MODES } from "@/data/seeds/content";
import { useSession } from "@/stores/session";
import { MODE_LABEL } from "@/features/games/history-list";
import { MODE_IMAGE } from "@/data/images";


export default function GamesHome() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["games-home"], () => fan.getGamesHome(userId!), !!userId);
  return (
    <div>
      <PageHeader eyebrow="PR Fan Arena" title="Play, learn, earn" subtitle="Quick quizzes with no pressure. Points reward real play, and the leaderboard ranks individuals only." actions={<Link href="/games/leaderboard" className={buttonStyles({ variant: "outline" })}><Trophy className="size-4" aria-hidden />Leaderboard</Link>} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" count={4} />}>
        {(g) => (
          <div className="space-y-10">
            <Link href="/games/play/quiz-daily" className="relative block overflow-hidden rounded-[var(--radius-xl)] bg-ink p-7 text-on-ink sm:p-10">
              <DemoArt hue={12} rounded={false} label={false} src="/images/sections/games.jpg" className="absolute inset-0" /><div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-ink/20" />
              <div className="relative max-w-lg">
                <Badge tone="gold">Daily challenge</Badge>
                <h2 className="font-display mt-3 text-4xl leading-tight font-semibold sm:text-5xl">{g.dailyDone ? "You're done for today" : "Today's three questions"}</h2>
                <p className="mt-2 text-on-ink/75">{g.dailyDone ? "Come back tomorrow for a fresh set. Use the Demo menu to reset it for testing." : "A quick warm-up that takes about a minute."}</p>
                <span className={buttonStyles({ size: "lg" }) + " mt-6"}>{g.dailyDone ? "Review games" : "Play daily challenge"}<ArrowRight className="size-5" aria-hidden /></span>
              </div>
            </Link>

            <section aria-label="Your stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Points", g.points], ["Quizzes played", g.attempts], ["Quiz points", g.quizPoints], ["Day streak", g.streak]].map(([l, v]) => (
                <Card key={l as string} className="p-4"><p className="text-sm text-muted-fg">{l}</p><p className="font-display text-3xl font-semibold">{v}</p></Card>
              ))}
              <p className="col-span-full -mt-1 flex items-center gap-2 text-xs text-muted-fg"><Flame className="size-4" aria-hidden />Streaks are a gentle nudge, not a penalty. Missing a day never costs you points.</p>
            </section>

            <section aria-labelledby="modes">
              <SectionHeading title="Choose a game" />
              <div id="modes" className="grid gap-4 sm:grid-cols-2">
                {GAME_MODES.map((m) => {
                  const count = g.quizzes.filter((x) => x.mode === m.mode).length;
                  return (
                    <Link key={m.mode} href={`/games/mode/${m.mode}`} className="group relative block overflow-hidden rounded-[var(--radius-lg)]">
                      <DemoArt hue={m.hue} src={MODE_IMAGE[m.mode]} ratio="16/8" label={false} className="min-h-40 transition-transform duration-500 group-hover:scale-[1.03]" />
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-5 text-white"><h3 className="font-display text-2xl font-semibold">{m.name}</h3><p className="text-sm text-white/80">{m.blurb} · {count} quiz{count === 1 ? "" : "zes"}</p></div>
                    </Link>
                  );
                })}
              </div>
              <Link href="/games/challenge/quiz-onboarding" className="mt-3 block text-sm font-medium text-accent">Optional: the 2-question welcome quiz</Link>
            </section>

            <section aria-labelledby="recent">
              <SectionHeading title="Recent results" action={<Link href="/games/history" className="inline-flex items-center gap-1 text-sm font-medium text-accent"><ClockCounterClockwise className="size-4" aria-hidden />All history</Link>} />
              {g.best && <p className="mb-3 text-sm text-muted-fg">Personal best: <strong className="text-fg">{g.best.score}/{g.best.total}</strong> in {g.best.quizTitle}</p>}
              {g.recent.length === 0 ? <p className="text-muted-fg">No results yet. Pick a game to begin.</p> : (
                <ul id="recent" className="grid gap-3 sm:grid-cols-3">{g.recent.map((a) => <li key={a.id}><Link href={`/games/result/${a.id}`}><Card className="p-4 hover:shadow-card"><p className="font-semibold">{a.quizTitle}</p><p className="text-sm text-muted-fg">{MODE_LABEL[a.mode]} · {a.score}/{a.total} · +{a.points} pts</p></Card></Link></li>)}</ul>
              )}
            </section>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
