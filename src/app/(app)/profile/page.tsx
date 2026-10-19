"use client";
import { Bookmark, CalendarCheck, ClockCounterClockwise, Gear, IdentificationCard, Medal, UploadSimple, ArrowRight, Question } from "@phosphor-icons/react";
import Link from "next/link";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { Avatar, Card } from "@/components/ui/misc";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MembershipCard } from "@/features/membership/membership-card";
import { JourneyCard } from "@/features/rewards/journey";
import { AdminProfileView } from "@/features/profile/admin-profile";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { findAC, findDistrict } from "@/data/seeds/locations";
import { useSession } from "@/stores/session";

export default function ProfilePage() {
  const { userId, role } = useSession();
  const q = useApiQuery(["profile"], () => fan.getProfile(userId!), !!userId && role === "fan");
  if (role !== "fan") return <AdminProfileView />;
  return (
    <div className="mx-auto max-w-5xl">
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {(p) => {
          const f = p.fan;
          const links = [
            { href: "/profile/membership", icon: IdentificationCard, label: "Membership card", note: f.membership ? f.membership.memberNo : "Not issued yet" },
            { href: "/profile/rewards", icon: Medal, label: "Rewards & badges", note: `${p.badgeCount} badges · ${p.rewardCount} unlocked` },
            { href: "/events/mine", icon: CalendarCheck, label: "Event passes", note: `${p.passes.length} upcoming · ${p.attended} attended` },
            { href: "/profile/submissions", icon: UploadSimple, label: "My submissions", note: `${p.submissionCount} reel${p.submissionCount === 1 ? "" : "s"}` },
            { href: "/profile/history", icon: ClockCounterClockwise, label: "Quiz history", note: `${p.quizCount} played` },
            { href: "/profile/saved", icon: Bookmark, label: "Saved", note: `${p.savedCount} items` },
            { href: "/profile/settings", icon: Gear, label: "Settings", note: "Profile, privacy, theme" },
            { href: "/help", icon: Question, label: "Help & guidelines", note: "Privacy and community rules" },
          ];
          return (
            <div className="space-y-8">
              <header className="flex flex-wrap items-center gap-5">
                <Avatar name={f.name} hue={f.hue} size={84} />
                <div className="min-w-0 flex-1"><h1 className="text-3xl font-semibold sm:text-4xl">{f.name}</h1><p className="text-muted-fg">@{f.handle} · {findDistrict(f.loc.districtId)?.name}{f.prefs.showCity ? ` · ${findAC(f.loc.acId)?.name}` : ""}</p>{f.bio && <p className="mt-2 max-w-xl text-[0.95rem]">{f.bio}</p>}<div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={f.verification} label={f.verification === "approved" ? "Verified member" : undefined} /><Badge tone="gold">{p.points} points</Badge></div></div>
              </header>
              <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
                <div className="space-y-6">
                  <JourneyCard points={p.points} journey={p.journey} />
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {links.map((l) => { const I = l.icon; return (
                      <li key={l.href}><Link href={l.href} className="group flex items-center gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 transition-shadow hover:shadow-card"><span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><I className="size-6" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block font-medium">{l.label}</span><span className="block truncate text-sm text-muted-fg">{l.note}</span></span><ArrowRight className="size-4 text-muted-fg transition-transform group-hover:translate-x-0.5" aria-hidden /></Link></li>
                    ); })}
                  </ul>
                </div>
                <div>{f.membership ? <Link href="/profile/membership" aria-label="Open membership card"><MembershipCard fan={f} /></Link> : <Card className="text-center"><IdentificationCard className="mx-auto size-10 text-muted-fg" aria-hidden /><p className="mt-2 font-semibold">No membership card yet</p><p className="mt-1 text-sm text-muted-fg">It appears once a moderator approves your verification.</p><Link href="/join/status" className="mt-3 inline-block text-sm font-medium text-accent">Check status</Link></Card>}</div>
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
