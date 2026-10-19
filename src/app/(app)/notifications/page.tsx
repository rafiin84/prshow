"use client";
import { Bell, CalendarBlank, Gift, IdentificationCard, Megaphone, ShieldWarning, UploadSimple, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { Chips } from "@/components/ui/tabs";
import { useApiMutation, useApiQuery, useDemoNow } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtRelative, cn } from "@/lib/utils";
import type { NotificationCategory } from "@/types";

const ICON: Record<NotificationCategory, typeof Bell> = { official: Megaphone, event: CalendarBlank, reward: Gift, submission: UploadSimple, verification: IdentificationCard, admin: ShieldWarning };
const LABEL: Record<NotificationCategory, string> = { official: "Official updates", event: "Events", reward: "Quiz & rewards", submission: "Submissions", verification: "Verification", admin: "Admin alerts" };

export default function Notifications() {
  const router = useRouter();
  const { userId, role } = useSession();
  const now = useDemoNow();
  const [cat, setCat] = useState<"all" | NotificationCategory>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const q = useApiQuery(["notifications"], () => fan.listNotifications(userId!), !!userId);
  const read = useApiMutation((id: string) => fan.markNotificationRead(id), { silentError: true });
  const readAll = useApiMutation(() => fan.markAllNotificationsRead(userId!), { success: "All caught up" });
  const cats = (role === "fan" ? ["official", "event", "reward", "submission", "verification"] : ["admin", "official"]) as NotificationCategory[];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" subtitle="Your history lives here. This demo has no live push, so new items appear when you refresh or take an action." actions={<Button variant="outline" size="sm" loading={readAll.isPending} onClick={() => readAll.mutate()}><CheckCircle className="size-4" aria-hidden />Mark all read</Button>} />
      <div className="mb-4 space-y-3"><Chips label="Category" value={cat} onChange={setCat} items={[{ value: "all", label: "All" }, ...cats.map((c) => ({ value: c, label: LABEL[c] }))]} /><Switch checked={unreadOnly} onChange={setUnreadOnly} label="Unread only" /></div>
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={5} />} isEmpty={(d) => d.filter((n) => (cat === "all" || n.category === cat) && (!unreadOnly || !n.read)).length === 0} empty={<EmptyState icon={<Bell className="size-7" aria-hidden />} title={unreadOnly ? "No unread notifications" : "Nothing here yet"} body="When something happens, like an approval or an event reminder, it'll show up here." />}>
        {(list) => (
          <ul className="space-y-2">
            {list.filter((n) => (cat === "all" || n.category === cat) && (!unreadOnly || !n.read)).map((n) => { const I = ICON[n.category]; return (
              <li key={n.id}><button onClick={() => { if (!n.read) read.mutate(n.id); router.push(n.href); }} className={cn("flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-muted", n.read ? "border-border bg-surface" : "border-accent/40 bg-accent-soft/50")}>
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", n.read ? "bg-muted text-muted-fg" : "bg-accent text-accent-fg")}><I className="size-5" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-semibold">{n.title}</span>{!n.read && <><span className="size-2 rounded-full bg-accent" aria-hidden /><span className="sr-only">Unread</span></>}</span><span className="block text-sm text-muted-fg">{n.body}</span><span className="mt-1 block text-xs text-muted-fg">{LABEL[n.category]} · {fmtRelative(n.at, now)}</span></span>
              </button></li>
            ); })}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
