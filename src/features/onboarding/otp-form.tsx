"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useApiMutation } from "@/lib/query";
import { fan } from "@/lib/api";
import { otpSchema } from "@/lib/validation";
import { toast } from "@/stores/toast";

/** Simulated OTP: no SMS is sent. The demo code is shown on screen. */
export function OtpForm({ onVerified, phoneHint }: { onVerified: () => void; phoneHint?: string }) {
  const [left, setLeft] = useState(30);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<{ code: string }>({ resolver: zodResolver(otpSchema), defaultValues: { code: "" } });
  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);
  const verify = useApiMutation((v: { code: string }) => fan.verifyOtp(v.code), { silentError: true, onSuccess: onVerified, onError: (e) => setError("code", { message: e.message }) });
  return (
    <form onSubmit={handleSubmit((v) => verify.mutate(v))} noValidate className="space-y-5">
      <p className="rounded-2xl bg-gold-soft p-4 text-sm text-gold"><strong>Demo:</strong> no SMS is sent{phoneHint ? ` to ${phoneHint}` : ""}. Enter <span className="font-mono font-bold">123456</span>.</p>
      <Field label="6-digit code" error={errors.code?.message}>{(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className="text-center font-mono text-2xl tracking-[0.5em]" {...register("code")} />}</Field>
      <Button type="submit" size="lg" className="w-full" loading={verify.isPending}>Verify</Button>
      <div className="text-center text-sm text-muted-fg">
        {left > 0 ? <span aria-live="polite">Resend available in {left}s</span> : <button type="button" className="cursor-pointer font-medium text-accent" onClick={() => { setLeft(30); toast.info("Demo: a new code was “sent”.", "Still 123456 — nothing was actually delivered."); }}>Resend code</button>}
      </div>
    </form>
  );
}
