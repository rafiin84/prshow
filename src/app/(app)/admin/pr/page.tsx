"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader } from "@/components/data-display";
import { DemoArt } from "@/components/media";
import { Badge, DemoContentBadge, OfficialBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { PolicyNote } from "@/features/admin/components";
import { useAdmin } from "@/features/admin/use-admin";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { canManageGlobalContent } from "@/lib/permissions/policy";
import { albumSchema } from "@/lib/validation";
import type { GalleryAlbum, Movie } from "@/types";

type AV = { title: string; description: string; category: GalleryAlbum["category"]; rights: string };
function AlbumDialog({ open, onClose, album }: { open: boolean; onClose: () => void; album?: GalleryAlbum }) {
  const { adminId } = useAdmin();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AV>({ resolver: zodResolver(albumSchema) as never, values: album ? { title: album.title, description: album.description, category: album.category, rights: album.rights } : { title: "", description: "", category: "stills", rights: "" } });
  const save = useApiMutation((v: AV) => adminApi.saveAlbum(adminId, { id: album?.id, ...v }), { success: album ? "Album updated" : "Album created as a draft", onSuccess: () => { reset(); onClose(); } });
  return (
    <Modal open={open} onClose={onClose} title={album ? "Edit album" : "New album"} size="md" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>Save</Button></>}>
      <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))}>
        <Field label="Title" error={errors.title?.message}>{(p) => <Input {...p} {...register("title")} />}</Field>
        <Field label="Description" error={errors.description?.message}>{(p) => <Textarea {...p} rows={2} {...register("description")} />}</Field>
        <Field label="Category">{(p) => <Select {...p} {...register("category")}><option value="stills">Movie stills</option><option value="bts">Behind the scenes</option><option value="posters">Posters</option><option value="events">Events</option><option value="promo">Promotions</option></Select>}</Field>
        <Field label="Rights & attribution" hint="Who owns these images and what clearance exists." error={errors.rights?.message}>{(p) => <Textarea {...p} rows={2} {...register("rights")} />}</Field>
      </form>
    </Modal>
  );
}

function MovieDialog({ movie, onClose }: { movie: Movie | null; onClose: () => void }) {
  const { adminId } = useAdmin();
  const [syn, setSyn] = useState(movie?.synopsis ?? "");
  const [ver, setVer] = useState(movie?.verified ?? false);
  const save = useApiMutation(() => adminApi.updateMovieMeta(adminId, movie!.id, { synopsis: syn, verified: ver }), { success: "Movie updated", onSuccess: onClose });
  return (
    <Modal open={!!movie} onClose={onClose} title={`Edit ${movie?.title ?? ""}`} description="Mark details verified only after the official team has approved them." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="space-y-4" key={movie?.id}><Field label="Synopsis" hint="At least 20 characters.">{(p) => <Textarea {...p} rows={5} defaultValue={movie?.synopsis} onChange={(e) => setSyn(e.target.value)} />}</Field><Checkbox defaultChecked={movie?.verified} onChange={(e) => setVer(e.target.checked)} label="Details verified by the official team" /></div>
    </Modal>
  );
}

