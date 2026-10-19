"use client";
import { PageHeader } from "@/components/data-display";
import { QuizHistoryList } from "@/features/games/history-list";
export default function History() {
  return <div className="mx-auto max-w-2xl"><PageHeader backHref="/games" backLabel="Fan Arena" title="Quiz history" subtitle="Every quiz you've played, with your personal best." /><QuizHistoryList /></div>;
}
