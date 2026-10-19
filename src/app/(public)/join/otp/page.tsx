"use client";
import { useRouter } from "next/navigation";
import { FlowFrame } from "@/features/onboarding/flow";
import { OtpForm } from "@/features/onboarding/otp-form";
export default function JoinOtp() {
  const router = useRouter();
  return <FlowFrame step={2} title="Verify your number" subtitle="Enter the one-time code to confirm it's you." backHref="/join"><OtpForm onVerified={() => router.push("/join/location")} /></FlowFrame>;
}
