"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Avatar, Card } from "@/components/ui/misc";
import { FanContentBadge, OfficialBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ReelActionRail, ReelPlayer, ReportDialog, useEngagement } from "@/features/reels/player";
import { useApiMutation, useApiQuery, useDemoNow } from "@/lib/query";
import { fan } from "@/lib/api";
import { fmtRelative, hash } from "@/lib/utils";
import { useSession } from "@/stores/session";

export default function ReelDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const now = useDemoNow();
  const eng = useEngagement();
  const [muted, setMuted] = useState(true);
  const [report, setReport] = useState(false);
  const q = useApiQuery(["reel", id], () => fan.getReel(id, userId!), !!userId);
  const { register, handleSubmit, reset } = useForm<{ body: string }>({ resolver: zodResolver(z.object({ body: z.string().trim().min(2) })), defaultValues: { body: "" } });
  const comment = useApiMutation((v: { body: string }) => fan.addComment(userId!, id, v.body), { onSuccess: () => reset(), success: "Comment posted" });
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {(r) => (
        <div>
          <PageHeader backHref="/reels" backLabel="Reels" title={r.title} actions={r.source === "official" ? <OfficialBadge /> : <FanContentBadge />} />
          {!(r.status === "approved" && r.published) && <p className="mb-6 rounded-2xl bg-warning-soft p-4 text-sm text-warning" role="status">Only you and moderators can see this reel. Status: <StatusBadge status={r.status} />{r.reviewNote ? ` — ${r.reviewNote}` : ""}</p>}
          <div className="grid gap-8 md:grid-cols-[auto_1fr]">
            <div className="mx-auto flex items-end gap-4">
              <div className="aspect-[9/16] w-[min(20rem,80vw)] overflow-hidden rounded-3xl shadow-pop"><ReelPlayer reel={r} active muted={muted} onToggleMute={() => setMuted((m) => !m)} className="size-full" /></div>
              <ReelActionRail reel={r} eng={eng} onReport={() => setReport(true)} className="hidden sm:flex" detailHref={`/reels/${r.id}`} />
            </div>
            <div>
              <p className="flex items-center gap-3"><Avatar name={r.creatorName} hue={hash(r.creatorName) % 360} /><span><span className="block font-semibold">{r.creatorName}</span><span className="text-sm text-muted-fg">{r.category} · {fmtRelative(r.createdAt, now)}</span></span></p>
              <p className="mt-4 text-[1.05rem]">{r.caption || "No caption."}</p>
              <div className="mt-4 sm:hidden"><ReelActionRail reel={r} eng={eng} onReport={() => setReport(true)} className="!flex-row justify-around" /></div>
              <h2 className="mt-8 mb-3 text-xl font-semibold">Comments ({r.comments.length})</h2>
              <form onSubmit={handleSubmit((v) => comment.mutate(v))} className="mb-4 flex gap-2"><Input aria-label="Add a comment" placeholder="Add a kind comment" {...register("body")} /><Button type="submit" size="icon" loading={comment.isPending} aria-label="Post comment"><PaperPlaneTilt className="size-5" aria-hidden /></Button></form>
              {r.comments.length === 0 ? <p className="text-muted-fg">No comments yet. Be the first.</p> : <ul className="space-y-3">{[...r.comments].reverse().map((c) => <li key={c.id}><Card className="flex gap-3 p-4"><Avatar name={c.author} hue={hash(c.author) % 360} size={34} /><div><p className="text-sm font-semibold">{c.author} <span className="font-normal text-muted-fg">· {fmtRelative(c.at, now)}</span></p><p className="text-[0.95rem]">{c.body}</p></div></Card></li>)}</ul>}
            </div>
          </div>
          <ReportDialog reel={r} open={report} onClose={() => setReport(false)} />
        </div>
      )}
    </QueryBoundary>
  );
}
