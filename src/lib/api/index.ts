import * as fan from "./fan";
import * as admin from "./admin";
import { resetDB, getDB, personName, fanById, adminById, now } from "./db";
import { write } from "./client";

export { fan, admin };
export const demo = {
  reset: () => write(() => { resetDB(); return true; }),
  now: () => now(),
};
export { personName, fanById, adminById, getDB };
export { ApiError } from "./client";
