"use client";
import { CaretDown, CaretUp, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { Badge, FanContentBadge, OfficialBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Button, buttonStyles } from "@/components/ui/button";
import { ReelActionRail, ReelPlayer, ReportDialog, useEngagement } from "@/features/reels/player";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { hash } from "@/lib/utils";
import type { Reel } from "@/types";

export default function ReelsFeed() {
  const q = useApiQuery(["reels-feed"], () => fan.listPublicReels());
  const eng = useEngagement();
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [report, setReport] = useState<Reel | null>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const items = q.data ?? [];

  const go = useCallback((i: number) => { const n = Math.max(0, Math.min(items.length - 1, i)); refs.current[n]?.scrollIntoView({ behavior: "smooth", block: "center" }); setActive(n); }, [items.length]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.6) setActive(Number((e.target as HTMLElement).dataset.i)); }), { threshold: [0.6] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT", "DIALOG"].includes(t.tagName) || document.querySelector("dialog[open]")) return;
      const cur = items[active];
      if (!cur) return;
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); go(active + 1); }
      else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); go(active - 1); }
      else if (e.key === " " && t.tagName !== "BUTTON" && t.tagName !== "A") { e.preventDefault(); document.getElementById(`player-${cur.id}`)?.dispatchEvent(new Event("toggle-play")); }
      else if (e.key === "m") setMuted((m) => !m);
      else if (e.key === "l") eng.like(cur.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div>
      <QueryBoundary query={q} skeleton={<div className="p-4"><LoadingSkeleton variant="detail" /></div>} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No reels yet" body="Approved reels will show up here." action={<Link href="/reels/submit/new" className={buttonStyles()}>Submit a reel</Link>} />}>
        {(list) => (
          <div className="relative">
            <div className="no-scrollbar h-[calc(100dvh-var(--header-h)-var(--nav-h)-1.5rem)] snap-y snap-mandatory overflow-y-scroll md:h-[calc(100dvh-var(--header-h)-var(--nav-h)-1rem)] lg:h-[calc(100dvh-var(--header-h))]" role="feed" aria-label="Reels feed" aria-busy={q.isFetching}>
              {list.map((r, i) => (
                <section key={r.id} ref={(el) => { refs.current[i] = el; }} data-i={i} aria-label={`Reel ${i + 1} of ${list.length}: ${r.title}`} className="relative flex h-full snap-start snap-always items-center justify-center md:py-4">
                  {/* player */}
                  <div className="relative h-full max-h-[60rem] w-full max-w-[26rem] md:aspect-[9/16] md:h-full md:w-auto md:max-w-none">
                    <ReelPlayer reel={r} active={active === i} muted={muted} onToggleMute={() => setMuted((m) => !m)} className="size-full md:rounded-xl" />
                    {/* mobile overlay: creator + rail */}
                    <div className="pointer-events-none absolute right-0 bottom-16 left-0 z-30 flex items-end justify-between gap-3 px-4 md:hidden">
                      <div className="pointer-events-auto min-w-0 flex-1 pb-1 text-white"><p className="text-sm font-semibold">{r.creatorName}</p><p className="mt-0.5 line-clamp-2 text-sm text-white/90">{r.title}</p></div>
                      <ReelActionRail reel={r} eng={eng} onReport={() => setReport(r)} className="pointer-events-auto" />
                    </div>
                    {/* desktop: action column to the right of the player, Instagram-style */}
                    <ReelActionRail reel={r} eng={eng} onReport={() => setReport(r)} className="absolute bottom-2 left-full ml-5 hidden md:flex" />
                  </div>
                  {/* desktop: creator + caption bottom-left of the stage */}
                  <div className="absolute bottom-8 left-6 hidden w-[min(22rem,26vw)] md:block lg:left-10">
                    <div className="flex items-center gap-3"><Avatar name={r.creatorName} hue={r.source === "official" ? 12 : hash(r.creatorName) % 360} size={40} /><div className="min-w-0"><p className="truncate font-semibold">{r.creatorName}</p><div className="mt-0.5 flex gap-1.5">{r.source === "official" ? <OfficialBadge /> : <FanContentBadge />}{r.category !== "Official" && <Badge>{r.category}</Badge>}</div></div></div>
                    <p className="mt-4 text-[0.95rem] leading-snug"><span className="font-medium">{r.title}.</span> <span className="text-muted-fg">{r.caption}</span></p>
                    <Link href={`/reels/${r.id}`} className="mt-3 inline-block text-sm text-muted-fg hover:text-fg hover:underline">View all {r.comments.length} comment{r.comments.length === 1 ? "" : "s"}</Link>
                  </div>
                </section>
              ))}
              <div className="grid h-40 snap-start place-items-center text-center text-sm text-muted-fg"><div><p className="font-medium text-fg">You&apos;re all caught up</p><p>That&apos;s every approved reel for now.</p><Button className="mt-3" variant="outline" size="sm" onClick={() => go(0)}>Back to the first reel</Button></div></div>
            </div>
            {/* desktop: prev/next at the far right + submit shortcut, like the Instagram stage */}
            <div className="absolute top-1/2 right-6 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:right-10">
              <Button variant="secondary" size="icon" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous reel" ><CaretUp className="size-5" aria-hidden /></Button>
              <Button variant="secondary" size="icon" onClick={() => go(active + 1)} disabled={active >= list.length - 1} aria-label="Next reel" ><CaretDown className="size-5" aria-hidden /></Button>
            </div>
            <Link href="/reels/submit/new" className="absolute top-4 right-6 hidden h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg md:inline-flex lg:right-10"><Plus className="size-4" aria-hidden />Submit a reel</Link>
            <p className="absolute top-16 right-6 hidden text-[0.7rem] text-muted-fg lg:block lg:right-10">↑↓ browse · Space play · M mute · L like</p>
          </div>
        )}
      </QueryBoundary>
      <ReportDialog reel={report} open={!!report} onClose={() => setReport(null)} />
      <Link href="/reels/submit/new" aria-label="Submit a reel" className="fixed right-4 top-[15rem] z-30 grid size-12 place-items-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden"><Plus weight="bold" className="size-6" aria-hidden /></Link>
    </div>
  );
}
