"use client";
import { useRouter } from "next/navigation";
import { FlowFrame } from "@/features/onboarding/flow";
import { OtpForm } from "@/features/onboarding/otp-form";
import { useSession } from "@/stores/session";
import { DEMO_FAN_ID } from "@/data/seeds/people";
export default function SignInOtp() {
  const router = useRouter();
  const signInAs = useSession((s) => s.signInAs);
  return <FlowFrame step={2} total={2} title="Enter your code" subtitle="One more step to sign in." backHref="/signin"><OtpForm onVerified={() => { signInAs(DEMO_FAN_ID, "fan"); router.push("/"); }} /></FlowFrame>;
}
