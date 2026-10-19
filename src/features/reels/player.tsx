"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { BookmarkSimple, ChatCircle, Flag, Heart, Pause, Play, ShareNetwork, SpeakerHigh, SpeakerSlash, ClosedCaptioning, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DemoArt } from "@/components/media";
import { Badge, FanContentBadge, OfficialBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { reportSchema } from "@/lib/validation";
import { share } from "@/lib/share";
import { useSession } from "@/stores/session";
import { cn } from "@/lib/utils";
import type { Reel } from "@/types";
import { reelImage } from "@/data/images";


/** Simulated playback: a demo "video" with a moving progress bar. It never produces audio. */
export function ReelPlayer({ reel, active, className, muted, onToggleMute }: { reel: Reel; active: boolean; className?: string; muted: boolean; onToggleMute: () => void }) {
  const reduced = useReducedMotion();
  const [state, setState] = useState<"loading" | "ready">("loading");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [captions, setCaptions] = useState(false);
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) { setPlaying(false); wasActive.current = false; return; }
    setState("loading");
    const id = window.setTimeout(() => { setState("ready"); if (!reduced) setPlaying(true); }, 450);
    wasActive.current = true;
    return () => window.clearTimeout(id);
  }, [active, reduced]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 100 / (reel.durationSec * 10))), 100);
    return () => window.clearInterval(id);
  }, [playing, reel.durationSec]);

  // Exposed to the feed's keyboard handler.
  useEffect(() => {
    const el = document.getElementById(`player-${reel.id}`);
    const toggle = () => setPlaying((p) => !p);
    el?.addEventListener("toggle-play", toggle);
    return () => el?.removeEventListener("toggle-play", toggle);
  }, [reel.id]);

  const secs = Math.floor((progress / 100) * reel.durationSec);
  return (
    <div id={`player-${reel.id}`} className={cn("relative isolate overflow-hidden bg-ink text-white", className)}>
      <motion.div className="absolute inset-0" animate={playing && !reduced ? { filter: [`hue-rotate(0deg)`, `hue-rotate(25deg)`, `hue-rotate(0deg)`] } : {}} transition={{ duration: 8, repeat: Infinity }}>
        <DemoArt hue={reel.hue} src={reelImage(reel)} rounded={false} label={false} className="size-full" />
      </motion.div>
      <button onClick={() => state === "ready" && setPlaying((p) => !p)} aria-label={playing ? `Pause ${reel.title}` : `Play ${reel.title}`} className="absolute inset-0 z-10 grid cursor-pointer place-items-center">
        {state === "loading" ? <SpinnerGap className="size-10 animate-spin" aria-label="Loading video" /> : !playing && <span className="grid size-16 place-items-center rounded-full bg-black/40 backdrop-blur"><Play weight="fill" className="size-8" aria-hidden /></span>}
      </button>
      {captions && <p className="pointer-events-none absolute inset-x-6 bottom-28 z-10 rounded-lg bg-black/60 p-2 text-center text-sm">{reel.captionsAvailable ? "[Demo captions] “…and that's how the banner came together.”" : "Captions aren't available for this reel yet."}</p>}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
        <div className="flex gap-2">{reel.source === "official" ? <OfficialBadge /> : <FanContentBadge />}<Badge tone="gold">Demo video</Badge></div>
        <div className="flex gap-1">
          <button onClick={onToggleMute} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} className="grid size-10 cursor-pointer place-items-center rounded-full bg-black/35 backdrop-blur">{muted ? <SpeakerSlash className="size-5" aria-hidden /> : <SpeakerHigh className="size-5" aria-hidden />}</button>
          <button onClick={() => setCaptions((c) => !c)} aria-label="Toggle captions" aria-pressed={captions} className="grid size-10 cursor-pointer place-items-center rounded-full bg-black/35 backdrop-blur"><ClosedCaptioning weight={captions ? "fill" : "regular"} className="size-5" aria-hidden /></button>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pt-16 pb-3">
        <div role="progressbar" aria-label="Playback progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} className="mb-2 h-1 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-white" style={{ width: `${progress}%` }} /></div>
        <div className="flex items-center gap-2 text-xs text-white/80">{playing ? <Pause weight="fill" className="size-3.5" aria-hidden /> : <Play weight="fill" className="size-3.5" aria-hidden />}0:{String(secs).padStart(2, "0")} / 0:{String(reel.durationSec).padStart(2, "0")}</div>
      </div>
    </div>
  );
}

