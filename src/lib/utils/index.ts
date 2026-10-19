import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "Asia/Kolkata";
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

export const fmtDate = (ts: number) => dateFmt.format(ts);
export const fmtDay = (ts: number) => dayFmt.format(ts);
export const fmtTime = (ts: number) => timeFmt.format(ts);
export const fmtDateTime = (ts: number) => `${fmtDay(ts)}, ${fmtTime(ts)}`;
export const fmtMonthDay = (ts: number) => {
  const p = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: TZ }).formatToParts(ts);
  return { day: p.find((x) => x.type === "day")?.value ?? "", month: p.find((x) => x.type === "month")?.value ?? "" };
};

/** Relative time against the *demo* clock, never the real one. */
export function fmtRelative(ts: number, now: number) {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const hr = Math.round(abs / 3_600_000);
  const day = Math.round(abs / 86_400_000);
  const body = abs < 60_000 ? "moments" : min < 60 ? `${min} min` : hr < 24 ? `${hr} hr` : `${day} day${day === 1 ? "" : "s"}`;
  if (abs < 60_000) return "just now";
  return diff < 0 ? `${body} ago` : `in ${body}`;
}

export function fmtDuration(ms: number) {
  const neg = ms < 0;
  const total = Math.abs(Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const s = h ? `${h}h ${m}m` : `${m}m`;
  return neg ? `${s} overdue` : s;
}

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export const pluralise = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
