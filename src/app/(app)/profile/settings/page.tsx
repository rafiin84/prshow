"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useApiMutation, useApiQuery } from "@/lib/query";
import { demo, fan } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { useTheme, type Theme } from "@/lib/theme";
import { useSession } from "@/stores/session";
import Link from "next/link";

export default function Settings() {
  const router = useRouter();
  const { userId, signOut, role } = useSession();
  const { theme, setTheme } = useTheme();
  const [confirm, setConfirm] = useState(false);
  const q = useApiQuery(["profile"], () => fan.getProfile(userId!), !!userId && role === "fan");
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: "", handle: "", bio: "" } });
  useEffect(() => { if (q.data) reset({ name: q.data.fan.name, handle: q.data.fan.handle, bio: q.data.fan.bio }); }, [q.data, reset]);
  const save = useApiMutation((v: { name: string; handle: string; bio: string }) => fan.updateProfile(userId!, v), { success: "Profile updated" });
  const prefs = useApiMutation((p: Parameters<typeof fan.updatePrefs>[1]) => fan.updatePrefs(userId!, p));
  const resetAll = useApiMutation(() => demo.reset(), { success: "Demo data reset", onSuccess: () => { signOut(); router.push("/welcome"); } });
  if (role !== "fan") { router.replace("/profile"); return null; }
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backHref="/profile" backLabel="Profile" title="Settings" />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {({ fan: f }) => (
          <div className="space-y-10">
            <section><SectionHeading title="Profile" as="h2" />
              <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-4">
                <Field label="Display name" error={errors.name?.message}>{(p) => <Input {...p} {...register("name")} />}</Field>
                <Field label="Handle" hint="Letters, numbers, dot or underscore." error={errors.handle?.message}>{(p) => <Input {...p} {...register("handle")} />}</Field>
                <Field label="Bio" optional error={errors.bio?.message}>{(p) => <Textarea {...p} rows={3} {...register("bio")} />}</Field>
                <Button type="submit" loading={save.isPending} disabled={!isDirty}>Save changes</Button>
              </form>
            </section>
            <section><SectionHeading title="Privacy & notifications" />
              <Card className="divide-y divide-border py-2">
                <Switch checked={f.prefs.showCity} onChange={(v) => prefs.mutate({ showCity: v })} label="Show my constituency on my profile" description="Your ward is never shown. District is always visible." />
                <Switch checked={f.prefs.notifyOfficial} onChange={(v) => prefs.mutate({ notifyOfficial: v })} label="Official updates" />
                <Switch checked={f.prefs.notifyEvents} onChange={(v) => prefs.mutate({ notifyEvents: v })} label="Event reminders" />
                <Switch checked={f.prefs.notifyQuiz} onChange={(v) => prefs.mutate({ notifyQuiz: v })} label="Quiz and reward updates" />
              </Card>
              <p className="mt-2 text-xs text-muted-fg">Demo build: no push infrastructure exists. These settings control what appears in your Notification centre.</p>
            </section>
            <section><SectionHeading title="Appearance" /><Tabs label="Theme" value={theme} onChange={(v) => setTheme(v as Theme)} items={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} className="max-w-fit" /></section>
            <section><SectionHeading title="Account" />
              <div className="flex flex-wrap gap-3"><Link href="/help" className="inline-flex h-11 items-center rounded-full border border-border px-5 font-medium hover:bg-muted">Help, privacy &amp; guidelines</Link><Button variant="outline" onClick={() => { signOut(); router.push("/welcome"); }}>Sign out</Button><Button variant="danger" onClick={() => setConfirm(true)}>Reset demo</Button></div>
            </section>
            <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => resetAll.mutate()} loading={resetAll.isPending} tone="danger" title="Reset the demo?" description="Restores all demo data to its seeded state and signs you out." confirmLabel="Reset and sign out" />
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
