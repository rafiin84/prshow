"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { FlowFrame } from "@/features/onboarding/flow";
import { signinSchema } from "@/lib/validation";
import { useSession } from "@/stores/session";
import { DEMO_FAN_ID } from "@/data/seeds/people";

export default function SignIn() {
  const router = useRouter();
  const signInAs = useSession((s) => s.signInAs);
  const { register, handleSubmit, formState: { errors } } = useForm<{ phone: string }>({ resolver: zodResolver(signinSchema), defaultValues: { phone: "" } });
  return (
    <FlowFrame step={1} total={2} title="Welcome back" subtitle="Sign in with your mobile number." backHref="/welcome">
      <form onSubmit={handleSubmit(() => router.push("/signin/otp"))} noValidate className="space-y-5">
        <Field label="Mobile number" hint="Demo: any valid number signs you in as the demo fan." error={errors.phone?.message}>{(p) => <Input {...p} inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10-digit number" {...register("phone")} />}</Field>
        <Button type="submit" size="lg" className="w-full">Send code</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => { signInAs(DEMO_FAN_ID, "fan"); router.push("/"); }}>Skip: continue as demo fan</Button>
        <p className="text-center text-sm text-muted-fg">New here? <Link href="/join" className="font-medium text-accent">Create a profile</Link></p>
      </form>
    </FlowFrame>
  );
}
