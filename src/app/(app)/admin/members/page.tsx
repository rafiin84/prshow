"use client";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, ResponsiveDataList, SearchField } from "@/components/data-display";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/features/admin/use-admin";
import { InfoBanner } from "@/features/admin/components";
import { useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { DISTRICTS, locLabel } from "@/data/seeds/locations";
import { fmtDate } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

export default function Members() {
  const { adminId, admin } = useAdmin();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<VerificationStatus | "all">("all");
  const [district, setDistrict] = useState("all");
  const query = useApiQuery(["members", q, status, district], () => adminApi.listMembers(adminId, { q, status, districtId: district }), !!adminId);
  return (
    <div>
      <PageHeader title="Members" subtitle="Everyone in your geographic scope. Only profile-safe details are shown: never identity documents, face or biometric data." />
      <InfoBanner>Membership approval is separate from admin appointments. Approving a member never grants admin privileges.</InfoBanner>
      <div className="mt-5"><FilterBar>
        <SearchField value={q} onChange={setQ} placeholder="Search name, handle or member no." label="Search members" className="sm:w-80" />
        <Select aria-label="Verification status" value={status} onChange={(e) => setStatus(e.target.value as VerificationStatus | "all")} className="sm:w-52 !h-12"><option value="all">All statuses</option><option value="pending_review">Pending review</option><option value="approved">Approved</option><option value="needs_correction">Needs correction</option><option value="rejected">Rejected</option></Select>
        {admin?.role === "central" && <Select aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)} className="sm:w-48 !h-12"><option value="all">All districts</option>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>}
      </FilterBar></div>
      <QueryBoundary query={query} skeleton={<LoadingSkeleton count={5} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No members match" body="Try different filters. You only see members inside your scope." action={<Button variant="outline" onClick={() => { setQ(""); setStatus("all"); setDistrict("all"); }}>Clear filters</Button>} />}>
        {(list) => (
          <ResponsiveDataList caption="Members in scope" rows={list} rowKey={(f) => f.id} onRowHref={(f) => `/admin/members/${f.id}`}
            columns={[
              { key: "name", header: "Member", cell: (f) => <span className="inline-flex items-center gap-3"><Avatar name={f.name} hue={f.hue} size={32} />{f.name}</span> },
              { key: "no", header: "Member no.", cell: (f) => f.membership?.memberNo ?? <span className="text-muted-fg">Not issued</span> },
              { key: "loc", header: "Location", cell: (f) => locLabel(f.loc, 3) },
              { key: "status", header: "Status", cell: (f) => <StatusBadge status={f.verification} /> },
              { key: "joined", header: "Joined", cell: (f) => fmtDate(f.joinedAt), hideOnMobile: true },
            ]} />
        )}
      </QueryBoundary>
    </div>
  );
}
