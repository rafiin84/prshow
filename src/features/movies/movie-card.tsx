"use client";
import Link from "next/link";
import { DemoArt } from "@/components/media";
import { Badge } from "@/components/ui/badge";
import type { Movie } from "@/types";

export function MoviePoster({ movie, className }: { movie: Movie; className?: string }) {
  return <DemoArt hue={movie.hue} ratio="2/3" title={movie.title} subtitle={String(movie.year)} src={movie.poster} alt={`${movie.title} (${movie.year}) poster`} className={className} />;
}
export function MovieCard({ movie, href }: { movie: Movie; href?: string }) {
  return (
    <Link href={href ?? `/pr/movies/${movie.id}`} className="group block">
      <MoviePoster movie={movie} className="transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:shadow-pop" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div><p className="font-semibold leading-snug">{movie.title}</p><p className="text-sm text-muted-fg">{movie.year} · {movie.role}</p></div>
        {!movie.verified && <Badge tone="gold">Demo</Badge>}
      </div>
    </Link>
  );
}
