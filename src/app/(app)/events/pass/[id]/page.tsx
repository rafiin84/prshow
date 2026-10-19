"use client";
import { use } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { MockQRCode } from "@/components/media";
import { StatusBadge } from "@/components/ui/badge";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { fmtDateTime, fmtTime } from "@/lib/utils";
import { useSession } from "@/stores/session";

export default function PassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["pass", id], () => fan.getPass(id, userId!), !!userId);
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader backHref={`/events/${id}`} backLabel="Event" title="Event pass" />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {({ event, rsvp, token, holder }) => (
          <article aria-label="Event pass" className="overflow-hidden rounded-[28px] bg-ink text-on-ink shadow-pop">
            <div className="p-6"><p className="text-xs font-semibold tracking-[0.18em] text-[#ffb59f] uppercase">PR Show · Event pass</p><h2 className="font-display mt-2 text-2xl leading-tight font-semibold">{event.title}</h2><p className="mt-2 text-sm text-on-ink/75">{fmtDateTime(event.startsAt)} – {fmtTime(event.endsAt)}</p><p className="text-sm text-on-ink/75">{event.venue}</p></div>
            <div className="relative flex items-center"><span aria-hidden className="absolute -left-3 size-6 rounded-full bg-bg" /><span aria-hidden className="absolute -right-3 size-6 rounded-full bg-bg" /><span aria-hidden className="w-full border-t-2 border-dashed border-white/20" /></div>
            <div className="flex flex-col items-center gap-3 p-6">
              <MockQRCode token={token} size={176} />
              <p className="font-mono text-sm tracking-widest">{token}</p>
              <p className="text-sm">{holder}</p>
              {rsvp.status === "checked_in" ? <p className="flex items-center gap-1.5 text-sm font-medium text-[#6be3a8]"><CheckCircle weight="fill" className="size-5" aria-hidden />Checked in</p> : <StatusBadge status="confirmed" label="Ready to scan" />}
              <p className="text-center text-xs text-on-ink/60">Demo pass. The QR holds only an opaque token: no name, phone or member number.</p>
            </div>
          </article>
        )}
      </QueryBoundary>
    </div>
  );
}
