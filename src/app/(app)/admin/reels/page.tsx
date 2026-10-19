"use client";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { FanContentBadge, OfficialBadge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { InfoBanner } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";

type Tab = "review" | "published" | "decided";
export default function AdminReels() {
  const { adminId } = useAdmin();
  const [tab, setTab] = useState<Tab>("review");
  const q = useApiQuery(["admin-reels"], () => adminApi.adminListReels(adminId), !!adminId);
  const pub = useApiMutation((v: { id: string; p: boolean }) => adminApi.setReelPublished(adminId, v.id, v.p), { success: (r) => (r.published ? "Reel is live" : "Reel unpublished") });
  return (
    <div>
      <PageHeader title="Reels" subtitle="Review fan submissions and manage what is live. Unapproved reels never appear in the public feed." />
      <InfoBanner>Approvals happen in the moderation queue so every decision is audited. Here you can see status and unpublish or republish approved reels.</InfoBanner>
      <div className="mt-5"><Tabs label="Reel view" value={tab} onChange={setTab} items={[{ value: "review", label: "Review queue" }, { value: "published", label: "Live" }, { value: "decided", label: "Rejected & corrections" }]} className="mb-5 max-w-fit" /></div>
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />}>
        {(rows) => {
          const list = rows.filter(({ reel: r }) => tab === "review" ? ["pending_review", "submitted", "escalated"].includes(r.status) : tab === "published" ? r.status === "approved" : ["rejected", "needs_correction"].includes(r.status));
          if (list.length === 0) return <EmptyState title="Nothing here" body={tab === "review" ? "No fan reels are waiting for review in your scope." : "Nothing matches this view."} />;
          return (
            <ul className="space-y-3">{list.map(({ reel: r, case: c }) => (
              <li key={r.id}><Card className="flex flex-wrap items-center gap-4 p-4"><DemoArt hue={r.hue} ratio="9/16" label={false} className="w-14 shrink-0 !rounded-xl" />
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{r.title}</h2><StatusBadge status={r.status} />{r.source === "official" ? <OfficialBadge /> : <FanContentBadge />}</div><p className="text-sm text-muted-fg">{r.creatorName}{r.loc ? ` · ${locLabel(r.loc, 3)}` : ""} · {r.published ? "Visible in the public feed" : "Not public"}</p>{r.reviewNote && <p className="mt-1 text-sm">“{r.reviewNote}”</p>}</div>
                <div className="flex gap-2">{c && <Link href={`/admin/moderation/${c.id}`} className={buttonStyles({ size: "sm", variant: "outline" })}>{["approved", "rejected", "needs_correction"].includes(c.status) ? "View decision" : "Review"}</Link>}{r.status === "approved" && <Button size="sm" variant={r.published ? "ghost" : "primary"} loading={pub.isPending} onClick={() => pub.mutate({ id: r.id, p: !r.published })}>{r.published ? "Unpublish" : "Publish"}</Button>}</div></Card></li>
            ))}</ul>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
