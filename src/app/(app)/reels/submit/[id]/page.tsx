"use client";
import { use } from "react";
import { PageHeader } from "@/components/data-display";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { ReelSubmissionForm } from "@/features/reels/submission-form";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";

export default function SubmitReel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const isNew = id === "new";
  const q = useApiQuery(["reel-edit", id], () => fan.getReel(id, userId!), !isNew && !!userId);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader backHref={isNew ? "/reels" : "/profile/submissions"} backLabel={isNew ? "Reels" : "My submissions"} eyebrow="Contribute" title={isNew ? "Submit a reel" : "Edit your reel"} subtitle="Every fan reel is reviewed by a person before it's public." />
      {isNew ? <ReelSubmissionForm /> : <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>{(reel) => <ReelSubmissionForm existing={reel} />}</QueryBoundary>}
    </div>
  );
}
