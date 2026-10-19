"use client";
import { BookmarkSimple, ShareNetwork, PlayCircle, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { use, useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { SectionHeading } from "@/components/data-display";
import { AccessibleMediaFallback, DemoArt } from "@/components/media";
import { Badge, DemoContentBadge, OfficialBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Card } from "@/components/ui/misc";
import { MovieCard, MoviePoster } from "@/features/movies/movie-card";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { share } from "@/lib/share";
import { useSession } from "@/stores/session";
import { cn } from "@/lib/utils";

export default function MovieDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const [media, setMedia] = useState<string | null>(null);
  const q = useApiQuery(["movie", id], () => fan.getMovie(id));
  const me = useApiQuery(["saved-ids"], async () => (await fan.getProfile(userId!)).fan.savedIds, !!userId);
  const save = useApiMutation(() => fan.toggleSave(userId!, id), { success: (r) => (r.saved ? "Saved to your profile" : "Removed from saved") });
  const saved = me.data?.includes(id);
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ movie: m, relatedAlbums, related }) => (
        <div className="space-y-10">
          <section className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-[var(--radius-xl)]">
            <DemoArt hue={m.hue} rounded={false} label={false} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
            <div className="relative flex flex-col gap-6 p-6 pt-24 text-white sm:flex-row sm:items-end sm:p-10 sm:pt-32">
              <MoviePoster movie={m} className="w-36 shrink-0 shadow-pop sm:w-48" />
              <div className="min-w-0">
                <Link href="/pr/movies" className="mb-3 inline-block text-sm text-white/70 hover:text-white">← All movies</Link>
                <div className="mb-2 flex flex-wrap gap-2"><OfficialBadge />{!m.verified && <DemoContentBadge label="Details pending verification" />}</div>
                <h1 className="font-display text-4xl leading-none font-semibold sm:text-6xl">{m.title}</h1>
                <p className="mt-2 text-white/80">{m.year} · {m.genres.join(", ")}{m.runtime ? ` · ${m.runtime}` : ""}</p>
                <p className="text-sm text-white/70">PR&apos;s role: {m.role}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => setMedia(m.mediaSlots.find((s) => s.available)?.id ?? "none")}><PlayCircle weight="fill" className="size-5" aria-hidden />Watch media</Button>
                  <Button variant="secondary" className="!bg-white/15 !text-white" loading={save.isPending} onClick={() => save.mutate()} aria-pressed={!!saved}><BookmarkSimple weight={saved ? "fill" : "regular"} className="size-5" aria-hidden />{saved ? "Saved" : "Save"}</Button>
                  <Button variant="secondary" className="!bg-white/15 !text-white" onClick={() => share(`${m.title} (${m.year}) on PR Show`, `/pr/movies/${m.id}`)}><ShareNetwork className="size-5" aria-hidden />Share</Button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-10">
              <section><SectionHeading title="Story" /><p className="max-w-2xl text-[1.05rem] leading-relaxed">{m.synopsis}</p></section>
              <section>
                <SectionHeading title="Official media" />
                <ul className="grid gap-3 sm:grid-cols-2">
                  {m.mediaSlots.map((s) => (
                    <li key={s.id}><button onClick={() => setMedia(s.id)} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left hover:bg-muted">
                      {s.available ? <PlayCircle weight="fill" className="size-9 shrink-0 text-accent" aria-hidden /> : <Lock className="size-9 shrink-0 text-muted-fg" aria-hidden />}
                      <span><span className="block font-medium">{s.title}</span><span className="text-xs text-muted-fg">{s.available ? "Demo placeholder clip" : "Not yet supplied by the official team"}</span></span>
                    </button></li>
                  ))}
                </ul>
              </section>
              <section><SectionHeading title="Stills" />
                <div className="no-scrollbar flex gap-3 overflow-x-auto">{m.stills.map((s, i) => <DemoArt key={s} hue={(m.hue + i * 30) % 360} ratio="16/10" title={s} className="w-64 shrink-0" />)}</div>
              </section>
            </div>
            <aside className="space-y-6">
              <Card><h2 className="text-lg font-semibold">Cast &amp; crew</h2>
                {m.cast.length + m.crew.length === 0 ? <p className="mt-2 text-sm text-muted-fg">To be announced.</p> : <dl className="mt-3 space-y-2 text-sm">{m.cast.map((c) => <div key={c.name} className="flex justify-between gap-3"><dt className="font-medium">{c.name}</dt><dd className="text-muted-fg">{c.as ?? "Cast"}</dd></div>)}{m.crew.map((c) => <div key={c.name} className="flex justify-between gap-3"><dt className="font-medium">{c.name}</dt><dd className="text-muted-fg">{c.job}</dd></div>)}</dl>}
                {!m.verified && <p className="mt-3 text-xs text-muted-fg">Demo data. Credits are pending verification by the official team.</p>}
              </Card>
              <Card><h2 className="text-lg font-semibold">Related albums</h2><ul className="mt-3 space-y-2 text-sm">{relatedAlbums.map((a) => <li key={a.id}><Link className="font-medium text-accent hover:underline" href={`/pr/gallery/${a.id}`}>{a.title}</Link> <span className="text-muted-fg">· {a.assets.length} photos</span></li>)}</ul></Card>
            </aside>
          </div>

          <section><SectionHeading title="More from PR" /><div className="grid grid-cols-2 gap-5 sm:grid-cols-3">{related.map((r) => <MovieCard key={r.id} movie={r} />)}</div></section>

          <Modal open={media !== null} onClose={() => setMedia(null)} title={m.mediaSlots.find((s) => s.id === media)?.title ?? "Media"} size="lg" sheet={false}>
            {(() => { const s = m.mediaSlots.find((x) => x.id === media); return s?.available ? (
              <div><div className="overflow-hidden rounded-2xl"><AccessibleMediaFallback title={`${s.title} (demo placeholder)`} hue={m.hue} /></div><p className="mt-3 text-sm text-muted-fg">Demo placeholder. Approved video will play here. Captions and transcript will be provided with real media.</p></div>
            ) : <p className={cn("text-muted-fg")}>{s ? `${s.title} hasn't been supplied by the official team yet.` : "No media is available for this title yet."}</p>; })()}
          </Modal>
          <p className="text-xs text-muted-fg"><Badge>Demo</Badge> Artwork is generated placeholder art, not official photography.</p>
        </div>
      )}
    </QueryBoundary>
  );
}
