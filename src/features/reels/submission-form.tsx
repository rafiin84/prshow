"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, FileVideo, UploadSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DemoArt } from "@/components/media";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Progress } from "@/components/ui/misc";
import { useApiMutation } from "@/lib/query";
import { fan } from "@/lib/api";
import { reelSchema } from "@/lib/validation";
import { hash } from "@/lib/utils";
import { useSession } from "@/stores/session";
import { toast } from "@/stores/toast";
import type { Reel } from "@/types";

type Values = { title: string; caption: string; category: string; rights: boolean; guidelines: boolean };
const CATEGORIES = ["Fan edit", "Music cover", "Fan art", "Event recap", "Trivia"];

export function ReelSubmissionForm({ existing }: { existing?: Reel }) {
  const userId = useSession((s) => s.userId);
  const [file, setFile] = useState<string | null>(existing ? "previous-upload.mp4" : null);
  const [progress, setProgress] = useState(existing ? 100 : 0);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Reel | null>(null);
  const timer = useRef<number | null>(null);
  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(reelSchema) as never,
    defaultValues: { title: existing?.title ?? "", caption: existing?.caption ?? "", category: existing?.category ?? "", rights: false as never, guidelines: false as never },
  });
  const title = watch("title");

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const upload = useApiMutation((name: string) => fan.simulateUpload(name), { silentError: true, onSuccess: () => { setUploadErr(null); }, onError: (e) => { setUploadErr(e.message); setUploading(false); } });
  const start = async (name: string) => {
    setFile(name); setUploading(true); setProgress(0); setUploadErr(null);
    await new Promise<void>((resolve) => { let p = 0; timer.current = window.setInterval(() => { p += 12; setProgress(Math.min(p, 96)); if (p >= 96) { window.clearInterval(timer.current!); resolve(); } }, 120); });
    upload.mutate(name, { onSuccess: () => { setProgress(100); setUploading(false); } });
  };

  const submit = useApiMutation((v: Values) => fan.submitReel(userId!, { title: v.title, caption: v.caption, category: v.category, mediaName: file ?? "", rights: v.rights, guidelines: v.guidelines }, existing?.id), { onSuccess: (r) => setSubmitted(r), success: "Submitted for review" });
  const draft = useApiMutation(() => fan.saveReelDraft(userId!, { title: getValues("title"), caption: getValues("caption"), category: getValues("category") || "Fan edit", mediaName: file ?? "" }), { success: "Draft saved to My submissions" });
  const ready = progress === 100 && !uploading;

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-8 text-center">
        <CheckCircle weight="fill" className="mx-auto size-16 text-success" aria-hidden />
        <h1 className="mt-4 text-3xl font-semibold">Submitted for review</h1>
        <p className="mt-2 text-muted-fg">“{submitted.title}” is now <StatusBadge status="pending_review" />. It stays private until a moderator approves it. A Ward Admin has one hour before it escalates.</p>
        <div className="mt-6 flex flex-col gap-3"><Link href="/profile/submissions" className={buttonStyles({ size: "lg" })}>Track my submissions</Link><Link href="/reels" className={buttonStyles({ variant: "outline" })}>Back to reels</Link></div>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit((v) => { if (!ready) { toast.error("Add a video first", "Choose a file or use the sample clip."); return; } submit.mutate(v); })} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5" aria-labelledby="media-h">
          <h2 id="media-h" className="text-lg font-semibold">1 · Video</h2>
          <p className="mt-1 text-sm text-muted-fg">Demo upload: the file is never read or stored; only its name is used.</p>
          {!file ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <label className={buttonStyles({ variant: "outline" }) + " cursor-pointer focus-within:outline-2"}><UploadSimple className="size-4" aria-hidden />Choose a video<input type="file" accept="video/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) start(f.name); }} /></label>
              <Button type="button" variant="ghost" onClick={() => start("sample-clip.mp4")}>Use a sample clip</Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium"><FileVideo className="size-5" aria-hidden />{file}</p>
              <Progress value={progress} label="Upload progress" tone={ready ? "success" : "accent"} />
              <p aria-live="polite" className="text-xs text-muted-fg">{uploadErr ? <span className="text-danger">{uploadErr}</span> : ready ? "Upload complete (simulated)" : `Uploading… ${progress}%`}</p>
              {uploadErr && <Button type="button" size="sm" variant="outline" onClick={() => start(file)}>Retry upload</Button>}
              {ready && <Button type="button" size="sm" variant="ghost" onClick={() => { setFile(null); setProgress(0); }}>Replace video</Button>}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5" aria-labelledby="det-h">
          <h2 id="det-h" className="text-lg font-semibold">2 · Details</h2>
          <Field label="Title" error={errors.title?.message}>{(p) => <Input {...p} maxLength={80} placeholder="Give it a clear title" {...register("title")} />}</Field>
          <Field label="Caption" optional error={errors.caption?.message}>{(p) => <Textarea {...p} rows={3} maxLength={220} placeholder="Tell people what it's about. Don't include phone numbers or addresses." {...register("caption")} />}</Field>
          <Field label="Category" error={errors.category?.message}>{(p) => <Select {...p} {...register("category")}><option value="">Choose a category</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        </section>

        <section className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5" aria-labelledby="ack-h">
          <h2 id="ack-h" className="text-lg font-semibold">3 · Confirm</h2>
          <div><Checkbox label="I made this, or I have permission to use everything in it (video, music, images)." {...register("rights")} />{errors.rights && <p role="alert" className="mt-1 ml-8 text-xs font-medium text-danger">{errors.rights.message}</p>}</div>
          <div><Checkbox label={<>I&apos;ve read the <Link href="/help" target="_blank" className="underline">community guidelines</Link>.</>} {...register("guidelines")} />{errors.guidelines && <p role="alert" className="mt-1 ml-8 text-xs font-medium text-danger">{errors.guidelines.message}</p>}</div>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" loading={submit.isPending} disabled={uploading}>Submit for review</Button>
          <Button type="button" size="lg" variant="outline" loading={draft.isPending} onClick={() => draft.mutate()} disabled={title.trim().length < 3}>Save draft</Button>
        </div>
        {uploading && <p className="text-xs text-muted-fg">Submit unlocks when the upload finishes.</p>}
      </div>
      <aside aria-label="Preview" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-sm font-semibold">Preview</p>
        <DemoArt hue={hash(title || "reel") % 360} ratio="9/16" label="Preview" className="mx-auto max-w-[16rem]"><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white"><Badge tone="neutral">Fan-created</Badge><p className="mt-1 font-semibold">{title || "Your title appears here"}</p></div></DemoArt>
        <p className="mt-3 text-center text-xs text-muted-fg">Once submitted it&apos;s <strong>Pending review</strong> and invisible to everyone else until approved.</p>
      </aside>
    </form>
  );
}
