"use client";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, ResponsiveDataList, SearchField } from "@/components/data-display";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { fmtDateTime } from "@/lib/utils";

export default function Activity() {
  const { adminId, admin } = useAdmin();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const query = useApiQuery(["audit", q, type], () => adminApi.listAudit(adminId, { q, subjectType: type }), !!adminId);
  return (
    <div>
      <PageHeader title="Activity log" subtitle={`Every consequential action, with actor and timestamp. ${admin?.role === "central" ? "Showing all of Tamil Nadu." : "Limited to your district."}`} />
      <FilterBar>
        <SearchField value={q} onChange={setQ} placeholder="Search actor, action or item" label="Search activity" className="sm:w-80" />
        <Select aria-label="Item type" value={type} onChange={(e) => setType(e.target.value)} className="sm:w-48 !h-12"><option value="all">All items</option>{["case", "verification", "nomination", "announcement", "event", "welfare", "quiz", "reward", "movie", "album", "reel", "notification"].map((t) => <option key={t} value={t}>{t}</option>)}</Select>
      </FilterBar>
      <QueryBoundary query={query} skeleton={<LoadingSkeleton count={6} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No activity matches" body="Try clearing the search or item filter." />}>
        {(list) => (
          <ResponsiveDataList caption="Activity log" rows={list.slice(0, 150)} rowKey={(a) => a.id} columns={[
            { key: "a", header: "Action", cell: (a) => <span><span className="font-medium">{a.summary}</span>{a.reason && <span className="block text-xs font-normal text-muted-fg">Reason: {a.reason}</span>}</span> },
            { key: "w", header: "Actor", cell: (a) => <span>{a.actorName} <span className="text-muted-fg">({a.actorRole})</span></span> },
            { key: "t", header: "Item", cell: (a) => <Badge>{a.subjectType}</Badge> },
            { key: "s", header: "Scope", cell: (a) => a.districtId ?? "All", hideOnMobile: true },
            { key: "d", header: "When", cell: (a) => fmtDateTime(a.at) },
          ]} />
        )}
      </QueryBoundary>
    </div>
  );
}
