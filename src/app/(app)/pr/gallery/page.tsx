"use client";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { OfficialBadge } from "@/components/ui/badge";
import { Chips } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";

const CATS = [{ value: "all", label: "All" }, { value: "stills", label: "Movie stills" }, { value: "bts", label: "Behind the scenes" }, { value: "posters", label: "Posters" }, { value: "events", label: "Events" }];
export default function Gallery() {
  const [cat, setCat] = useState("all");
  const q = useApiQuery(["albums"], () => fan.listAlbums());
  return (
    <div>
      <PageHeader backHref="/pr" backLabel="PR" title="Official gallery" subtitle="Curated albums from the official team. Images here are demo artwork until approved photography is supplied." actions={<OfficialBadge />} />
      <div className="mb-6"><Chips label="Album category" items={CATS} value={cat} onChange={setCat} /></div>
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="cards" count={4} />} isEmpty={(d) => d.filter((a) => cat === "all" || a.category === cat).length === 0} empty={<EmptyState title="No albums in this category" body="Try another category." />}>
        {(list) => (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.filter((a) => cat === "all" || a.category === cat).map((a) => (
              <li key={a.id}><Link href={`/pr/gallery/${a.id}`} className="group block"><DemoArt hue={a.hue} ratio="4/3" className="transition-transform duration-500 group-hover:-translate-y-1" title={a.title} subtitle={`${a.assets.length} photos`} /><p className="mt-2 text-sm text-muted-fg">{a.description}</p></Link></li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
