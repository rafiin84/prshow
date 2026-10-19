"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { useToastStore } from "@/stores/toast";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 top-3 z-[100] mx-auto flex w-full max-w-md flex-col gap-2 px-3 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle : t.tone === "error" ? WarningCircle : Info;
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={t.tone === "error" ? "alert" : "status"} className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-elevated p-3.5 pr-2 shadow-pop sm:w-96">
              <Icon weight="fill" className={`mt-0.5 size-5 shrink-0 ${t.tone === "success" ? "text-success" : t.tone === "error" ? "text-danger" : "text-info"}`} aria-hidden />
              <div className="min-w-0 flex-1 text-sm"><p className="font-medium">{t.title}</p>{t.description && <p className="mt-0.5 text-muted-fg">{t.description}</p>}
                {t.action && <button onClick={() => { t.action!.onClick(); dismiss(t.id); }} className="mt-1.5 cursor-pointer font-medium text-accent underline-offset-2 hover:underline">{t.action.label}</button>}</div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-fg hover:bg-muted"><X className="size-4" /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
