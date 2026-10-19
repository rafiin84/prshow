"use client";
import { CheckCircle, Clock, WarningCircle, XCircle, Circle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonStyles } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { QueryBoundary } from "@/components/feedback";
import { FlowFrame } from "@/features/onboarding/flow";
import { MembershipCard } from "@/features/membership/membership-card";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtDateTime } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

const COPY: Record<VerificationStatus, { title: string; body: string; icon: typeof Clock; tone: string }> = {
  not_started: { title: "Verification hasn't started", body: "Choose your location and complete the two demo checks.", icon: Circle, tone: "text-muted-fg" },
  in_progress: { title: "Almost there", body: "Finish the demo checks and submit for review.", icon: Clock, tone: "text-info" },
  submitted: { title: "Submitted", body: "Your application has been received.", icon: Clock, tone: "text-info" },
  pending_review: { title: "Waiting for a moderator", body: "A Ward Admin in your area reviews every application. Membership isn't active until they approve it. Registering or finishing the form doesn't approve you automatically.", icon: Clock, tone: "text-warning" },
  approved: { title: "You're a verified member", body: "Welcome to PR Show. Your digital membership card is ready.", icon: CheckCircle, tone: "text-success" },
  rejected: { title: "Not approved", body: "A moderator couldn't approve this application. Read their note below. You can correct your details and apply again.", icon: XCircle, tone: "text-danger" },
  needs_correction: { title: "A small fix is needed", body: "A moderator asked for a correction. Update your details and resubmit.", icon: WarningCircle, tone: "text-warning" },
};

export default function StatusPage() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["verify-status"], () => fan.getVerificationStatus(userId!), !!userId);
  return (
    <FlowFrame step={5} title="Your application" subtitle="Here's where things stand." backHref="/join/verify">
      <QueryBoundary query={q}>
        {({ fan: f, submission, status }) => {
          const c = COPY[status];
          const Icon = c.icon;
          return (
            <div className="space-y-6">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
                <div className="flex items-center justify-between"><Icon className={`size-9 ${c.tone}`} weight="duotone" aria-hidden /><StatusBadge status={status === "pending_review" ? "pending_review" : status} /></div>
                <h2 className="mt-3 text-2xl font-semibold">{c.title}</h2>
                <p className="mt-1.5 text-muted-fg">{c.body}</p>
                {f.verificationNote && status !== "approved" && <blockquote className="mt-4 rounded-2xl bg-muted p-4 text-sm"><p className="mb-1 text-xs font-semibold tracking-wide text-muted-fg uppercase">Moderator note</p>{f.verificationNote}</blockquote>}
                {submission && <p className="mt-4 text-xs text-muted-fg">Submitted {fmtDateTime(submission.submittedAt)}</p>}
              </div>

              {status === "approved" && (<><div className="flex justify-center"><MembershipCard fan={f} /></div><Link href="/" className={buttonStyles({ size: "lg" }) + " w-full"}>Enter PR Show</Link></>)}
              {status === "pending_review" && (
                <div className="space-y-3">
                  <ol className="space-y-2 text-sm">
                    {["Details submitted", "Ward Admin reviews (typically same day)", "Membership card issued on approval"].map((s, i) => <li key={s} className="flex items-center gap-3"><span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${i === 0 ? "bg-success text-white dark:text-ink" : "bg-muted text-muted-fg"}`}>{i === 0 ? "✓" : i + 1}</span>{s}</li>)}
                  </ol>
                  <p className="rounded-2xl bg-gold-soft p-4 text-sm text-gold"><strong>Demo tip:</strong> open the Demo menu → switch to the Ward, AC, District or Central Admin covering your chosen area (Central covers everywhere) → Members → approve this application, then come back.</p>
                  <Link href="/" className={buttonStyles({ variant: "outline" }) + " w-full"}>Explore the app while you wait</Link>
                </div>
              )}
              {(status === "needs_correction" || status === "rejected") && <Button size="lg" className="w-full" onClick={() => router.push("/join/location")}>Update details and resubmit</Button>}
              {(status === "not_started" || status === "in_progress") && <Button size="lg" className="w-full" onClick={() => router.push("/join/location")}>Continue</Button>}
            </div>
          );
        }}
      </QueryBoundary>
    </FlowFrame>
  );
}
