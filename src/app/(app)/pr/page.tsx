"use client";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { OfficialBadge, DemoContentBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { MovieCard } from "@/features/movies/movie-card";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";

export default function PRHub() {
  const movies = useApiQuery(["movies", "hub"], () => fan.listMovies());
  const albums = useApiQuery(["albums"], () => fan.listAlbums());
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-ink p-7 text-on-ink sm:p-12">
        <DemoArt hue={330} rounded={false} label={false} className="absolute inset-0 opacity-60" />
        <div className="relative max-w-xl"><div className="mb-3 flex gap-2"><OfficialBadge /><DemoContentBadge label="Demo catalogue" /></div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#ffb59f] uppercase">PR</p>
          <h1 className="font-display mt-2 text-5xl leading-none font-semibold sm:text-7xl">The films.<br />The frames.</h1>
          <p className="mt-4 text-on-ink/80">Official movies and media in one place. Fan-made content lives in Reels and is always labelled.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/pr/movies" className={buttonStyles({ size: "lg" })}>Browse movies</Link><Link href="/pr/gallery" className={buttonStyles({ size: "lg", variant: "secondary" }) + " !bg-white/15 !text-on-ink"}>Official gallery</Link></div>
        </div>
      </section>

      <section>
        <SectionHeading title="Movies" action={<Link href="/pr/movies" className="inline-flex items-center gap-1 text-sm font-medium text-accent">View all<ArrowRight className="size-4" aria-hidden /></Link>} />
        <QueryBoundary query={movies} skeleton={<LoadingSkeleton variant="cards" count={4} />}>
          {(list) => <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">{list.map((m) => <div key={m.id} className="w-40 shrink-0 sm:w-auto"><MovieCard movie={m} /></div>)}</div>}
        </QueryBoundary>
      </section>

      <section>
        <SectionHeading title="Official gallery" action={<Link href="/pr/gallery" className="inline-flex items-center gap-1 text-sm font-medium text-accent">All albums<ArrowRight className="size-4" aria-hidden /></Link>} />
        <QueryBoundary query={albums} skeleton={<LoadingSkeleton variant="cards" count={3} />}>
          {(list) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((a) => <Link key={a.id} href={`/pr/gallery/${a.id}`} className="group block"><DemoArt hue={a.hue} ratio="4/3" title={a.title} subtitle={`${a.assets.length} photos`} className="transition-transform duration-500 group-hover:-translate-y-1" /></Link>)}
            </div>
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