export default function AdminPR() {
  const { adminId, admin } = useAdmin();
  const [tab, setTab] = useState<"movies" | "albums">("movies");
  const [album, setAlbum] = useState<GalleryAlbum | undefined>();
  const [dlg, setDlg] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cap, setCap] = useState<Record<string, string>>({});
  const q = useApiQuery(["admin-content"], () => adminApi.adminListContent());
  const policy = admin ? canManageGlobalContent(admin.role) : { allowed: false };
  const mStatus = useApiMutation((v: { id: string; s: "published" | "draft" }) => adminApi.setMovieStatus(adminId, v.id, v.s), { success: (m) => `${m.title} is now ${m.status}` });
  const aStatus = useApiMutation((v: { id: string; s: "published" | "draft" }) => adminApi.setAlbumStatus(adminId, v.id, v.s), { success: (a) => `${a.title} is now ${a.status}` });
  const addAsset = useApiMutation((v: { id: string; caption: string }) => adminApi.addAssetPlaceholder(adminId, v.id, v.caption), { success: "Placeholder asset added (no file stored)", onSuccess: (_a, v) => setCap((c) => ({ ...c, [v.id]: "" })) });
  const move = useApiMutation((v: { a: string; s: string; d: -1 | 1 }) => adminApi.moveAsset(adminId, v.a, v.s, v.d));
  return (
    <div>
      <PageHeader title="PR content" subtitle="Movies and official albums shown in the PR tab. Official content is always labelled; attribution and rights live here." actions={tab === "albums" ? <Button disabled={!policy.allowed} onClick={() => { setAlbum(undefined); setDlg(true); }}><Plus className="size-4" aria-hidden />New album</Button> : undefined} />
      <PolicyNote policy={policy} />
      <Tabs label="Content type" value={tab} onChange={setTab} items={[{ value: "movies", label: "Movies" }, { value: "albums", label: "Gallery albums" }]} className="my-5 max-w-fit" />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton count={3} />}>
        {({ movies, albums }) => tab === "movies" ? (
          <ul className="space-y-3">{movies.map((m) => (
            <li key={m.id}><Card className="flex flex-wrap items-center gap-4 p-4"><DemoArt hue={m.hue} ratio="2/3" label={false} className="w-14 shrink-0 !rounded-xl" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{m.title}</h2><span className="text-sm text-muted-fg">{m.year}</span><StatusBadge status={m.status} />{m.verified ? <Badge tone="success">Verified details</Badge> : <DemoContentBadge label="Unverified" />}</div><p className="line-clamp-1 text-sm text-muted-fg">{m.synopsis}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!policy.allowed} onClick={() => setMovie(m)}>Edit details</Button><Button size="sm" variant={m.status === "published" ? "ghost" : "primary"} disabled={!policy.allowed} loading={mStatus.isPending} onClick={() => mStatus.mutate({ id: m.id, s: m.status === "published" ? "draft" : "published" })}>{m.status === "published" ? "Unpublish" : "Publish"}</Button></div></Card></li>
          ))}</ul>
        ) : (
          <ul className="space-y-4">{albums.map((a) => (
            <li key={a.id}><Card className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{a.title}</h2><StatusBadge status={a.status} /><OfficialBadge /></div><p className="text-sm text-muted-fg">{a.description}</p><p className="mt-1 text-xs text-muted-fg">Rights: {a.rights}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!policy.allowed} onClick={() => { setAlbum(a); setDlg(true); }}>Edit</Button><Button size="sm" variant={a.status === "published" ? "ghost" : "primary"} disabled={!policy.allowed} onClick={() => aStatus.mutate({ id: a.id, s: a.status === "published" ? "draft" : "published" })}>{a.status === "published" ? "Unpublish" : "Publish"}</Button></div></div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{a.assets.map((s, i) => (
                <li key={s.id} className="space-y-1"><DemoArt hue={s.hue} ratio="1/1" alt={s.caption} label={false} /><p className="line-clamp-1 text-xs">{s.caption}</p><div className="flex gap-1"><Button size="sm" variant="ghost" className="!h-8 !px-2" aria-label={`Move ${s.caption} earlier`} disabled={!policy.allowed || i === 0} onClick={() => move.mutate({ a: a.id, s: s.id, d: -1 })}><ArrowUp className="size-4" aria-hidden /></Button><Button size="sm" variant="ghost" className="!h-8 !px-2" aria-label={`Move ${s.caption} later`} disabled={!policy.allowed || i === a.assets.length - 1} onClick={() => move.mutate({ a: a.id, s: s.id, d: 1 })}><ArrowDown className="size-4" aria-hidden /></Button></div></li>
              ))}</ul>
              <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); addAsset.mutate({ id: a.id, caption: cap[a.id] ?? "" }); }}><Input aria-label={`Caption for new asset in ${a.title}`} placeholder="Caption for a placeholder upload" value={cap[a.id] ?? ""} onChange={(e) => setCap((c) => ({ ...c, [a.id]: e.target.value }))} className="max-w-sm" disabled={!policy.allowed} /><Button type="submit" variant="outline" disabled={!policy.allowed} loading={addAsset.isPending}>Add placeholder asset</Button></form>
            </Card></li>
          ))}</ul>
        )}
      </QueryBoundary>
      <AlbumDialog open={dlg} onClose={() => setDlg(false)} album={album} />
      <MovieDialog key={movie?.id ?? "none"} movie={movie} onClose={() => setMovie(null)} />
    </div>
  );
}
