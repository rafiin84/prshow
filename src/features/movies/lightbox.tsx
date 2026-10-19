"use client";
import { ArrowLeft, ArrowRight, BookmarkSimple, ShareNetwork } from "@phosphor-icons/react";
import { useEffect } from "react";
import { DemoArt } from "@/components/media";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import type { GalleryAsset } from "@/types";
import { assetImage } from "@/data/images";


export function GalleryLightbox({ assets, index, onIndex, onClose, saved, onSave, onShare }: { assets: GalleryAsset[]; index: number | null; onIndex: (i: number) => void; onClose: () => void; saved: (id: string) => boolean; onSave: (id: string) => void; onShare: (a: GalleryAsset) => void }) {
  const open = index !== null;
  const a = open ? assets[index] : undefined;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index! + 1) % assets.length);
      if (e.key === "ArrowLeft") onIndex((index! - 1 + assets.length) % assets.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, assets.length, onIndex]);
  return (
    <Modal open={open} onClose={onClose} title={a ? `Photo ${index! + 1} of ${assets.length}` : "Photo"} size="lg" sheet={false}
      footer={a && <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onIndex((index! - 1 + assets.length) % assets.length)} aria-label="Previous photo"><ArrowLeft className="size-4" aria-hidden />Prev</Button><Button variant="outline" size="sm" onClick={() => onIndex((index! + 1) % assets.length)} aria-label="Next photo">Next<ArrowRight className="size-4" aria-hidden /></Button></div>
        <div className="flex gap-2"><Button variant="ghost" size="sm" aria-pressed={saved(a.id)} onClick={() => onSave(a.id)}><BookmarkSimple weight={saved(a.id) ? "fill" : "regular"} className="size-4" aria-hidden />{saved(a.id) ? "Saved" : "Save"}</Button><Button variant="ghost" size="sm" onClick={() => onShare(a)}><ShareNetwork className="size-4" aria-hidden />Share</Button></div>
      </div>}>
      {a && (
        <figure>
          <DemoArt hue={a.hue} src={assetImage(a)} ratio={String(Math.min(1.6, Math.max(0.75, a.ratio)))} alt={a.caption} label="Demo art" className="mx-auto max-h-[60dvh] w-full" />
          <figcaption className="mt-4"><p className="font-medium">{a.caption}</p><p className="text-sm text-muted-fg">{a.credit}</p><p className="mt-1 text-xs text-muted-fg">Tip: use ← → to browse, Esc to close.</p></figcaption>
        </figure>
      )}
    </Modal>
  );
}
