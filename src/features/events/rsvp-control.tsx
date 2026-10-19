"use client";
import { CheckCircle, Clock, Lock, Ticket } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/badge";
import { useApiMutation } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import type { EventRSVP, PREvent } from "@/types";

export function RSVPControl({ event, myRsvp, waitlistPosition, full, canRsvp, ended }: { event: PREvent; myRsvp?: EventRSVP; waitlistPosition: number; full: boolean; canRsvp: boolean; ended: boolean }) {
  const userId = useSession((s) => s.userId);
  const [confirm, setConfirm] = useState(false);
  const join = useApiMutation(() => fan.rsvp(userId!, event.id), { success: (r) => (r.status === "waitlisted" ? "You're on the waitlist" : "You're in! Your pass is ready.") });
  const cancel = useApiMutation(() => fan.cancelRsvp(userId!, event.id), { success: "RSVP cancelled", onSuccess: () => setConfirm(false) });

  if (myRsvp?.status === "checked_in") return <div className="space-y-3"><p className="flex items-center gap-2 font-semibold text-success"><CheckCircle weight="fill" className="size-6" aria-hidden />You attended this event</p><Link href={`/events/pass/${event.id}`} className={buttonStyles({ variant: "outline" }) + " w-full"}><Ticket className="size-4" aria-hidden />View pass</Link></div>;
  if (myRsvp?.status === "confirmed") return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle weight="fill" className="size-6" aria-hidden />You&apos;re going</p>
      <Link href={`/events/pass/${event.id}`} className={buttonStyles({ size: "lg" }) + " w-full"}><Ticket className="size-5" aria-hidden />Show my pass</Link>
      {!ended && <Button variant="ghost" className="w-full text-danger" onClick={() => setConfirm(true)}>Cancel RSVP</Button>}
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => cancel.mutate()} loading={cancel.isPending} tone="danger" title="Cancel your RSVP?" description="Your seat will go to the next person on the waitlist, if there is one." confirmLabel="Cancel RSVP" />
    </div>
  );
  if (myRsvp?.status === "waitlisted") return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 font-semibold text-warning"><Clock weight="fill" className="size-6" aria-hidden />Waitlisted · #{waitlistPosition}</p>
      <p className="text-sm text-muted-fg">We&apos;ll notify you and issue a pass automatically if a seat opens up.</p>
      <Button variant="outline" className="w-full" loading={cancel.isPending} onClick={() => cancel.mutate()}>Leave waitlist</Button>
    </div>
  );
  if (ended) return <Button disabled className="w-full">This event has ended</Button>;
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" disabled={!canRsvp} loading={join.isPending} onClick={() => join.mutate()}>{full ? "Join the waitlist" : "RSVP"}</Button>
      {!canRsvp && <p className="flex items-start gap-2 text-sm text-muted-fg"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden />This event is for approved members. <Link className="font-medium text-accent" href="/join/status">Check your verification status</Link>.</p>}
      {canRsvp && full && <p className="text-sm text-muted-fg">The event is full. You&apos;ll be added to the waitlist and promoted if someone cancels.</p>}
      {join.isError && <Button variant="outline" size="sm" onClick={() => join.mutate()}>Retry</Button>}
    </div>
  );
}
export { StatusBadge };
