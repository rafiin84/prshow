"use client";
import Link from "next/link";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { DemoContentBadge, StatusBadge } from "@/components/ui/badge";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { fmtDate } from "@/lib/utils";
import { useSession } from "@/stores/session";

export default function WelfareList() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["welfare"], () => fan.listWelfare(userId!), !!userId);
  return (
    <div>
      <PageHeader backHref="/events" backLabel="Events" eyebrow="Welfare" title="Give back, together" subtitle="Volunteer-led activities. Examples here are demo content; no real-world outcomes are claimed." actions={<DemoContentBadge />} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No welfare activities yet" body="New activities will be announced here." />}>
        {(list) => (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(({ activity: a, mine, count }) => (
              <li key={a.id}><Link href={`/events/welfare/${a.id}`} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface hover:shadow-card">
                <DemoArt hue={a.hue} ratio="16/9" rounded={false} label={false} />
                <div className="space-y-2 p-4"><h3 className="text-lg font-semibold">{a.title}</h3><p className="text-sm text-muted-fg">{fmtDate(a.startsAt)} · {locLabel(a.loc, 2)}</p><div className="flex flex-wrap items-center gap-2 pt-1">{a.status === "completed" ? <StatusBadge status="completed" /> : null}{mine ? <StatusBadge status={mine.status} /> : null}<span className="text-xs text-muted-fg">{count} registered</span></div></div>
              </Link></li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
