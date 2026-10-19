"use client";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const field = "w-full rounded-[14px] border border-border bg-surface px-4 text-[0.95rem] text-fg placeholder:text-muted-fg/70 transition-colors focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40 disabled:opacity-60 aria-[invalid=true]:border-danger";

export function Field({ label, hint, error, children, className, optional }: { label: string; hint?: string; error?: string; children: (p: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode; className?: string; optional?: boolean }) {
  const id = useId();
  const desc = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted-fg">Optional</span>}
      </label>
      {children({ id, "aria-describedby": desc, "aria-invalid": error ? true : undefined })}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-fg">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, "h-12", className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-28 py-3 leading-relaxed", className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return <select ref={ref} className={cn(field, "h-12 appearance-none bg-[length:1rem] bg-[position:right_1rem_center] bg-no-repeat pr-10 cursor-pointer", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%23888'%3E%3Cpath d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z'/%3E%3C/svg%3E\")" }} {...p}>{children}</select>;
});
export const Checkbox = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: React.ReactNode; description?: string }>(function Checkbox({ label, description, className, ...p }, ref) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={id} ref={ref} type="checkbox" className="mt-1 size-5 shrink-0 cursor-pointer accent-[var(--accent)]" aria-describedby={description ? `${id}-d` : undefined} {...p} />
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug">
        {label}
        {description && <span id={`${id}-d`} className="mt-0.5 block text-xs text-muted-fg">{description}</span>}
      </label>
    </div>
  );
});
export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        {description && <p className="text-xs text-muted-fg">{description}</p>}
      </div>
      <button id={id} role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cn("relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50", checked ? "bg-accent" : "bg-border")}>
        <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200", checked && "translate-x-5")} />
      </button>
    </div>
  );
}
