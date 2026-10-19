"use client";
import { ArrowCounterClockwise, Clock, Flask, Lightning, Moon, Sun, Desktop } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/form";
import { DemoContentBadge } from "@/components/ui/badge";
import { useApiMutation, useApiQuery, useQueryClient } from "@/lib/query";
import { admin as adminApi, demo, fan as fanApi } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/permissions/policy";
import { useSession } from "@/stores/session";
import { useDemoStore, type LatencyMode } from "@/stores/demo";
import { useTheme, type Theme } from "@/lib/theme";
import { fmtDateTime, cn } from "@/lib/utils";
import { toast } from "@/stores/toast";
import type { Role } from "@/types";

const ROLES: Role[] = ["fan", "central", "district", "ac", "ward"];

export function DemoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { role, userId, switchRole } = useSession();
  const demoStore = useDemoStore();
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const clock = useApiQuery(["clock"], () => adminApi.getClock(), open);
  const advance = useApiMutation((ms: number) => adminApi.advanceClock(ms), { success: "Demo clock advanced. Escalations are re-evaluated." });
  const reset = useApiMutation(() => demo.reset(), { success: "Demo data restored to the seeded state.", onSuccess: () => { setConfirmReset(false); } });
  const daily = useApiMutation(() => fanApi.resetDaily(userId ?? ""), { success: (d) => (d.cleared ? "Today's daily challenge was reset." : "Nothing to reset today.") });

  const onRole = (r: Role) => {
    switchRole(r);
    qc.invalidateQueries({ queryKey: ["api"] });
    router.push(r === "fan" ? "/" : "/admin");
    toast.info(`Viewing as ${ROLE_LABEL[r]}`, "Demo simulation — not a security control.");
    onClose();
  };
  const themes: { v: Theme; label: string; icon: typeof Sun }[] = [{ v: "system", label: "System", icon: Desktop }, { v: "light", label: "Light", icon: Sun }, { v: "dark", label: "Dark", icon: Moon }];

  return (
    <>
      <Modal open={open} onClose={onClose} title="Demo controls" description="Development tooling for evaluators. None of this is part of the product." size="md">
        <div className="space-y-6">
          <section aria-labelledby="dp-role">
            <h3 id="dp-role" className="mb-2 text-sm font-semibold">Role switcher</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button key={r} onClick={() => onRole(r)} aria-pressed={role === r} className={cn("cursor-pointer rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-colors", role === r ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-muted")}>{ROLE_LABEL[r]}</button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-fg">Switching updates navigation, scope, permissions and visible data. It simulates roles only; it is not authentication.</p>
          </section>

          <section aria-labelledby="dp-clock">
            <h3 id="dp-clock" className="mb-1 flex items-center gap-2 text-sm font-semibold"><Clock className="size-4" aria-hidden />Demo clock</h3>
            <p className="mb-3 text-sm text-muted-fg">Now: <strong className="text-fg">{clock.data ? fmtDateTime(clock.data.now) : "…"}</strong>. Ward window is 1 hour; District window is the next 2 hours.</p>
            <div className="flex flex-wrap gap-2">
              {[["+15 min", 15], ["+30 min", 30], ["+1 hour", 60], ["+2 hours", 120]].map(([l, m]) => (
                <Button key={l as string} size="sm" variant="outline" loading={advance.isPending} onClick={() => advance.mutate((m as number) * 60_000)}>{l}</Button>
              ))}
            </div>
          </section>

          <section aria-labelledby="dp-fail">
            <h3 id="dp-fail" className="mb-1 flex items-center gap-2 text-sm font-semibold"><Lightning className="size-4" aria-hidden />Mock API behaviour</h3>
            <Switch checked={demoStore.failAll} onChange={demoStore.setFailAll} label="Fail every request" description="Simulates being offline so you can see error and retry states." />
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Button size="sm" variant="outline" onClick={() => { demoStore.armFailNext(1); toast.info("The next request will fail once."); }}>Fail next request</Button>
              <div role="group" aria-label="Simulated latency" className="flex rounded-full bg-muted p-1">
                {(["fast", "normal", "slow"] as LatencyMode[]).map((m) => <button key={m} aria-pressed={demoStore.latency === m} onClick={() => demoStore.setLatency(m)} className={cn("cursor-pointer rounded-full px-3 py-1 text-xs font-medium capitalize", demoStore.latency === m ? "bg-surface shadow-sm" : "text-muted-fg")}>{m}</button>)}
              </div>
            </div>
          </section>

          <section aria-labelledby="dp-theme">
            <h3 id="dp-theme" className="mb-2 text-sm font-semibold">Theme</h3>
            <div role="radiogroup" aria-label="Theme" className="flex gap-2">
              {themes.map(({ v, label, icon: I }) => <button key={v} role="radio" aria-checked={theme === v} onClick={() => setTheme(v)} className={cn("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium", theme === v ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-muted")}><I className="size-4" aria-hidden />{label}</button>)}
            </div>
          </section>

          <section className="flex flex-wrap gap-2 border-t border-border pt-4">
            {role === "fan" && <Button size="sm" variant="outline" loading={daily.isPending} onClick={() => daily.mutate()}>Reset today&apos;s daily challenge</Button>}
            <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}><ArrowCounterClockwise className="size-4" aria-hidden />Reset all demo data</Button>
          </section>
        </div>
      </Modal>
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onConfirm={() => reset.mutate()} loading={reset.isPending} tone="danger" title="Reset all demo data?" description="This restores every list, queue, point balance and the demo clock to the original seed. Your session stays signed in." confirmLabel="Reset demo" />
    </>
  );
}

export function DemoButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Open demo controls" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-3 text-xs font-semibold text-gold hover:brightness-95">
      <Flask weight="fill" className="size-3.5" aria-hidden />Demo
    </button>
  );
}
export { DemoContentBadge };