export function useEngagement() {
  const userId = useSession((s) => s.userId);
  const q = useApiQuery(["engagement"], () => fan.getEngagement(userId!), !!userId);
  const like = useApiMutation((id: string) => fan.toggleLike(userId!, id));
  const save = useApiMutation((id: string) => fan.toggleSave(userId!, id), { success: (r) => (r.saved ? "Saved" : "Removed from saved") });
  return { liked: (id: string) => !!q.data?.likedIds.includes(id), saved: (id: string) => !!q.data?.savedIds.includes(id), like: like.mutate, save: save.mutate, userId };
}

export function ReelActionRail({ reel, eng, onReport, className, detailHref, dark }: { reel: Reel; eng: ReturnType<typeof useEngagement>; onReport: () => void; className?: string; detailHref?: string; dark?: boolean }) {
  const liked = eng.liked(reel.id);
  const saved = eng.saved(reel.id);
  const btn = dark ? "grid size-12 cursor-pointer place-items-center rounded-full text-white transition hover:bg-white/10 active:scale-90" : "grid size-12 cursor-pointer place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-transform active:scale-90 md:bg-muted md:text-fg";
  const lbl = dark ? "text-xs font-medium tabular-nums text-white" : "text-xs font-medium tabular-nums text-white md:text-fg";
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex flex-col items-center gap-1"><motion.button whileTap={{ scale: 1.25 }} onClick={() => eng.like(reel.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className={btn}><Heart weight={liked ? "fill" : "regular"} className={cn("size-6", liked && "text-[#ff4d6a]")} aria-hidden /></motion.button><span className={lbl}>{reel.likes}</span></div>
      <div className="flex flex-col items-center gap-1"><Link href={detailHref ?? `/reels/${reel.id}`} aria-label="Comments" className={btn}><ChatCircle className="size-6" aria-hidden /></Link><span className={lbl}>{reel.comments.length}</span></div>
      <div className="flex flex-col items-center gap-1"><button onClick={() => eng.save(reel.id)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save"} className={btn}><BookmarkSimple weight={saved ? "fill" : "regular"} className="size-6" aria-hidden /></button><span className={lbl}>{reel.saves}</span></div>
      <div className="flex flex-col items-center gap-1"><button onClick={() => share(`${reel.title} on PR Show`, `/reels/${reel.id}`)} aria-label="Share" className={btn}><ShareNetwork className="size-6" aria-hidden /></button><span className={lbl}>Share</span></div>
      <div className="flex flex-col items-center gap-1"><button onClick={onReport} aria-label="Report this reel" className={btn}><Flag className="size-6" aria-hidden /></button><span className={lbl}>Report</span></div>
    </div>
  );
}

export function ReportDialog({ reel, open, onClose }: { reel: Reel | null; open: boolean; onClose: () => void }) {
  const userId = useSession((s) => s.userId);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ reason: string; details?: string }>({ resolver: zodResolver(reportSchema), defaultValues: { reason: "", details: "" } });
  const send = useApiMutation((v: { reason: string; details?: string }) => fan.reportReel(userId!, reel!.id, v.reason, v.details), { onSuccess: () => setDone(true) });
  const close = () => { onClose(); setTimeout(() => { setDone(false); reset(); }, 250); };
  return (
    <Modal open={open} onClose={close} title={done ? "Report sent" : "Report this reel"} description={done ? undefined : "Reports go to a human moderator. We never tell the creator who reported."} size="sm"
      footer={done ? <Button onClick={close}>Done</Button> : <><Button variant="ghost" onClick={close}>Cancel</Button><Button loading={send.isPending} onClick={handleSubmit((v) => send.mutate(v))}>Send report</Button></>}>
      {done ? <div className="flex flex-col items-center gap-3 py-4 text-center"><CheckCircle weight="fill" className="size-14 text-success" aria-hidden /><p>Thanks for helping keep PR Show safe. A moderator will review “{reel?.title}”.</p></div> : (
        <form className="space-y-4" onSubmit={handleSubmit((v) => send.mutate(v))} noValidate>
          <Field label="Reason" error={errors.reason?.message}>{(p) => <Select {...p} {...register("reason")}><option value="">Choose a reason</option>{fan.REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>}</Field>
          <Field label="Anything else we should know?" optional>{(p) => <Textarea {...p} rows={3} {...register("details")} />}</Field>
        </form>
      )}
    </Modal>
  );
}
