import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, WarningCircle, XCircle, ArrowFatLinesUp, PencilSimpleLine, Seal, Flask, UsersThree, Minus, CircleDashed } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const badge = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-fg",
      accent: "bg-accent-soft text-accent",
      gold: "bg-gold-soft text-gold",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      info: "bg-info-soft text-info",
      ink: "bg-ink text-on-ink",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ tone, className, children }: VariantProps<typeof badge> & { className?: string; children: ReactNode }) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}

export const OfficialBadge = () => <Badge tone="info"><Seal weight="fill" className="size-3.5" aria-hidden />Official</Badge>;
export const FanContentBadge = () => <Badge tone="neutral"><UsersThree weight="fill" className="size-3.5" aria-hidden />Fan-created</Badge>;
export const DemoContentBadge = ({ label = "Demo content" }: { label?: string }) => <Badge tone="gold"><Flask weight="fill" className="size-3.5" aria-hidden />{label}</Badge>;

/** Status is always icon + text, never colour alone. */
const STATUS: Record<string, { label: string; tone: VariantProps<typeof badge>["tone"]; icon: typeof Clock }> = {
  draft: { label: "Draft", tone: "neutral", icon: PencilSimpleLine },
  submitted: { label: "Submitted", tone: "info", icon: Clock },
  pending_review: { label: "Pending review", tone: "warning", icon: Clock },
  pending: { label: "Pending", tone: "warning", icon: Clock },
  in_progress: { label: "In progress", tone: "info", icon: CircleDashed },
  not_started: { label: "Not started", tone: "neutral", icon: Minus },
  approved: { label: "Approved", tone: "success", icon: CheckCircle },
  active: { label: "Active", tone: "success", icon: CheckCircle },
  published: { label: "Published", tone: "success", icon: CheckCircle },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  needs_correction: { label: "Needs correction", tone: "warning", icon: WarningCircle },
  escalated: { label: "Escalated", tone: "danger", icon: ArrowFatLinesUp },
  nominated: { label: "Awaiting Central", tone: "warning", icon: Clock },
  confirmed: { label: "Confirmed", tone: "success", icon: CheckCircle },
  waitlisted: { label: "Waitlisted", tone: "warning", icon: Clock },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle },
  checked_in: { label: "Checked in", tone: "success", icon: CheckCircle },
  registered: { label: "Registered", tone: "info", icon: Clock },
  attended: { label: "Attended", tone: "success", icon: CheckCircle },
  declined: { label: "Declined", tone: "danger", icon: XCircle },
  scheduled: { label: "Scheduled", tone: "info", icon: Clock },
  archived: { label: "Archived", tone: "neutral", icon: Minus },
  completed: { label: "Completed", tone: "neutral", icon: CheckCircle },
  review: { label: "In review", tone: "warning", icon: Clock },
  inactive: { label: "Pending approval", tone: "warning", icon: Clock },
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const, icon: Minus };
  const Icon = s.icon;
  return <Badge tone={s.tone}><Icon weight="fill" className="size-3.5" aria-hidden />{label ?? s.label}</Badge>;
}
export const ScopeBadge = ({ children }: { children: ReactNode }) => <Badge tone="ink">{children}</Badge>;
