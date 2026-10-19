"use client";
import { Robot, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { ErrorState } from "@/components/feedback";
import { ReasonDialog } from "./components";
import { useApiMutation } from "@/lib/query";
import { admin } from "@/lib/api";
import { cn, fmtDateTime } from "@/lib/utils";
import type { ContentModerationCase, GuardianCategory } from "@/types";

const CAT: Record<GuardianCategory, string> = { violence: "Violence", harassment: "Harassment", hate: "Hate", sexual: "Sexual content", misinformation: "Misinformation", privacy: "Privacy exposure", copyright: "Copyright concern", spam: "Spam / resale" };
const REC: Record<string, string> = { approve: "Approve", reject: "Reject", needs_correction: "Request correction", escalate: "Escalate for senior review" };

export function RiskIndicator({ score }: { score: number }) {
  const level = score >= 0.7 ? "High" : score >= 0.4 ? "Moderate" : "Low";
  const tone = score >= 0.7 ? "bg-danger" : score >= 0.4 ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm"><span className="font-medium">Mock risk: {level}</span><span className="text-muted-fg tabular-nums">≈ {Math.round(score * 100)}%</span></div>
      <div role="meter" aria-label="Mock risk score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(score * 100)} aria-valuetext={`${level}, approximately ${Math.round(score * 100)} percent (simulated)`} className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", tone)} style={{ width: `${score * 100}%` }} /></div>
      <p className="mt-1 text-xs text-muted-fg">Illustrative number from keyword heuristics. It is uncertain and not real model output.</p>
    </div>
  );
}


export function AIRecommendationPanel({ c, adminId, canRespond, now }: { c: ContentModerationCase; adminId: string; canRespond: boolean; now: number }) {
  const g = c.guardian;
  const [dlg, setDlg] = useState<"accepted" | "overridden" | "dismissed" | null>(null);
  const run = useApiMutation(() => admin.runGuardian(adminId, c.id), { success: "Mock analysis complete. Human decision still required.", silentError: true });
  const respond = useApiMutation((v: { action: "accepted" | "overridden" | "dismissed"; reason: string }) => admin.respondGuardian(adminId, c.id, v.action, v.reason), { success: "Your response was recorded", onSuccess: () => setDlg(null) });
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkle weight="fill" className="size-5 text-accent" aria-hidden />AI Content Guardian</h2>
        <Badge tone="gold"><Robot className="size-3.5" aria-hidden />AI suggestion — human decision required</Badge>
      </div>
      <p className="text-xs text-muted-fg">Mock analysis only. It never publishes or rejects anything on its own.</p>
      {run.isError && <ErrorState error={run.error} onRetry={() => run.mutate()} title="Analysis failed" className="py-6" />}
      {!g ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center"><p className="text-sm text-muted-fg">No analysis has been run for this item.</p><Button className="mt-3" loading={run.isPending} onClick={() => run.mutate()}>Run mock analysis</Button></div>
      ) : (
        <>
          <RiskIndicator score={g.riskScore} />
          <div>
            <h3 className="mb-2 text-sm font-semibold">{g.flags.length ? "Flags" : "No flags raised"}</h3>
            <ul className="space-y-3">
              {g.flags.map((f) => (
                <li key={f.category} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between"><p className="flex items-center gap-1.5 font-medium"><WarningCircle weight="fill" className="size-4 text-warning" aria-hidden />{CAT[f.category]}</p><span className="text-xs text-muted-fg">confidence ≈ {Math.round(f.confidence * 100)}%</span></div>
                  <p className="mt-1 text-sm text-muted-fg">{f.explanation}</p>
                  {f.excerpt && <p className="mt-2 rounded-lg bg-warning-soft px-2.5 py-1.5 text-sm text-warning">“…<mark className="rounded bg-transparent font-semibold text-inherit underline decoration-wavy">{f.excerpt}</mark>…”</p>}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-muted p-4"><p className="text-xs font-semibold tracking-wide text-muted-fg uppercase">Suggested action</p><p className="text-lg font-semibold">{REC[g.recommended]}</p><p className="mt-1 text-sm text-muted-fg">{g.rationale}</p><p className="mt-2 text-xs text-muted-fg">Analysed {fmtDateTime(g.analysedAt)} · {Math.max(0, Math.round((now - g.analysedAt) / 60000))} min ago (demo clock)</p></div>
          {g.adminResponse ? (
            <div role="status" className="rounded-2xl border border-success/40 bg-success-soft/50 p-4 text-sm"><p className="font-semibold">Recorded: {g.adminResponse.action}</p><p className="text-muted-fg">{g.adminResponse.reason}</p></div>
          ) : canRespond ? (
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDlg("accepted")}>Accept suggestion</Button><Button variant="outline" onClick={() => setDlg("overridden")}>Override</Button><Button variant="ghost" onClick={() => setDlg("dismissed")}>Dismiss</Button></div>
          ) : <p className="text-sm text-muted-fg">You can view this analysis, but only reviewers in scope can respond to it.</p>}
          <Button variant="ghost" size="sm" loading={run.isPending} onClick={() => run.mutate()}>Re-run analysis</Button>
        </>
      )}
      <ReasonDialog open={dlg !== null} onClose={() => setDlg(null)} loading={respond.isPending} title={dlg === "accepted" ? "Accept the AI suggestion" : dlg === "overridden" ? "Override the AI suggestion" : "Dismiss the AI suggestion"} description="This records your response. The content's status doesn't change until you make a decision on the item." confirmLabel="Record response" onSubmit={(reason) => dlg && respond.mutate({ action: dlg, reason })} />
    </Card>
  );
}
