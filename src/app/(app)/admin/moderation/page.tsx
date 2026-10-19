"use client";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, SearchField } from "@/components/data-display";
import { Tabs } from "@/components/ui/tabs";
import { CaseRow, InfoBanner } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";

type View = "mine" | "open" | "decided";
export default function ModerationQueue() {
  const { adminId, now } = useAdmin();
  const [view, setView] = useState<View>("mine");
  const [q, setQ] = useState("");
  const query = useApiQuery(["cases", view, q], () => adminApi.listCases(adminId, { view, q }), !!adminId);
  return (
    <div>
      <PageHeader title="Moderation queue" subtitle="Fan submissions stay private until a human approves them. Items escalate automatically if nobody decides in time." />
      <InfoBanner tone="gold">Demo time is <strong>{fmtDateTime(now)}</strong>. Ward window: 1 hour. District window: next 2 hours. Opening an item does <strong>not</strong> pause the timer; only a decision does. Advance time from the Demo menu.</InfoBanner>
      <div className="mt-5"><FilterBar>
        <Tabs label="Queue view" value={view} onChange={setView} items={[{ value: "mine", label: "Needs my review" }, { value: "open", label: "All open" }, { value: "decided", label: "Decided" }]} />
        <SearchField value={q} onChange={setQ} placeholder="Search title or contributor" label="Search queue" className="sm:w-72" />
      </FilterBar></div>
      <QueryBoundary query={query} skeleton={<LoadingSkeleton count={4} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title={view === "mine" ? "Nothing waiting on you" : "No items here"} body={view === "mine" ? "Items appear when they're at your review level. Try “All open” to see what's still in progress." : "Try another view or search."} />}>
        {(list) => <ul className="space-y-3" aria-label="Moderation items">{list.map((c) => <li key={c.id}><CaseRow c={c} now={now} href={`/admin/moderation/${c.id}`} /></li>)}</ul>}
      </QueryBoundary>
    </div>
  );
}
