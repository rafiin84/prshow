"use client";
import { use, useState } from "react";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { OfficialBadge } from "@/components/ui/badge";
import { GalleryLightbox } from "@/features/movies/lightbox";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { share } from "@/lib/share";
import { useSession } from "@/stores/session";
import { assetImage } from "@/data/images";


export default function AlbumDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = useSession((s) => s.userId);
  const [open, setOpen] = useState<number | null>(null);
  const q = useApiQuery(["album", id], () => fan.getAlbum(id));
  const me = useApiQuery(["saved-ids"], async () => (await fan.getProfile(userId!)).fan.savedIds, !!userId);
  const save = useApiMutation((assetId: string) => fan.toggleSave(userId!, assetId), { success: (r) => (r.saved ? "Saved to your profile" : "Removed from saved") });
  return (
    <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" count={6} />}>
      {(a) => (
        <div>
          <PageHeader backHref="/pr/gallery" backLabel="Gallery" title={a.title} subtitle={a.description} actions={<OfficialBadge />} />
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
            {a.assets.map((s, i) => (
              <button key={s.id} onClick={() => setOpen(i)} aria-label={`Open photo: ${s.caption}`} className="group block w-full cursor-pointer break-inside-avoid text-left">
                <DemoArt hue={s.hue} src={assetImage(s)} ratio={String(s.ratio)} alt={s.caption} label={false} className="transition-transform duration-300 group-hover:scale-[1.02]" />
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-fg">Rights: {a.rights}</p>
          <GalleryLightbox assets={a.assets} index={open} onIndex={setOpen} onClose={() => setOpen(null)} saved={(aid) => !!me.data?.includes(aid)} onSave={(aid) => save.mutate(aid)} onShare={(s) => share(`${s.caption} — ${a.title} on PR Show`, `/pr/gallery/${a.id}`)} />
        </div>
      )}
    </QueryBoundary>
  );
}
