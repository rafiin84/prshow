"use client";
import { useState } from "react";
import { cn, hash } from "@/lib/utils";

/**
 * Replaceable artwork. If an approved `src` is supplied and loads, it's used; otherwise a neutral
 * generated gradient is shown and (optionally) marked as demo art — never presented as official photography.
 */
export function DemoArt({ hue, title, subtitle, className, ratio, label, src, alt, rounded = true, children }: {
  hue: number; title?: string; subtitle?: string; className?: string; ratio?: string; label?: string | false; src?: string; alt?: string; rounded?: boolean; children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const h2 = (hue + 48) % 360;
  const seed = hash(`${hue}${title ?? ""}`);
  const x = 18 + (seed % 60);
  const showSrc = src && !failed;
  return (
    <div role="img" aria-label={alt ?? title ?? "Decorative artwork"} className={cn("relative isolate max-w-full overflow-hidden text-white", rounded && "rounded-[var(--radius-lg)]", className)} style={{ aspectRatio: ratio, background: `radial-gradient(120% 90% at ${x}% 0%, hsl(${h2} 85% 62% / .85), transparent 60%), radial-gradient(90% 80% at 90% 100%, hsl(${hue} 80% 30%), transparent 65%), linear-gradient(160deg, hsl(${hue} 65% 38%), hsl(${(hue + 300) % 360} 55% 14%))` }}>
      {showSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 size-full object-cover" />
      )}
      {!showSrc && (
        <>
          <span aria-hidden className="absolute -right-6 -bottom-8 size-40 rounded-full border border-white/20" />
          <span aria-hidden className="absolute right-6 bottom-2 size-20 rounded-full border border-white/25" />
          <span aria-hidden className="absolute inset-0 opacity-[.12] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        </>
      )}
      {(title || subtitle) && !showSrc && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10">
          {subtitle && <p className="text-[0.7rem] font-medium tracking-[0.14em] uppercase opacity-80">{subtitle}</p>}
          {title && <p className="font-display text-xl leading-tight font-semibold">{title}</p>}
        </div>
      )}
      {label !== false && !showSrc && <span className="absolute top-2.5 left-2.5 rounded-full bg-black/35 px-2 py-0.5 text-[0.62rem] font-medium tracking-wide uppercase backdrop-blur-sm">{label ?? "Demo art"}</span>}
      {children}
    </div>
  );
}

/** Deterministic mock QR. Draws a pattern from an opaque token — it is NOT scannable and carries no personal data. */
export function MockQRCode({ token, size = 168, className }: { token: string; size?: number; className?: string }) {
  const N = 25;
  const cells: boolean[] = [];
  let s = hash(token) || 7;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  const inFinder = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) cells.push(inFinder(r, c) ? false : rnd() > 0.52);
  const finder = (r0: number, c0: number) => (
    <g key={`${r0}-${c0}`}>
      <rect x={c0} y={r0} width={7} height={7} fill="currentColor" />
      <rect x={c0 + 1} y={r0 + 1} width={5} height={5} fill="var(--qr-bg, #fff)" />
      <rect x={c0 + 2} y={r0 + 2} width={3} height={3} fill="currentColor" />
    </g>
  );
  return (
    <svg role="img" aria-label="Mock QR code. Demo only, not scannable." viewBox={`-1 -1 ${N + 2} ${N + 2}`} width={size} height={size} className={cn("rounded-xl bg-white p-1 text-[#0d0b10] [--qr-bg:#fff]", className)} shapeRendering="crispEdges">
      {cells.map((on, i) => on ? <rect key={i} x={i % N} y={Math.floor(i / N)} width={1} height={1} fill="currentColor" /> : null)}
      {finder(0, 0)}{finder(0, N - 7)}{finder(N - 7, 0)}
    </svg>
  );
}

export function AccessibleMediaFallback({ title, hue = 260, children }: { title: string; hue?: number; children?: React.ReactNode }) {
  return <DemoArt hue={hue} title={title} subtitle="Media unavailable" label={false} className="size-full" ratio="16/9">{children}</DemoArt>;
}
