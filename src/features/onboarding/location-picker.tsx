"use client";
import { Field, Select } from "@/components/ui/form";
import { DISTRICTS, STATE, acsOf, wardsOf } from "@/data/seeds/locations";

/** State → District → AC → Ward. Each level resets everything below it. */
export function LocationPicker({ value, onChange }: { value: { districtId: string; acId: string; wardId: string }; onChange: (v: { districtId: string; acId: string; wardId: string }) => void }) {
  return (
    <div className="space-y-4">
      <Field label="State">{(p) => <Select {...p} value={STATE.id} disabled><option value={STATE.id}>{STATE.name}</option></Select>}</Field>
      <Field label="District">{(p) => <Select {...p} value={value.districtId} onChange={(e) => onChange({ districtId: e.target.value, acId: "", wardId: "" })}><option value="">Choose a district</option>{DISTRICTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>}</Field>
      <Field label="Assembly constituency (AC)" hint={!value.districtId ? "Choose a district first." : undefined}>{(p) => <Select {...p} value={value.acId} disabled={!value.districtId} onChange={(e) => onChange({ ...value, acId: e.target.value, wardId: "" })}><option value="">Choose an AC</option>{acsOf(value.districtId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>
      <Field label="Ward" hint={!value.acId ? "Choose an AC first." : undefined}>{(p) => <Select {...p} value={value.wardId} disabled={!value.acId} onChange={(e) => onChange({ ...value, wardId: e.target.value })}><option value="">Choose a ward</option>{wardsOf(value.acId).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>}</Field>
    </div>
  );
}

