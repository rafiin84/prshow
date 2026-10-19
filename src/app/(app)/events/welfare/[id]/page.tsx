"use client";
import { use, useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { DemoContentBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { fmtDateTime } from "@/lib/utils";
import { useSession } from "@/stores/session";

const MSG = { registered: "Registered. Your Ward Admin will confirm.", approved: "Confirmed by your Ward Admin. See you there!", declined: "Your participation wasn't confirmed this time.", attended: "Thank you for taking part." } as const;

export default function WelfareDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const [ack, setAck] = useState(false);
  const q = useApiQuery(["welfare", id], () => fan.getWelfare(id, userId!), !!userId);
  const reg = useApiMutation(() => fan.registerWelfare(userId!, id, ack), { success: "Registered. Your Ward Admin will confirm." });
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
      {({ activity: a, mine, count, fan: f }) => (
        <div>
          <PageHeader backHref="/events/welfare" backLabel="Welfare" title={a.title} actions={<DemoContentBadge />} />
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-8">
              <DemoArt hue={a.hue} ratio="21/9" label={false} className="min-h-40" />
              <section><SectionHeading title="Purpose" /><p className="max-w-2xl text-[1.05rem] leading-relaxed">{a.purpose}</p></section>
              <section><SectionHeading title="How to take part" /><ol className="space-y-3">{a.steps.map((s, i) => <li key={s} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{i + 1}</span><span className="pt-1">{s}</span></li>)}</ol></section>
              <dl className="grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-muted-fg">When</dt><dd className="font-medium">{fmtDateTime(a.startsAt)}</dd></div><div><dt className="text-muted-fg">Where</dt><dd className="font-medium">{a.venue}</dd><dd className="text-muted-fg">{locLabel(a.loc)}</dd></div><div><dt className="text-muted-fg">Eligibility</dt><dd className="font-medium">{a.eligibility}</dd></div><div><dt className="text-muted-fg">Registered</dt><dd className="font-medium">{count} of {a.capacity}</dd></div></dl>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card className="space-y-4">
                {mine ? <><StatusBadge status={mine.status} /><p className="text-sm">{MSG[mine.status]}</p></> : a.status !== "published" ? <p className="text-sm text-muted-fg">Registration is closed for this activity.</p> : f.verification !== "approved" ? <p className="text-sm text-muted-fg">Participation is open to approved members once your verification is complete.</p> : (
                  <>
                    <Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} label="I understand this is a volunteer activity and I'll follow the organiser's safety instructions." />
                    <Button size="lg" className="w-full" disabled={!ack} loading={reg.isPending} onClick={() => reg.mutate()}>Register to participate</Button>
                    {!ack && <p className="text-xs text-muted-fg">Tick the acknowledgement to register.</p>}
                  </>
                )}
              </Card>
            </aside>
          </div>
        </div>
      )}
    </QueryBoundary>
  );
}
