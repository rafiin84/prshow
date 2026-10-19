"use client";
import { PageHeader } from "@/components/data-display";
import { QueryBoundary, LoadingSkeleton, EmptyState } from "@/components/feedback";
import { MembershipCard } from "@/features/membership/membership-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";

export default function MembershipPage() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["verify-status"], () => fan.getVerificationStatus(userId!), !!userId);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backHref="/profile" backLabel="Profile" title="Membership card" subtitle="Your digital card. Show it at community events." />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {({ fan: f, status }) => f.membership ? (
          <div className="space-y-6">
            <div className="flex justify-center"><MembershipCard fan={f} /></div>
            <Card><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted-fg">Status</dt><dd><StatusBadge status="active" /></dd></div><div><dt className="text-muted-fg">Issued</dt><dd className="font-medium">{f.membership.issuedAt ? fmtDate(f.membership.issuedAt) : "—"}</dd></div></dl><p className="mt-4 text-xs text-muted-fg">The QR is a demo graphic holding an opaque token. It never contains your name, phone, location or identity details.</p></Card>
          </div>
        ) : <EmptyState title="No card yet" body={`Your verification is "${status.replace("_", " ")}". The card is issued after a moderator approves it.`} action={<Link href="/join/status" className={buttonStyles()}>View verification status</Link>} />}
      </QueryBoundary>
    </div>
  );
}
