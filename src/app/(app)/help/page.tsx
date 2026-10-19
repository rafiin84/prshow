"use client";
import Link from "next/link";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/data-display";
import { useSession } from "@/stores/session";

type Topic = "help" | "privacy" | "guidelines";

const FAQ = [
  ["How do I become a verified member?", "Create a profile, choose your location, complete the two demo checks and submit. A Ward Admin reviews and approves every application. It is never automatic."],
  ["Who can see my profile?", "Fans can't see each other's private details. Admins only see profile-safe information for members inside their own geographic scope."],
  ["Are rewards real?", "Wallpapers are demo artwork. Movie passes and event tickets are clearly labelled simulated rewards and can't be redeemed for real entry."],
  ["Why is my reel not visible?", "Fan reels stay private until a moderator approves them. Check My submissions to see the status and any feedback."],
  ["Can fans message each other?", "No. Direct messages exist only for admins. Use reel comments or events to connect."],
];
const RULES = [
  ["Be kind", "No harassment, hate or personal attacks."],
  ["Protect privacy", "Never share anyone's address, phone number or ID, including your own."],
  ["Respect rights", "Only upload work you made or have permission to use. No ripped clips or full songs."],
  ["No resale or spam", "Ticket resale, promotions and chain messages are removed."],
  ["Stay factual", "Don't present rumours as official news."],
  ["Keep it safe", "No violence or sexual content."],
];

export default function HelpPage() {
  const [tab, setTab] = useState<Topic>("help");
  const role = useSession((s) => s.role);
  return (
    <div>
      <PageHeader title="Help, privacy & guidelines" subtitle="Plain-language answers about how PR Show works." backHref={role === "fan" ? "/profile" : "/profile"} />
      <Tabs label="Help topics" value={tab} onChange={setTab} items={[{ value: "help", label: "Help" }, { value: "privacy", label: "Privacy" }, { value: "guidelines", label: "Community guidelines" }]} className="mb-6 max-w-fit" />
      {tab === "help" && <div className="max-w-2xl space-y-3">{FAQ.map(([q, a]) => <details key={q} className="rounded-2xl border border-border bg-surface p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-muted-fg">{a}</p></details>)}</div>}
      {tab === "privacy" && (
        <article className="max-w-2xl space-y-4 text-[0.95rem]">
          <p className="rounded-2xl bg-gold-soft p-4 text-gold"><strong>This is a demo build.</strong> Everything below describes how the finished product is intended to behave and how this demo simulates it.</p>
          <h2 className="text-xl font-semibold">What we collect</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-fg"><li>Your name, a masked mobile number and your chosen location (district, constituency and ward).</li><li>Your activity: quiz attempts, RSVPs, submissions and points.</li></ul>
          <h2 className="text-xl font-semibold">What we never collect in this build</h2>
          <ul className="list-disc space-y-1 pl-6 text-muted-fg"><li>Aadhaar numbers or identity-document images.</li><li>Face templates, biometrics or live camera feeds.</li><li>Payment details.</li></ul>
          <h2 className="text-xl font-semibold">Who can see what</h2>
          <p className="text-muted-fg">Admins see only profile-safe details for members in their scope. Membership and event QR codes carry opaque tokens, never personal data.</p>
          <h2 className="text-xl font-semibold">Demo-only controls</h2>
          <p className="text-muted-fg">The role switcher, demo clock and failure simulation are evaluation tools. They are not security controls.</p>
        </article>
      )}
      {tab === "guidelines" && (
        <article className="max-w-2xl space-y-4 text-[0.95rem]">
          <p className="text-muted-fg">PR Show is a place to celebrate cinema and community. A human moderator reviews every fan submission before it is public.</p>
          <ul className="space-y-3">{RULES.map(([h, b]) => <li key={h} className="rounded-2xl border border-border bg-surface p-4"><p className="font-semibold">{h}</p><p className="text-sm text-muted-fg">{b}</p></li>)}</ul>
          <p className="text-sm text-muted-fg">See something wrong? Use <strong>Report</strong> on any reel. <Link href="/" className="text-accent underline">Back to home</Link></p>
        </article>
      )}
    </div>
  );
}
