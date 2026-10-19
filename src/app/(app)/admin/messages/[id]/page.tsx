"use client";
import { use } from "react";
import { ConversationList, Thread } from "@/features/admin/messages";

export default function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface lg:h-[calc(100dvh-9rem)] lg:grid-cols-[22rem_1fr]">
      <div className="hidden overflow-y-auto p-3 lg:block lg:border-r lg:border-border"><ConversationList activeId={id} /></div>
      <div className="flex min-h-[calc(100dvh-12rem)] flex-col lg:min-h-0"><Thread id={id} /></div>
    </div>
  );
}
