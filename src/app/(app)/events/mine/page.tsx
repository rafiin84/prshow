"use client";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Card } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";
import { useSession } from "@/stores/session";

export default function MyEvents() {
  const userId = useSession((s) => s.userId);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const q = useApiQuery(["my-events"], () => fan.myEvents(userId!), !!userId);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backHref="/events" backLabel="Events" title="My events" subtitle="Passes, waitlists and attendance history." />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton />}>
        {(d) => {
          const list = tab === "upcoming" ? d.upcoming : d.past;
          return (
            <>
              <Tabs label="My events" value={tab} onChange={setTab} items={[{ value: "upcoming", label: "Upcoming", count: d.upcoming.length }, { value: "past", label: "Past", count: d.past.length }]} className="mb-5 max-w-fit" />
              <p className="mb-4 text-sm text-muted-fg">Attendance history: <strong className="text-fg">{d.attended}</strong> event{d.attended === 1 ? "" : "s"} checked in.</p>
              {list.length === 0 ? <EmptyState title={tab === "upcoming" ? "No upcoming events" : "No past events yet"} body="RSVP to an event and it'll appear here with its pass." action={<Link href="/events" className={buttonStyles()}>Browse events</Link>} /> : (
                <ul className="space-y-3">{list.map(({ event, rsvp }) => (
                  <li key={rsvp.id}><Card className="flex flex-wrap items-center gap-4 p-4"><div className="min-w-0 flex-1"><Link href={`/events/${event.id}`} className="font-semibold hover:underline">{event.title}</Link><p className="text-sm text-muted-fg">{fmtDateTime(event.startsAt)} · {event.venue}</p></div><StatusBadge status={rsvp.status} />{(rsvp.status === "confirmed" || rsvp.status === "checked_in") && <Link href={`/events/pass/${event.id}`} className={buttonStyles({ size: "sm", variant: "outline" })}>Pass</Link>}</Card></li>
                ))}</ul>
              )}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
