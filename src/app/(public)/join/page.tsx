"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { FlowFrame } from "@/features/onboarding/flow";
import { useApiMutation } from "@/lib/query";
import { fan } from "@/lib/api";
import { signupSchema, type SignupValues } from "@/lib/validation";
import { useSession } from "@/stores/session";
import { NEW_APPLICANT_ID } from "@/data/seeds/people";

export default function JoinPage() {
  const router = useRouter();
  const signInAs = useSession((s) => s.signInAs);
  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { name: "", phone: "" } });
  const start = useApiMutation((v: SignupValues) => fan.startApplicant({ name: v.name, phone: v.phone }), { onSuccess: () => { signInAs(NEW_APPLICANT_ID, "fan"); router.push("/join/otp"); } });
  return (
    <FlowFrame step={1} title="Create your PR Show profile" subtitle="Tell us who you are. You'll verify with a one-time code next." backHref="/welcome">
      <form onSubmit={handleSubmit((v) => start.mutate(v))} noValidate className="space-y-5">
        <Field label="Full name" error={errors.name?.message}>{(p) => <Input {...p} autoComplete="name" placeholder="e.g. Meera Sundaram" {...register("name")} />}</Field>
        <Field label="Mobile number" hint="Demo only — no SMS is sent." error={errors.phone?.message}>{(p) => <Input {...p} inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit number" {...register("phone")} />}</Field>
        <div className="space-y-3 rounded-2xl bg-muted p-4">
          <p className="text-sm font-medium">In plain language</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-fg"><li>We use your name and number to create your fan profile.</li><li>We never store Aadhaar numbers, ID documents or face data in this demo.</li><li>A human moderator approves every membership.</li></ul>
        </div>
        <div className="space-y-3">
          <div><Checkbox label="I am 18 or older" description="Demo eligibility rule until an approved policy is confirmed." {...register("adult")} />{errors.adult && <p role="alert" className="mt-1 ml-8 text-xs font-medium text-danger">{errors.adult.message}</p>}</div>
          <div><Checkbox label={<>I&apos;ve read the <Link href="/help" className="underline" target="_blank">privacy explanation</Link></>} {...register("consent")} />{errors.consent && <p role="alert" className="mt-1 ml-8 text-xs font-medium text-danger">{errors.consent.message}</p>}</div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={start.isPending}>Send code</Button>
        <p className="text-center text-sm text-muted-fg">Already a member? <Link href="/signin" className="font-medium text-accent">Sign in</Link></p>
      </form>
    </FlowFrame>
  );
}
