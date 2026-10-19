"use client";
import Link from "next/link";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { useApiQuery, useDemoNow } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtRelative } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/permissions/policy";

export default function Submissions() {
  const userId = useSession((s) => s.userId);
  const now = useDemoNow();
  const q = useApiQuery(["submissions"], () => fan.mySubmissions(userId!), !!userId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backHref="/profile" backLabel="Profile" title="My submissions" subtitle="Track every reel you've submitted and read moderator feedback." actions={<Link href="/reels/submit/new" className={buttonStyles()}>Submit a reel</Link>} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="Nothing submitted yet" body="Share your first reel. It stays private until a moderator approves it." action={<Link href="/reels/submit/new" className={buttonStyles()}>Submit a reel</Link>} />}>
        {(list) => (
          <ul className="space-y-4">
            {list.map(({ reel, case: c }) => (
              <li key={reel.id}><Card className="flex flex-col gap-4 sm:flex-row">
                <DemoArt hue={reel.hue} ratio="9/16" label={false} className="hidden w-20 shrink-0 sm:block" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{reel.title}</h2><StatusBadge status={reel.status} /></div>
                  <p className="text-sm text-muted-fg">{reel.category} · submitted {fmtRelative(reel.createdAt, now)}</p>
                  {reel.status === "pending_review" || reel.status === "escalated" ? <p className="mt-2 text-sm">A moderator is reviewing it. Reviews are escalated automatically if they take too long.</p> : null}
                  {reel.reviewNote && <blockquote className="mt-3 rounded-2xl bg-muted p-3 text-sm"><span className="mb-0.5 block text-xs font-semibold tracking-wide text-muted-fg uppercase">Moderator feedback{c?.decision ? ` · ${ROLE_LABEL[c.decision.byRole]}` : ""}</span>{reel.reviewNote}</blockquote>}
                  {c && c.history.length > 0 && (
                    <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium text-accent">Status history</summary><ol className="mt-2 space-y-1.5 border-l-2 border-border pl-4">{c.history.map((h) => <li key={h.id} className="text-muted-fg"><span className="font-medium text-fg capitalize">{h.action.replace("_", " ")}</span> · {fmtRelative(h.at, now)}</li>)}</ol></details>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reel.status === "approved" && <Link href={`/reels/${reel.id}`} className={buttonStyles({ size: "sm", variant: "outline" })}>View reel</Link>}
                    {(reel.status === "needs_correction" || reel.status === "draft") && <Link href={`/reels/submit/${reel.id}`} className={buttonStyles({ size: "sm" })}>{reel.status === "draft" ? "Continue draft" : "Edit & resubmit"}</Link>}
                  </div>
                </div>
              </Card></li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
