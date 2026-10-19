"use client";
import { HandHeart, Ticket } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { QueryBoundary, EmptyState, LoadingSkeleton } from "@/components/feedback";
import { FilterBar, PageHeader, SearchField } from "@/components/data-display";
import { Button, buttonStyles } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Chips, Tabs } from "@/components/ui/tabs";
import { CATEGORY_LABEL, EventCard } from "@/features/events/event-card";
import { useApiQuery } from "@/lib/query";
import { fan } from "@/lib/api";
import { DISTRICTS } from "@/data/seeds/locations";
import { useSession } from "@/stores/session";

export default function EventsPage() {
  const userId = useSession((s) => s.userId);
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [district, setDistrict] = useState("all");
  const query = useApiQuery(["events", when, q, cat, district], () => fan.listEvents(userId!, { when, q, category: cat, districtId: district }), !!userId);
  const cats = [{ value: "all", label: "All types" }, ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))];
  return (
    <div>
      <PageHeader eyebrow="Events" title="Meet, watch, give back" subtitle="Community events and welfare drives. RSVPs and passes are for approved members." actions={<><Link href="/events/mine" className={buttonStyles({ variant: "outline" })}><Ticket className="size-4" aria-hidden />My events</Link><Link href="/events/welfare" className={buttonStyles({ variant: "outline" })}><HandHeart className="size-4" aria-hidden />Welfare</Link></>} />
      <FilterBar>
        <Tabs label="When" value={when} onChange={setWhen} items={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} />
        <SearchField value={q} onChange={setQ} placeholder="Search events or venues" label="Search events" className="sm:w-72" />
        <Select aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)} className="sm:w-48 !h-12"><option value="all">All districts</option>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
      </FilterBar>
      <div className="mb-6"><Chips label="Event type" items={cats} value={cat} onChange={setCat} /></div>
      <QueryBoundary query={query} skeleton={<LoadingSkeleton variant="cards" count={3} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title={when === "upcoming" ? "No upcoming events match" : "No past events match"} body="Try clearing a filter or switching tabs." action={<Button variant="outline" onClick={() => { setQ(""); setCat("all"); setDistrict("all"); }}>Clear filters</Button>} />}>
        {(list) => <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((x) => <EventCard key={x.event.id} event={x.event} stats={x.stats} myRsvp={x.myRsvp} ended={when === "past"} />)}</div>}
      </QueryBoundary>
    </div>
  );
}
