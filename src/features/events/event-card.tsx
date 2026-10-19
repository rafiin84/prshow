"use client";
import { MapPin, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { DemoArt } from "@/components/media";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { locLabel } from "@/data/seeds/locations";
import { fmtMonthDay, fmtTime } from "@/lib/utils";
import type { EventRSVP, PREvent } from "@/types";

export const CATEGORY_LABEL: Record<PREvent["category"], string> = { meetup: "Meet-up", screening: "Screening", workshop: "Workshop", welfare: "Welfare", celebration: "Celebration" };

export function EventCard({ event, stats, myRsvp, href, ended }: { event: PREvent; stats?: { seatsLeft: number; full: boolean; confirmed: number }; myRsvp?: EventRSVP; href?: string; ended?: boolean }) {
  const d = fmtMonthDay(event.startsAt);
  return (
    <Link href={href ?? `/events/${event.id}`} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-shadow hover:shadow-card">
      <DemoArt hue={event.hue} ratio="16/10" rounded={false} label={false} className="transition-transform duration-500 group-hover:scale-[1.02]">
        <div className="absolute top-3 left-3 rounded-2xl bg-white/95 px-3 py-1.5 text-center text-[#14111a] shadow"><p className="text-[0.65rem] leading-none font-bold tracking-wider uppercase">{d.month}</p><p className="font-display text-2xl leading-tight font-bold">{d.day}</p></div>
        <div className="absolute top-3 right-3"><Badge tone="ink">{CATEGORY_LABEL[event.category]}</Badge></div>
      </DemoArt>
      <div className="space-y-2 p-4">
        <h3 className="text-lg leading-snug font-semibold">{event.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-fg"><MapPin className="size-4 shrink-0" aria-hidden /><span className="truncate">{event.venue}</span></p>
        <p className="text-sm text-muted-fg">{fmtTime(event.startsAt)} · {locLabel(event.loc, 2)}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {myRsvp ? <StatusBadge status={myRsvp.status} /> : ended ? <Badge>Ended</Badge> : stats?.full ? <Badge tone="warning"><Users className="size-3.5" aria-hidden />Full · waitlist open</Badge> : stats ? <Badge tone="success"><Users className="size-3.5" aria-hidden />{stats.seatsLeft} seats left</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
