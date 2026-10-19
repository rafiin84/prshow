"use client";
import { useMemo, useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, SearchField } from "@/components/data-display";
import { Select } from "@/components/ui/form";
import { Chips } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/features/movies/movie-card";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";

const GENRES = ["all", "Comedy", "Drama", "Romantic comedy", "Fantasy"];
export default function Movies() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<"year-desc" | "year-asc" | "title">("year-desc");
  const query = useApiQuery(["movies", q, genre, sort], () => fan.listMovies({ q, genre, sort }));
  const items = useMemo(() => GENRES.map((g) => ({ value: g, label: g === "all" ? "All genres" : g })), []);
  return (
    <div>
      <PageHeader backHref="/pr" backLabel="PR" title="Movies" subtitle="Titles and years are limited to widely known facts. Synopses and credits are demo copy until the official team approves them." />
      <FilterBar>
        <SearchField value={q} onChange={setQ} placeholder="Search by title, genre or role" label="Search movies" className="sm:w-80" />
        <Select aria-label="Sort movies" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="sm:w-48 !h-12"><option value="year-desc">Newest first</option><option value="year-asc">Oldest first</option><option value="title">Title A–Z</option></Select>
      </FilterBar>
      <div className="mb-6"><Chips label="Genre" items={items} value={genre} onChange={setGenre} /></div>
      <QueryBoundary query={query} skeleton={<LoadingSkeleton variant="cards" count={4} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title="No movies match" body="Try a different search or clear the genre filter." action={<Button variant="outline" onClick={() => { setQ(""); setGenre("all"); }}>Clear filters</Button>} />}>
        {(list) => <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{list.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
      </QueryBoundary>
    </div>
  );
}
