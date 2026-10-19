// Deterministic demo time. 19 Oct 2026, 10:00 IST. Core flows never read the real clock.
export const BASE_TIME = Date.UTC(2026, 9, 19, 4, 30);
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
