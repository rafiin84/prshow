"use client";
import { Download, Lock, LockOpen, Medal, Ticket } from "@phosphor-icons/react";
import { useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge, DemoContentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Card, Progress } from "@/components/ui/misc";
import { JourneyCard } from "@/features/rewards/journey";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { fmtDate, fmtRelative } from "@/lib/utils";
import { toast } from "@/stores/toast";
import { useDemoNow } from "@/lib/query";
import { cn } from "@/lib/utils";
import { rewardImage } from "@/data/images";


export default function RewardsPage() {
  const userId = useSession((s) => s.userId);
  const now = useDemoNow();
  const [preview, setPreview] = useState<string | null>(null);
  const q = useApiQuery(["rewards"], () => fan.getRewards(userId!), !!userId);
  const unlock = useApiMutation((id: string) => fan.unlockReward(userId!, id), { success: (r) => `${r.name} unlocked` });
  return (
    <div>
      <PageHeader backHref="/profile" backLabel="Profile" title="Rewards & badges" subtitle="Recognition for genuine participation. Wallpapers are demo artwork; passes and tickets are simulated and have no real-world value." actions={<DemoContentBadge label="Simulated rewards" />} />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" />}>
        {(r) => {
          const pv = r.rewards.find((x) => x.id === preview);
          return (
            <div className="space-y-10">
              <JourneyCard points={r.points} journey={r.journey} href="/profile/rewards" />
              <section aria-labelledby="badges"><SectionHeading title="Badges" />
                <ul id="badges" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {r.badges.map((b) => (
                    <li key={b.id}><Card className={cn("flex h-full flex-col items-center gap-2 p-4 text-center", !b.earned && "opacity-70")}>
                      <span className="grid size-14 place-items-center rounded-full text-white" style={{ background: b.earned ? `hsl(${b.hue} 65% 42%)` : "var(--muted-fg)" }}>{b.earned ? <Medal weight="fill" className="size-7" aria-hidden /> : <Lock className="size-6" aria-hidden />}</span>
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs text-muted-fg">{b.earned ? b.description : `Locked · ${b.hint}`}</p>
                      <Badge tone={b.earned ? "success" : "neutral"}>{b.earned ? `Earned ${b.at ? fmtDate(b.at) : ""}` : "Locked"}</Badge>
                    </Card></li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="unlock"><SectionHeading title="Unlockables" />
                <p className="mb-4 max-w-2xl text-sm text-muted-fg">Rewards unlock when your points reach the threshold. Points are never spent, so unlocking one never costs you another.</p>
                <ul id="unlock" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {r.rewards.map((w) => (
                    <li key={w.id}><Card className="flex h-full flex-col gap-3 p-4">
                      <div className="relative"><DemoArt hue={w.hue} src={rewardImage(w)} ratio={w.kind === "wallpaper" ? "9/12" : "16/9"} label={w.kind === "wallpaper" ? "Demo art" : "Simulated"} className={cn(!w.unlocked && "brightness-[.65] saturate-[.6]")}>{w.kind !== "wallpaper" && <Ticket weight="duotone" className="absolute right-4 bottom-4 size-10 opacity-80" aria-hidden />}</DemoArt></div>
                      <div className="flex-1"><p className="font-semibold">{w.name}</p><p className="text-sm text-muted-fg">{w.description}</p></div>
                      {w.unlocked ? (
                        w.kind === "wallpaper" ? <Button variant="outline" onClick={() => setPreview(w.id)}><LockOpen className="size-4" aria-hidden />Preview &amp; save</Button> : <Badge tone="gold">Unlocked · simulated, not redeemable</Badge>
                      ) : w.eligible ? <Button loading={unlock.isPending} onClick={() => unlock.mutate(w.id)}>Unlock now</Button> : (
                        <div><Progress value={(r.points / w.pointsRequired) * 100} label={`Progress to ${w.name}`} /><p className="mt-1 text-xs text-muted-fg">{w.remaining} more points · unlocks at {w.pointsRequired}</p></div>
                      )}
                    </Card></li>
                  ))}
                </ul>
              </section>
              <section><SectionHeading title="Points history" />
                <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-surface">
                  {r.ledger.map((l) => <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span>{l.reason}<span className="block text-xs text-muted-fg">{fmtRelative(l.at, now)}</span></span><span className={cn("font-semibold tabular-nums", l.delta >= 0 ? "text-success" : "text-danger")}>{l.delta >= 0 ? "+" : ""}{l.delta}</span></li>)}
                </ul>
              </section>
              <Modal open={!!pv} onClose={() => setPreview(null)} title={pv?.name ?? "Wallpaper"} description="Demo artwork. Saving is simulated and no file is downloaded." size="sm"
                footer={<><Button variant="ghost" onClick={() => setPreview(null)}>Close</Button><Button onClick={() => { toast.success("Wallpaper saved (simulated)", "In the real app this would go to your photos."); setPreview(null); }}><Download className="size-4" aria-hidden />Save wallpaper</Button></>}>
                {pv && <DemoArt hue={pv.hue} src={rewardImage(pv)} ratio="9/14" label="Demo art" className="mx-auto max-h-[55dvh]" />}
              </Modal>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
