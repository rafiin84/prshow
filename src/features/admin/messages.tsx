"use client";
import { ArrowLeft, ChatsCircle, Check, Checks, MagnifyingGlass, Paperclip, PaperPlaneTilt, WarningCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton, ErrorState } from "@/components/feedback";
import { Avatar } from "@/components/ui/misc";
import { Badge, ScopeBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/data-display";
import { useApiMutation, useApiQuery, useQueryClient } from "@/lib/query";
import { admin as adminApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { useAdmin } from "./use-admin";
import { ROLE_LABEL } from "@/lib/permissions/policy";
import { fmtDay, fmtRelative, fmtTime, cn } from "@/lib/utils";
import type { AdminMessage } from "@/types";

export function ConversationList({ activeId }: { activeId?: string }) {
  const { adminId, now } = useAdmin();
  const [q, setQ] = useState("");
  const query = useApiQuery(["conversations"], () => adminApi.listConversations(adminId), !!adminId);
  return (
    <div className="flex h-full flex-col">
      <SearchField value={q} onChange={setQ} placeholder="Search conversations" label="Search conversations" className="mb-3" />
      <QueryBoundary query={query} skeleton={<LoadingSkeleton count={4} />} isEmpty={(d) => d.length === 0} empty={<EmptyState icon={<ChatsCircle className="size-7" aria-hidden />} title="No conversations yet" body="Messages from other admins and system notices appear here." />}>
        {(list) => {
          const f = list.filter((x) => `${x.conversation.title} ${x.last?.body ?? ""}`.toLowerCase().includes(q.toLowerCase()));
          return f.length === 0 ? <EmptyState title="No matches" body="Try a different search." /> : (
            <ul className="space-y-1.5" aria-label="Conversations">
              {f.map(({ conversation: c, last, unread, participants }) => {
                const other = participants.find((p) => p.id !== adminId) ?? participants[0];
                return (
                  <li key={c.id}><Link href={`/admin/messages/${c.id}`} aria-current={activeId === c.id ? "page" : undefined} className={cn("flex items-start gap-3 rounded-2xl p-3 transition-colors", activeId === c.id ? "bg-muted" : "hover:bg-muted/60")}>
                    {c.kind === "system" ? <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-on-ink"><WarningCircle className="size-5" aria-hidden /></span> : c.kind === "group" ? <span className="grid size-10 shrink-0 place-items-center rounded-full bg-info-soft text-info"><ChatsCircle className="size-5" aria-hidden /></span> : <Avatar name={other.name} hue={other.hue} size={40} />}
                    <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className={cn("truncate", unread ? "font-bold" : "font-medium")}>{c.kind === "direct" ? other.name : c.title}</p>{last && <span className="shrink-0 text-xs text-muted-fg">{fmtRelative(last.at, now)}</span>}</div><p className="truncate text-sm text-muted-fg">{last ? `${last.fromId === adminId ? "You: " : ""}${last.body}` : "No messages"}</p><div className="mt-1 flex gap-1.5">{c.kind !== "direct" && <ScopeBadge>{c.kind === "system" ? "System" : "Group"}</ScopeBadge>}<Badge>{c.scopeNote}</Badge></div></div>
                    {unread > 0 && <span aria-label={`${unread} unread`} className="mt-1 grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs leading-5 font-bold text-accent-fg">{unread}</span>}
                  </Link></li>
                );
              })}
            </ul>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

interface Local { tempId: string; body: string; attachment?: AdminMessage["attachment"]; state: "sending" | "failed"; error?: string }

export function Thread({ id }: { id: string }) {
  const { adminId, admin } = useAdmin();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [attach, setAttach] = useState(false);
  const [find, setFind] = useState("");
  const [showFind, setShowFind] = useState(false);
  const [local, setLocal] = useState<Local[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const q = useApiQuery(["conversation", id], () => adminApi.getConversation(adminId, id), !!adminId);
  const markRead = useApiMutation(() => adminApi.markConversationRead(adminId, id), { silentError: true });
  const unreadCount = q.data?.messages.length;
  useEffect(() => {
    if (unreadCount !== undefined) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [q.data?.messages.length, local.length]);

  const send = async (l: Local) => {
    setLocal((arr) => arr.map((x) => (x.tempId === l.tempId ? { ...x, state: "sending", error: undefined } : x)));
    try {
      await adminApi.sendMessage(adminId, id, l.body, l.attachment);
      setLocal((arr) => arr.filter((x) => x.tempId !== l.tempId));
      qc.invalidateQueries({ queryKey: ["api"] });
    } catch (e) {
      setLocal((arr) => arr.map((x) => (x.tempId === l.tempId ? { ...x, state: "failed", error: e instanceof ApiError ? e.message : "Couldn't send." } : x)));
    }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const l: Local = { tempId: `t${Date.now()}`, body: text, attachment: attach ? { name: "meeting-notes.pdf", sizeKb: 96 } : undefined, state: "sending" };
    setLocal((a) => [...a, l]); setText(""); setAttach(false); void send(l);
  };

  return (
    <QueryBoundary query={q} skeleton={<div className="p-4"><LoadingSkeleton count={4} /></div>}>
      {({ conversation: c, messages, participants }) => {
        const system = c.kind === "system";
        const shown = find ? messages.filter((m) => m.body.toLowerCase().includes(find.toLowerCase())) : messages;
        return (
          <div className="flex h-full min-h-[60dvh] flex-col">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Link href="/admin/messages" aria-label="Back to conversations" className="grid size-9 place-items-center rounded-full hover:bg-muted lg:hidden"><ArrowLeft className="size-5" aria-hidden /></Link>
              <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{c.kind === "direct" ? participants.find((p) => p.id !== adminId)?.name ?? c.title : c.title}</h2><p className="truncate text-xs text-muted-fg">{participants.map((p) => `${p.name} (${ROLE_LABEL[p.role]})`).join(" · ")}</p></div>
              <Button variant="ghost" size="icon" aria-label="Search in conversation" aria-pressed={showFind} onClick={() => setShowFind((s) => !s)}><MagnifyingGlass className="size-5" aria-hidden /></Button>
            </header>
            {showFind && <div className="border-b border-border p-3"><SearchField value={find} onChange={setFind} placeholder="Search in this conversation" label="Search in conversation" /></div>}
            <div role="log" aria-live="polite" aria-label="Messages" className="flex-1 space-y-3 overflow-y-auto p-4">
              {shown.length === 0 && <EmptyState title={find ? "No matching messages" : "No messages yet"} body={find ? "Try another search." : "Say hello."} />}
              {shown.map((m, i) => {
                const mine = m.fromId === adminId;
                const sys = m.fromId === "system";
                const newDay = i === 0 || fmtDay(shown[i - 1].at) !== fmtDay(m.at);
                return (
                  <div key={m.id}>
                    {newDay && <p className="my-2 text-center text-xs text-muted-fg">{fmtDay(m.at)}</p>}
                    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%]", sys ? "border border-dashed border-border bg-muted" : mine ? "bg-accent text-accent-fg" : "bg-muted")}>
                        {!mine && <p className="mb-0.5 text-xs font-semibold opacity-80">{m.fromName}</p>}
                        <p className="text-[0.95rem] break-words whitespace-pre-wrap">{m.body}</p>
                        {m.attachment && <p className="mt-2 flex items-center gap-2 rounded-lg bg-black/10 px-2 py-1 text-xs"><Paperclip className="size-3.5" aria-hidden />{m.attachment.name} · {m.attachment.sizeKb} KB (sample)</p>}
                        <p className={cn("mt-1 flex items-center justify-end gap-1 text-[0.7rem]", mine ? "opacity-80" : "text-muted-fg")}>{fmtTime(m.at)}{mine && (m.status === "read" || m.readBy.length > 1 ? <Checks className="size-3.5" aria-label="Read" /> : <Check className="size-3.5" aria-label="Delivered" />)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {local.map((l) => (
                <div key={l.tempId} className="flex justify-end"><div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%]", l.state === "failed" ? "border border-danger bg-danger-soft text-fg" : "bg-accent/70 text-accent-fg")}>
                  <p className="text-[0.95rem] break-words whitespace-pre-wrap">{l.body}</p>
                  {l.state === "sending" ? <p className="mt-1 text-right text-[0.7rem] opacity-80">Sending…</p> : <div role="alert" className="mt-1 flex items-center justify-end gap-2 text-xs text-danger"><WarningCircle className="size-4" aria-hidden />{l.error}<button onClick={() => send(l)} className="cursor-pointer font-semibold underline">Retry</button><button onClick={() => setLocal((a) => a.filter((x) => x.tempId !== l.tempId))} aria-label="Discard message" className="cursor-pointer"><X className="size-4" aria-hidden /></button></div>}
                </div></div>
              ))}
              <div ref={end} />
            </div>
            {system ? <p className="border-t border-border p-4 text-center text-sm text-muted-fg">System notices are read-only.</p> : (
              <form onSubmit={submit} className="border-t border-border p-3">
                {attach && <p className="mb-2 flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 text-xs"><Paperclip className="size-4" aria-hidden />meeting-notes.pdf · 96 KB (sample attachment, nothing uploaded)<button type="button" onClick={() => setAttach(false)} aria-label="Remove attachment" className="ml-auto cursor-pointer"><X className="size-4" aria-hidden /></button></p>}
                <div className="flex items-end gap-2">
                  <Button type="button" variant="ghost" size="icon" aria-label="Attach a sample file" aria-pressed={attach} onClick={() => setAttach((a) => !a)}><Paperclip className="size-5" aria-hidden /></Button>
                  <label className="sr-only" htmlFor="composer">Message</label>
                  <textarea id="composer" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }} rows={1} placeholder="Write a message. Don't include identity numbers or private verification details." className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-[0.95rem] focus-visible:border-ring" />
                  <Button type="submit" size="icon" aria-label="Send message" disabled={!text.trim() || !admin?.active}><PaperPlaneTilt weight="fill" className="size-5" aria-hidden /></Button>
                </div>
              </form>
            )}
          </div>
        );
      }}
    </QueryBoundary>
  );
}
export { ErrorState, useMemo };
