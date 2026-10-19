"use client";
import { CaretDown, CaretUp, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { Badge, FanContentBadge, OfficialBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ReelActionRail, ReelPlayer, ReportDialog, useEngagement } from "@/features/reels/player";
import { useApiQuery, useDemoNow } from "@/lib/query";
import { fan } from "@/lib/api";
import { fmtRelative } from "@/lib/utils";
import type { Reel } from "@/types";

export default function ReelsFeed() {
  const q = useApiQuery(["reels-feed"], () => fan.listPublicReels());
  const eng = useEngagement();
  const now = useDemoNow();
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [report, setReport] = useState<Reel | null>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
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
          <>
            <div className="hidden items-center justify-between pb-4 md:flex"><h1 className="text-3xl font-semibold">Reels</h1><div className="flex items-center gap-3 text-xs text-muted-fg"><span>Keys: ↑↓ browse · Space play · M mute · L like</span><Link href="/reels/submit/new" className={buttonStyles({ size: "sm" })}><Plus className="size-4" aria-hidden />Submit a reel</Link></div></div>
            <div ref={scroller} className="no-scrollbar h-[calc(100dvh-var(--header-h)-var(--nav-h)-1.5rem)] snap-y snap-mandatory overflow-y-scroll md:h-[calc(100dvh-14rem)] md:rounded-3xl md:bg-muted/50" role="feed" aria-label="Reels feed" aria-busy={q.isFetching}>
              {list.map((r, i) => (
                <section key={r.id} ref={(el) => { refs.current[i] = el; }} data-i={i} aria-label={`Reel ${i + 1} of ${list.length}: ${r.title}`} className="flex h-full snap-start snap-always items-center justify-center md:gap-6 md:px-6">
                  <div className="relative h-full max-h-[56rem] w-full max-w-[26rem] md:h-[96%] md:rounded-3xl md:shadow-pop">
                    <ReelPlayer reel={r} active={active === i} muted={muted} onToggleMute={() => setMuted((m) => !m)} className="size-full md:rounded-3xl" />
                    <div className="pointer-events-none absolute right-0 bottom-16 left-0 z-30 flex items-end justify-between gap-3 px-4">
                      <div className="pointer-events-auto min-w-0 flex-1 pb-1 text-white"><p className="text-sm font-semibold">{r.creatorName}</p><p className="mt-0.5 line-clamp-2 text-sm text-white/90">{r.title}</p></div>
                      <ReelActionRail reel={r} eng={eng} onReport={() => setReport(r)} className="pointer-events-auto md:hidden" />
                    </div>
                  </div>
                  <aside className="hidden w-72 shrink-0 self-center md:block">
                    <div className="mb-3 flex gap-2">{r.source === "official" ? <OfficialBadge /> : <FanContentBadge />}{r.category !== "Official" && <Badge>{r.category}</Badge>}</div>
                    <h2 className="text-2xl font-semibold">{r.title}</h2>
                    <p className="mt-1 text-sm text-muted-fg">{r.creatorName} · {fmtRelative(r.createdAt, now)}</p>
                    <p className="mt-3 text-[0.95rem]">{r.caption}</p>
                    <div className="mt-5 flex items-center gap-5"><ReelActionRail reel={r} eng={eng} onReport={() => setReport(r)} className="!flex-row" /></div>
                    <Link href={`/reels/${r.id}`} className="mt-5 inline-block text-sm font-medium text-accent">Open details &amp; comments →</Link>
                  </aside>
                </section>
              ))}
              <div className="grid h-40 snap-start place-items-center text-center text-sm text-muted-fg"><div><p className="font-medium text-fg">You&apos;re all caught up</p><p>That&apos;s every approved reel for now.</p><Button className="mt-3" variant="outline" size="sm" onClick={() => go(0)}>Back to the first reel</Button></div></div>
            </div>
            <div className="mt-3 hidden justify-center gap-2 md:flex"><Button variant="outline" size="sm" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous reel"><CaretUp className="size-4" aria-hidden />Previous</Button><Button variant="outline" size="sm" onClick={() => go(active + 1)} disabled={active >= list.length - 1} aria-label="Next reel">Next<CaretDown className="size-4" aria-hidden /></Button></div>
          </>
        )}
      </QueryBoundary>
      <ReportDialog reel={report} open={!!report} onClose={() => setReport(null)} />
      <Link href="/reels/submit/new" aria-label="Submit a reel" className="fixed right-5 bottom-28 z-30 grid size-12 place-items-center rounded-full bg-accent text-accent-fg shadow-lg md:hidden"><Plus weight="bold" className="size-6" aria-hidden /></Link>
    </div>
  );
}
