"use client";
import { ArrowClockwise, ArrowRight, CalendarBlank, GameController, Gift, Seal, Sparkle, Clock } from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { QueryBoundary, LoadingSkeleton, EmptyState } from "@/components/feedback";
import { SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge, DemoContentBadge, FanContentBadge, OfficialBadge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Avatar, Card, Skeleton } from "@/components/ui/misc";
import { EventCard } from "@/features/events/event-card";
import { ReelThumb } from "@/features/reels/reel-thumb";
import { JourneyCard } from "@/features/rewards/journey";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtDate, fmtRelative } from "@/lib/utils";
import { rewardImage } from "@/data/images";


function HomeSkeleton() {
  return <div className="space-y-8"><Skeleton className="h-10 w-64" /><LoadingSkeleton variant="hero" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div><LoadingSkeleton variant="cards" /></div>;
}

export default function FanHome() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["home"], () => fan.getHome(userId!), !!userId);
  return (
    <QueryBoundary query={q} skeleton={<HomeSkeleton />}>
      {(h) => {
        const first = h.fan.name.split(" ")[0];
        const pending = h.fan.verification !== "approved";
        return (
          <div className="space-y-10 sm:space-y-14">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm text-muted-fg">Welcome back</p><h1 className="text-3xl font-semibold sm:text-4xl">{first}, what&apos;s on today?</h1></div>
              <Button variant="ghost" size="sm" onClick={() => q.refetch()} loading={q.isFetching} aria-label="Refresh home"><ArrowClockwise className="size-4" aria-hidden />Refresh</Button>
            </div>

            {pending && (
              <Link href="/join/status" className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-warning/40 bg-warning-soft p-4 text-warning"><Clock weight="duotone" className="size-8 shrink-0" aria-hidden /><div className="flex-1 text-sm"><p className="font-semibold">Membership: {h.fan.verification.replace("_", " ")}</p><p>Some features, like RSVP and reel submission, unlock once a moderator approves you.</p></div><ArrowRight className="size-5" aria-hidden /></Link>
            )}

            {/* Hero */}
            <motion.section initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} aria-label="Featured">
              <Link href={`/pr/movies/${h.featuredMovie.id}`} className="group relative block overflow-hidden rounded-[var(--radius-xl)]">
                <DemoArt hue={h.featuredMovie.hue} rounded={false} label={false} src={h.featuredMovie.poster} className="aspect-[4/5] min-h-[22rem] transition-transform duration-700 group-hover:scale-[1.02] sm:aspect-[16/9] lg:aspect-[21/9]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" /><div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                  <div className="mb-3 flex flex-wrap gap-2"><OfficialBadge /><DemoContentBadge label="Demo catalogue" /></div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-80">Featured · {h.featuredMovie.year}</p>
                  <h2 className="font-display mt-1 text-4xl leading-none font-semibold sm:text-6xl">{h.featuredMovie.title}</h2>
                  <p className="mt-3 line-clamp-2 max-w-xl text-white/80">{h.featuredMovie.synopsis}</p>
                  <span className={buttonStyles({ size: "md" }) + " mt-5"}>Explore the film<ArrowRight className="size-4" aria-hidden /></span>
                </div>
              </Link>
            </motion.section>

            {/* Daily + journey */}
            <section className="grid gap-4 md:grid-cols-2" aria-label="Your day">
              <Link href="/games/play/quiz-daily" className="relative overflow-hidden rounded-[var(--radius-lg)] bg-ink p-6 text-on-ink transition-transform hover:-translate-y-0.5">
                <DemoArt hue={12} rounded={false} label={false} src="/images/sections/games.jpg" className="absolute inset-0" /><div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/65 to-ink/30" />
                <div className="relative">
                  <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#ffb59f] uppercase"><GameController weight="fill" className="size-4" aria-hidden />Daily challenge</p>
                  <p className="font-display mt-2 text-3xl font-semibold">{h.daily.done ? "Done for today" : "Three quick questions"}</p>
                  <p className="mt-1 text-on-ink/75">{h.daily.done ? "Nice work. A new one arrives tomorrow." : "Takes about a minute. No pressure, no penalty."}</p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium">{h.daily.done ? "See games" : "Play now"}<ArrowRight className="size-4" aria-hidden />{h.daily.streak > 0 && <Badge tone="gold">{h.daily.streak}-day streak</Badge>}</p>
                </div>
              </Link>
              <JourneyCard points={h.points} journey={h.journey} />
            </section>

            {h.firstVisit && (
              <EmptyState icon={<Sparkle className="size-7" weight="duotone" aria-hidden />} title="Start your PR Journey" body="Take the two-question welcome quiz to earn your first badge, then explore movies and events." action={<Link href="/games/play/quiz-onboarding" className={buttonStyles()}>Take the welcome quiz</Link>} />
            )}

            {/* Announcements */}
            <section aria-labelledby="ann">
              <SectionHeading title="Official updates" eyebrow="From the team" action={<OfficialBadge />} />
              <div id="ann" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {h.announcements.length === 0 ? <EmptyState className="md:col-span-3" title="No announcements yet" body="Official updates for your area appear here." /> : h.announcements.slice(0, 3).map((a, i) => (
                  <Card key={a.id} className={i === 0 ? "lg:col-span-2" : ""}>
                    <div className="flex items-center gap-2"><OfficialBadge />{a.pinned && <Badge tone="gold">Pinned</Badge>}<span className="text-xs text-muted-fg">{a.publishedAt ? fmtDate(a.publishedAt) : ""}</span></div>
                    <h3 className="mt-3 text-xl font-semibold">{a.title}</h3>
                    <p className="mt-1.5 text-muted-fg">{a.body}</p>
                    <p className="mt-3 text-xs text-muted-fg">By {a.authorName}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Reels */}
            <section aria-labelledby="reels-h">
              <SectionHeading title="Reels worth watching" action={<Link href="/reels" className="text-sm font-medium text-accent">See all</Link>} />
              <div id="reels-h" className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {[...h.officialReels, ...h.highlights].map((r) => <ReelThumb key={r.id} reel={r} />)}
              </div>
            </section>

            {/* Events */}
            <section aria-labelledby="ev-h">
              <SectionHeading title="Coming up near you" action={<Link href="/events" className="text-sm font-medium text-accent">All events</Link>} />
              {h.upcomingEvents.length === 0 ? <EmptyState icon={<CalendarBlank className="size-7" aria-hidden />} title="No upcoming events yet" body="Check back soon, or browse past events." action={<Link href="/events" className={buttonStyles({ variant: "outline" })}>Browse events</Link>} /> : (
                <div id="ev-h" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {h.upcomingEvents.map((e) => <EventCard key={e.event.id} event={e.event} stats={e.stats} myRsvp={e.myRsvp} />)}
                </div>
              )}
            </section>

            {/* Community */}
            <section aria-labelledby="com-h" className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionHeading title="From the community" action={<FanContentBadge />} />
                <div id="com-h" className="space-y-3">
                  {h.posts.map((p) => (
                    <Card key={p.id} className="flex gap-3"><Avatar name={p.authorName} hue={p.hue} /><div><p className="text-sm font-semibold">{p.authorName} <span className="font-normal text-muted-fg">· {fmtRelative(p.at, h.now)}</span></p><p className="mt-1 text-[0.95rem]">{p.body}</p></div></Card>
                  ))}
                </div>
              </div>
              <div>
                <SectionHeading title="Recent unlocks" />
                {h.recentUnlocks.length === 0 && h.newBadges.length === 0 ? <EmptyState title="Nothing unlocked yet" body="Play a quiz or join an event to earn your first reward." icon={<Gift className="size-7" aria-hidden />} /> : (
                  <div className="space-y-3">
                    {h.newBadges.map((b) => <Card key={b.id} className="flex items-center gap-3 p-4"><span className="grid size-11 place-items-center rounded-full text-white" style={{ background: `hsl(${b.hue} 65% 42%)` }}><Seal weight="fill" className="size-6" aria-hidden /></span><div><p className="font-medium">{b.name}</p><p className="text-xs text-muted-fg">{b.description}</p></div></Card>)}
                    {h.recentUnlocks.map((u) => <Card key={u.rewardId} className="flex items-center gap-3 p-4"><DemoArt hue={u.reward.hue} src={rewardImage(u.reward)} ratio="1/1" label={false} className="size-11 !rounded-xl" /><div><p className="font-medium">{u.reward.name}</p><StatusBadge status="approved" label="Unlocked" /></div></Card>)}
                    <Link href="/profile/rewards" className="block text-sm font-medium text-accent">Open rewards</Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      }}
    </QueryBoundary>
  );
}
