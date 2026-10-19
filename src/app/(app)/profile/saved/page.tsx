"use client";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Tabs } from "@/components/ui/tabs";
import { MovieCard } from "@/features/movies/movie-card";
import { ReelThumb } from "@/features/reels/reel-thumb";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";
import { assetImage } from "@/data/images";


export default function Saved() {
  const userId = useSession((s) => s.userId);
  const [tab, setTab] = useState<"movies" | "reels" | "photos">("movies");
  const q = useApiQuery(["saved"], () => fan.listSaved(userId!), !!userId);
  return (
    <div>
      <PageHeader backHref="/profile" backLabel="Profile" title="Saved" subtitle="Movies, reels and photos you've bookmarked." />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" />}>
        {(s) => (
          <>
            <Tabs label="Saved type" value={tab} onChange={setTab} items={[{ value: "movies", label: "Movies", count: s.movies.length }, { value: "reels", label: "Reels", count: s.reels.length }, { value: "photos", label: "Photos", count: s.assets.length }]} className="mb-6 max-w-fit" />
            {tab === "movies" && (s.movies.length === 0 ? <EmptyState title="No saved movies" body="Tap Save on a movie to keep it here." action={<Link href="/pr/movies" className="font-medium text-accent">Browse movies</Link>} /> : <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">{s.movies.map((m) => <MovieCard key={m.id} movie={m} />)}</div>)}
            {tab === "reels" && (s.reels.length === 0 ? <EmptyState title="No saved reels" body="Save a reel from the feed." action={<Link href="/reels" className="font-medium text-accent">Open reels</Link>} /> : <div className="flex flex-wrap gap-4">{s.reels.map((r) => <ReelThumb key={r.id} reel={r} />)}</div>)}
            {tab === "photos" && (s.assets.length === 0 ? <EmptyState title="No saved photos" body="Open a gallery photo and tap Save." action={<Link href="/pr/gallery" className="font-medium text-accent">Open gallery</Link>} /> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{s.assets.map((a) => <Link key={a.id} href={`/pr/gallery/${a.albumId}`}><DemoArt hue={a.hue} src={assetImage(a)} ratio="1/1" alt={a.caption} label={false} /></Link>)}</div>)}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
