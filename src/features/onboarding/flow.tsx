"use client";
import Link from "next/link";
import { FilmSlate, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import { DemoButton, DemoPanel } from "@/components/layout/demo-panel";
import { cn } from "@/lib/utils";

export function FlowFrame({ step, total = 5, title, subtitle, children, backHref }: { step: number; total?: number; title: string; subtitle?: string; children: React.ReactNode; backHref?: string }) {
  const [demo, setDemo] = useState(false);
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-6 pb-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/welcome" className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg"><FilmSlate weight="fill" className="size-5" aria-hidden /></span><span className="font-display text-lg font-bold">PR Show</span></Link>
        <div className="flex items-center gap-2"><DemoButton onClick={() => setDemo(true)} />{backHref && <Link href={backHref} className="rounded-full px-3 py-2 text-sm text-muted-fg hover:bg-muted">Back</Link>}</div>
      </header>
      <div role="progressbar" aria-label="Sign-up progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} className="mb-6 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-accent" : "bg-border")} />)}
      </div>
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Step {step} of {total}</p>
      <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-fg">{subtitle}</p>}
      <main className="mt-8 flex-1">{children}</main>
      <footer className="mt-10 flex items-start gap-2 text-xs text-muted-fg"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /><p>Demo build: no real SMS, Aadhaar, document or face data is collected, processed or stored. Everything here is simulated.</p></footer>
      <DemoPanel open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}
