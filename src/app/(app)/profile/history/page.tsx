"use client";
import { PageHeader } from "@/components/data-display";
import { QuizHistoryList } from "@/features/games/history-list";
export default function ProfileHistory() {
  return <div className="mx-auto max-w-2xl"><PageHeader backHref="/profile" backLabel="Profile" title="Quiz history" subtitle="Everything you've played, with your personal best." /><QuizHistoryList /></div>;
}
