"use client";
import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Built on the native <dialog> element: focus is trapped, Escape closes, and focus returns to the opener —
 * all handled by the browser.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md", sheet = true, hideTitle }: {
  open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl"; sheet?: boolean; hideTitle?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const tid = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { opener.current = document.activeElement; d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    const onNativeClose = () => { (opener.current as HTMLElement | null)?.focus?.(); };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("close", onNativeClose);
    return () => { d.removeEventListener("cancel", onCancel); d.removeEventListener("close", onNativeClose); };
  }, [onClose]);
  const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-5xl" }[size];
  return (
    <dialog ref={ref} className={cn("modal", sheet && "sheet")} aria-labelledby={tid} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className={cn("modal-panel flex max-h-[92dvh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-elevated text-fg shadow-pop", sheet ? "mx-auto max-sm:w-full max-sm:rounded-b-none" : "", width, "sm:w-[36rem]", size === "xl" && "sm:w-[64rem]", size === "sm" && "sm:w-[24rem]", size === "lg" && "sm:w-[42rem]")}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 id={tid} className={cn("text-xl font-semibold", hideTitle && "sr-only")}>{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-fg">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="-mr-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-fg hover:bg-muted hover:text-fg"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", tone = "primary", loading, children }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: string; confirmLabel?: string; tone?: "primary" | "danger"; loading?: boolean; children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm" footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
    </>}>{children}</Modal>
  );
}
