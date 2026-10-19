"use client";
import { Play } from "@phosphor-icons/react";
import Link from "next/link";
import { DemoArt } from "@/components/media";
import { FanContentBadge, OfficialBadge } from "@/components/ui/badge";
import type { Reel } from "@/types";
import { reelImage } from "@/data/images";


export function ReelThumb({ reel, href }: { reel: Reel; href?: string }) {
  return (
    <Link href={href ?? `/reels/${reel.id}`} className="group block w-40 shrink-0 snap-start sm:w-44">
      <DemoArt hue={reel.hue} src={reelImage(reel)} ratio="9/16" label={false} className="transition-transform duration-300 group-hover:-translate-y-1">
        <span className="absolute inset-0 grid place-items-center"><span className="grid size-12 place-items-center rounded-full bg-black/35 backdrop-blur-sm transition-transform group-hover:scale-110"><Play weight="fill" className="size-5" aria-hidden /></span></span>
        <span className="absolute right-2 bottom-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-medium">0:{String(reel.durationSec).padStart(2, "0")}</span>
        <span className="absolute top-2 left-2">{reel.source === "official" ? <OfficialBadge /> : <FanContentBadge />}</span>
      </DemoArt>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{reel.title}</p>
      <p className="text-xs text-muted-fg">{reel.creatorName}</p>
    </Link>
  );
}
