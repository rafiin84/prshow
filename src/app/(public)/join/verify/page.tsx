"use client";
import { motion } from "framer-motion";
import { CheckCircle, QrCode, UserFocus, ShieldCheck } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { DemoContentBadge } from "@/components/ui/badge";
import { MockQRCode } from "@/components/media";
import { FlowFrame } from "@/features/onboarding/flow";
import { QueryBoundary } from "@/components/feedback";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { locLabel } from "@/data/seeds/locations";
import { useSession } from "@/stores/session";
import { cn } from "@/lib/utils";

const PROMPTS = ["Look straight at the frame", "Slowly turn your head left", "Blink twice"];

export default function VerifyStep() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const me = useApiQuery(["verify-me"], () => fan.getVerificationStatus(userId!), !!userId);
  const [qrDone, setQrDone] = useState(false);
  const [liveDone, setLiveDone] = useState(false);
  const [prompt, setPrompt] = useState(-1);
  const [confirm, setConfirm] = useState(false);

  const qr = useApiMutation(() => fan.simulateVerificationStep("secure_qr"), { onSuccess: () => setQrDone(true), success: "Secure QR step simulated." });
  const live = useApiMutation(async () => {
    for (let i = 0; i < PROMPTS.length; i++) { setPrompt(i); await new Promise((r) => setTimeout(r, 900)); }
    setPrompt(-1);
    return fan.simulateVerificationStep("liveness");
  }, { onSuccess: () => setLiveDone(true), success: "Liveness simulation complete.", onError: () => setPrompt(-1) });
  const submit = useApiMutation(() => fan.submitVerification(userId!, { secureQr: qrDone, liveness: liveDone }), { onSuccess: () => router.push("/join/status") });

  return (
    <FlowFrame step={4} title="Verify it's you (demo)" subtitle="Two simulated checks, then a moderator reviews your application." backHref="/join/location">
      <QueryBoundary query={me}>
        {({ fan: f }) => (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl bg-info-soft p-4 text-sm text-info"><ShieldCheck className="mt-0.5 size-5 shrink-0" weight="fill" aria-hidden /><p>Nothing real is checked. We don&apos;t ask for Aadhaar numbers or document scans, and your camera is never used.</p></div>

            <section className={cn("rounded-[var(--radius-lg)] border p-5", qrDone ? "border-success/40 bg-success-soft/40" : "border-border bg-surface")} aria-labelledby="qr-h">
              <div className="flex items-center justify-between"><h2 id="qr-h" className="flex items-center gap-2 text-lg font-semibold"><QrCode className="size-5" aria-hidden />1 · Secure QR</h2><DemoContentBadge label="Simulation" /></div>
              <p className="mt-1 text-sm text-muted-fg">Illustrates a privacy-preserving check: the code holds a one-time token, never your identity. No government service is called.</p>
              <div className="my-4 flex justify-center"><MockQRCode token={`secure-${f.id}`} size={150} /></div>
              {qrDone ? <p className="flex items-center justify-center gap-2 font-medium text-success"><CheckCircle weight="fill" className="size-5" aria-hidden />Check passed (simulated)</p>
                : <Button className="w-full" loading={qr.isPending} onClick={() => qr.mutate()}>{qr.isError ? "Retry secure QR check" : "I've scanned it (simulate)"}</Button>}
            </section>

            <section className={cn("rounded-[var(--radius-lg)] border p-5", liveDone ? "border-success/40 bg-success-soft/40" : "border-border bg-surface", !qrDone && "opacity-60")} aria-labelledby="live-h">
              <div className="flex items-center justify-between"><h2 id="live-h" className="flex items-center gap-2 text-lg font-semibold"><UserFocus className="size-5" aria-hidden />2 · Live selfie</h2><DemoContentBadge label="Simulation" /></div>
              <p className="mt-1 text-sm text-muted-fg">A scripted animation. No camera access, no face analysis, no data kept.</p>
              <div className="my-4 grid place-items-center">
                <div className="relative grid size-40 place-items-center rounded-full border-4 border-dashed border-border bg-muted" aria-hidden>
                  <motion.div animate={prompt >= 0 ? { scale: [1, 1.06, 1] } : {}} transition={{ repeat: Infinity, duration: 0.9 }} className="grid size-28 place-items-center rounded-full bg-border"><UserFocus className="size-14 text-muted-fg" weight="duotone" /></motion.div>
                </div>
                <p aria-live="polite" className="mt-3 min-h-6 text-sm font-medium">{prompt >= 0 ? PROMPTS[prompt] : liveDone ? "All done" : ""}</p>
              </div>
              {liveDone ? <p className="flex items-center justify-center gap-2 font-medium text-success"><CheckCircle weight="fill" className="size-5" aria-hidden />Simulation complete</p>
                : <Button className="w-full" disabled={!qrDone} loading={live.isPending} onClick={() => live.mutate()}>{live.isError ? "Retry simulation" : "Start simulation"}</Button>}
              {!qrDone && <p className="mt-2 text-center text-xs text-muted-fg">Complete step 1 first.</p>}
            </section>

            <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5" aria-labelledby="rev-h">
              <h2 id="rev-h" className="text-lg font-semibold">3 · Review &amp; submit</h2>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm"><dt className="text-muted-fg">Name</dt><dd>{f.name}</dd><dt className="text-muted-fg">Mobile</dt><dd>{f.phoneMasked}</dd><dt className="text-muted-fg">Location</dt><dd>{locLabel(f.loc)}</dd></dl>
              <div className="mt-4"><Checkbox checked={confirm} onChange={(e) => setConfirm(e.target.checked)} label="These details are correct and I understand a moderator must approve my membership." /></div>
              <Button size="lg" className="mt-4 w-full" disabled={!(qrDone && liveDone && confirm)} loading={submit.isPending} onClick={() => submit.mutate()}>Submit for review</Button>
              {!(qrDone && liveDone && confirm) && <p className="mt-2 text-center text-xs text-muted-fg">Finish both checks and tick the box to submit.</p>}
            </section>
          </div>
        )}
      </QueryBoundary>
    </FlowFrame>
  );
}
