"use client";
import { motion } from "framer-motion";
import { CalendarBlank, GameController, PlayCircle, FilmSlate, ArrowRight, Medal } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonStyles } from "@/components/ui/button";
import { DemoContentBadge } from "@/components/ui/badge";
import { DemoArt } from "@/components/media";
import { useSession } from "@/stores/session";
import { DEMO_FAN_ID } from "@/data/seeds/people";
import { t } from "@/lib/i18n";
import type { Role } from "@/types";

const VALUE = [
  { icon: FilmSlate, title: "PR movies & official media", body: "A poster-led catalogue and an official gallery, clearly separated from fan-made content." },
  { icon: GameController, title: "Fan Arena games", body: "Trivia, dialogue, scene and song challenges with an individual leaderboard." },
  { icon: PlayCircle, title: "Approved reels", body: "Short videos from the community, reviewed by humans before anyone sees them." },
  { icon: CalendarBlank, title: "Events & welfare", body: "Meet-ups, screenings and welfare drives near you, with passes for members." },
];

export default function Welcome() {
  const router = useRouter();
  const { signInAs, userId, role } = useSession();
  const go = (r: Role, id: string) => { signInAs(id, r); router.push(r === "fan" ? "/" : "/admin"); };
  const ADMIN_ROLES: [Role, string, string][] = [["central", "adm-central", "Central Admin"], ["district", "adm-dist-chn", "District Admin"], ["ac", "adm-ac-myl", "AC Admin"], ["ward", "adm-ward-12", "Ward Admin"]];
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-ink text-on-ink">
        <DemoArt hue={350} rounded={false} label={false} className="absolute inset-0 -z-10 opacity-80" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="mx-auto flex min-h-[88dvh] max-w-5xl flex-col justify-between px-6 pt-6 pb-12">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg"><FilmSlate weight="fill" className="size-5" aria-hidden /></span><span className="font-display text-lg font-bold">{t("brand.name")}</span></span>
            <DemoContentBadge label="Demo build" />
          </div>
          <div className="max-w-2xl pt-24">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-sm font-semibold tracking-[0.2em] text-[#ffb59f] uppercase">The official fan community</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-display text-[3.2rem] leading-[0.98] font-semibold sm:text-8xl">Beyond the<br />Screen.</motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-6 max-w-lg text-lg text-on-ink/80">Join the official community for Pradeep Ranganathan&apos;s fans: movies, games, reels, events and welfare — and a verified identity that grows with you.</motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className={buttonStyles({ size: "lg" })}>Join PR Show<ArrowRight className="size-5" aria-hidden /></Link>
              <Link href="/signin" className={buttonStyles({ size: "lg", variant: "secondary" }) + " !bg-white/12 !text-on-ink hover:!bg-white/20"}>Sign in</Link>
              <Button size="lg" variant="ghost" className="text-on-ink hover:bg-white/10" onClick={() => go("fan", DEMO_FAN_ID)}>Continue as demo fan</Button>
            </motion.div>
            {userId && <p className="mt-4 text-sm text-on-ink/70">You&apos;re already in the demo as <strong>{role}</strong>. <Link href={role === "fan" ? "/" : "/admin"} className="underline">Go to your home</Link></p>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16" aria-labelledby="what">
        <h2 id="what" className="text-3xl font-semibold sm:text-4xl">Everything about PR, in one place</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VALUE.map((v) => { const I = v.icon; return (
            <div key={v.title} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6"><I className="mb-4 size-8 text-accent" weight="duotone" aria-hidden /><h3 className="text-xl font-semibold">{v.title}</h3><p className="mt-1.5 text-muted-fg">{v.body}</p></div>
          ); })}
        </div>
      </section>

      <section className="bg-muted/60 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase"><Medal weight="fill" className="size-4" aria-hidden />Your PR Journey</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">A fan identity that grows with real participation</h2>
            <p className="mt-3 text-muted-fg">Verified membership, quiz points, collectible wallpapers, badges and event attendance build your journey. Rewards recognise genuine participation, never clicks or spam.</p>
          </div>
          <ol className="space-y-3">
            {["Join and verify (moderator-approved)", "Play quizzes and earn badges", "Meet at events and join welfare drives", "Unlock wallpapers and simulated rewards"].map((s, i) => (
              <li key={s} className="flex items-center gap-4 rounded-2xl bg-surface p-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14" aria-labelledby="eval">
        <h2 id="eval" className="text-xl font-semibold">Evaluating this demo?</h2>
        <p className="mt-1 text-sm text-muted-fg">Jump straight into an admin workspace. Role switching is a simulation, not a security control — you can switch any time from the Demo menu.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ADMIN_ROLES.map(([r, id, label]) => <Button key={r} variant="outline" onClick={() => go(r, id)}>{label}</Button>)}
        </div>
        <p className="mt-8 text-xs text-muted-fg">Seed content is demo content. Titles and years are limited to widely known facts; synopses, cast lists, and artwork are placeholders pending approval from the official team. <Link href="/help" className="underline">Privacy &amp; guidelines</Link></p>
      </section>
    </div>
  );
}
