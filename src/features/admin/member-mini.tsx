"use client";
import Link from "next/link";
import { Avatar } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { locLabel } from "@/data/seeds/locations";
import type { FanProfile } from "@/types";

export function MemberRowMini({ fan }: { fan: FanProfile }) {
  return (
    <Link href={`/admin/members/${fan.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:shadow-card">
      <Avatar name={fan.name} hue={fan.hue} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{fan.name}</p><p className="truncate text-sm text-muted-fg">{locLabel(fan.loc, 3)}</p></div><StatusBadge status={fan.verification} />
    </Link>
  );
}
