"use client";
import { MapPin } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/features/onboarding/location-picker";
import { FlowFrame } from "@/features/onboarding/flow";
import { STATE, locLabel } from "@/data/seeds/locations";
import { useApiMutation } from "@/lib/query";
import { fan } from "@/lib/api";
import { useSession } from "@/stores/session";

export default function LocationStep() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const [loc, setLoc] = useState({ districtId: "", acId: "", wardId: "" });
  const save = useApiMutation(() => fan.setApplicantLocation(userId!, loc), { onSuccess: () => router.push("/join/verify") });
  const complete = !!(loc.districtId && loc.acId && loc.wardId);
  return (
    <FlowFrame step={3} title="Where are you based?" subtitle="This places you in the right local community and decides which admins can see your profile." backHref="/join/otp">
      <div className="space-y-6">
        <LocationPicker value={loc} onChange={setLoc} />
        {complete && <p className="flex items-center gap-2 rounded-2xl bg-success-soft p-3 text-sm text-success"><MapPin weight="fill" className="size-5" aria-hidden />{STATE.name} · {locLabel(loc)}</p>}
        <Button size="lg" className="w-full" disabled={!complete || !userId} loading={save.isPending} onClick={() => save.mutate()}>Continue</Button>
        {!complete && <p className="text-center text-xs text-muted-fg">Choose all four levels to continue.</p>}
      </div>
    </FlowFrame>
  );
}
