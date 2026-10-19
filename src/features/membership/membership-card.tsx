"use client";
import { motion } from "framer-motion";
import { Seal } from "@phosphor-icons/react";
import { MockQRCode } from "@/components/media";
import type { FanProfile } from "@/types";
import { fmtDate } from "@/lib/utils";
import { locLabel } from "@/data/seeds/locations";

export function MembershipCard({ fan }: { fan: FanProfile }) {
  const m = fan.membership;
  if (!m) return null;
  return (
    <motion.article initial={{ rotateX: 8, opacity: 0, y: 12 }} animate={{ rotateX: 0, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 18 }} whileHover={{ rotateY: -3, rotateX: 2 }} style={{ transformPerspective: 900 }}
      aria-label={`Membership card for ${fan.name}`} className="relative isolate w-full max-w-md overflow-hidden rounded-[28px] bg-[#100d16] p-6 text-[#f7f1e8] shadow-pop">
      <div aria-hidden className="absolute -top-20 -right-16 size-64 rounded-full bg-[#d23a1f]/70 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 -left-10 size-56 rounded-full bg-[#b97a12]/40 blur-3xl" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07]" style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0 1px,transparent 1px 10px)" }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-xl font-bold">PR Show</p>
          <p className="text-[0.65rem] tracking-[0.2em] uppercase opacity-70">Beyond the Screen</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium backdrop-blur"><Seal weight="fill" className="size-3.5 text-[#ffb59f]" aria-hidden />Verified member</span>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.65rem] tracking-[0.18em] uppercase opacity-60">Member</p>
          <p className="font-display truncate text-2xl font-semibold">{fan.name}</p>
          <p className="mt-3 text-[0.65rem] tracking-[0.18em] uppercase opacity-60">Member no.</p>
          <p className="font-mono text-lg tracking-wider">{m.memberNo}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 text-xs">
            <div><dt className="opacity-60">Status</dt><dd className="font-medium capitalize">{m.status}</dd></div>
            <div><dt className="opacity-60">Issued</dt><dd className="font-medium">{m.issuedAt ? fmtDate(m.issuedAt) : "—"}</dd></div>
            <div className="col-span-2 mt-1.5"><dt className="opacity-60">Chapter</dt><dd className="font-medium">{locLabel(fan.loc, 2)}</dd></div>
          </dl>
        </div>
        <div className="shrink-0 text-center">
          <MockQRCode token={m.qrToken} size={96} />
          <p className="mt-1 text-[0.6rem] opacity-60">Mock QR · demo</p>
        </div>
      </div>
    </motion.article>
  );
}
