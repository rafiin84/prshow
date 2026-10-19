"use client";
import { ChatsCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/data-display";
import { ConversationList } from "@/features/admin/messages";

export default function Messages() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Admin-only. Fans can't send or receive direct messages." />
      <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface lg:h-[calc(100dvh-14rem)] lg:grid-cols-[22rem_1fr]">
        <div className="overflow-y-auto p-3 lg:border-r lg:border-border"><ConversationList /></div>
        <div className="hidden place-items-center p-8 text-center lg:grid"><div><ChatsCircle weight="duotone" className="mx-auto size-14 text-muted-fg" aria-hidden /><p className="mt-3 font-semibold">Select a conversation</p><p className="text-sm text-muted-fg">Choose one from the list to read and reply.</p></div></div>
      </div>
    </div>
  );
}
