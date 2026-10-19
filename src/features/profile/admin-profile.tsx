"use client";
import { CheckCircle, Prohibit } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QueryBoundary, LoadingSkeleton } from "@/components/feedback";
import { PageHeader, SectionHeading } from "@/components/data-display";
import { Avatar, Card } from "@/components/ui/misc";
import { Badge, ScopeBadge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";
import { admin } from "@/lib/api";
import { findAC, findDistrict, findWard } from "@/data/seeds/locations";
import { ROLE_LABEL, canManageGlobalContent, canNominate, canPublishQuiz, scopeLabel } from "@/lib/permissions/policy";
import { useSession } from "@/stores/session";
import { useTheme, type Theme } from "@/lib/theme";
import { useState, useEffect } from "react";

const PREF_KEY = "prshow.admin.prefs";
export function AdminProfileView() {
  const router = useRouter();
  const { userId, signOut } = useSession();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState({ escalations: true, nominations: true, reports: true });
  useEffect(() => { try { const s = localStorage.getItem(PREF_KEY); if (s) setPrefs(JSON.parse(s)); } catch { /* ignore */ } }, []);
  const setPref = (k: keyof typeof prefs, v: boolean) => { const n = { ...prefs, [k]: v }; setPrefs(n); try { localStorage.setItem(PREF_KEY, JSON.stringify(n)); } catch { /* ignore */ } };
  const q = useApiQuery(["admin-profile"], async () => admin.needAdmin(userId!), !!userId);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Admin profile" subtitle="Your role, scope and what you can do. Privileges can't be changed here." />
      <QueryBoundary query={q} skeleton={<LoadingSkeleton variant="detail" />}>
        {(a) => {
          const scope = scopeLabel(a.scope, { district: findDistrict(a.scope.districtId)?.name, ac: findAC(a.scope.acId)?.name, ward: findWard(a.scope.wardId)?.name });
          const perms: [string, boolean, string?][] = [
            ["Review and decide moderation items in scope", a.active],
            ["Review member verification in scope", a.active],
            ["Manage events and welfare in scope", a.active],
            ["Nominate AC Admins", canNominate(a, "ac").allowed, canNominate(a, "ac").reason],
            ["Nominate Ward Admins", canNominate(a, "ward").allowed, canNominate(a, "ward").reason],
            ["Give final approval for appointments", a.role === "central", "Central Admin only."],
            ["Publish quizzes", canPublishQuiz(a.role).allowed, canPublishQuiz(a.role).reason],
            ["Manage movies, albums and reward values", canManageGlobalContent(a.role).allowed, canManageGlobalContent(a.role).reason],
            ["Access admin messages", true],
          ];
          return (
            <div className="space-y-8">
              <Card className="flex flex-wrap items-center gap-5"><Avatar name={a.name} hue={a.hue} size={72} /><div className="min-w-0 flex-1"><h2 className="text-2xl font-semibold">{a.name}</h2><p className="text-muted-fg">{a.title}</p><div className="mt-2 flex flex-wrap gap-2"><ScopeBadge>{ROLE_LABEL[a.role]}</ScopeBadge><Badge>{scope}</Badge><StatusBadge status={a.active ? "active" : "inactive"} /></div></div></Card>
              <section><SectionHeading title="What you can do" /><ul className="grid gap-2 sm:grid-cols-2">{perms.map(([l, ok, why]) => <li key={l} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3.5 text-sm">{ok ? <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-success" aria-label="Allowed" /> : <Prohibit className="mt-0.5 size-5 shrink-0 text-muted-fg" aria-label="Not allowed" />}<span><span className={ok ? "" : "text-muted-fg"}>{l}</span>{!ok && why && <span className="block text-xs text-muted-fg">{why}</span>}</span></li>)}</ul></section>
              <section><SectionHeading title="Notifications" /><Card className="divide-y divide-border py-2"><Switch checked={prefs.escalations} onChange={(v) => setPref("escalations", v)} label="Moderation escalations" description="When an item reaches you." /><Switch checked={prefs.nominations} onChange={(v) => setPref("nominations", v)} label="Appointment updates" /><Switch checked={prefs.reports} onChange={(v) => setPref("reports", v)} label="Fan reports" /></Card></section>
              <section><SectionHeading title="Appearance" /><Tabs label="Theme" value={theme} onChange={(v) => setTheme(v as Theme)} items={[{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} className="max-w-fit" /></section>
              <Card className="space-y-2 bg-gold-soft/50"><h2 className="text-lg font-semibold">Demo role switcher</h2><p className="text-sm text-muted-fg">Use the <strong>Demo</strong> button in the header to switch between Fan and the four admin roles. This is a simulation for evaluators, not a security control and not a way to change real privileges.</p></Card>
              <div className="flex flex-wrap gap-3"><Link href="/help" className={buttonStyles({ variant: "outline" })}>Help &amp; guidelines</Link><Button variant="ghost" onClick={() => { signOut(); router.push("/welcome"); }}>Sign out</Button></div>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
