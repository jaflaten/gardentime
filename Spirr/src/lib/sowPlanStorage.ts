// Persistence for Såplan (§2.1): the gt_sowplan wishlist and the gt_reminders dismissal map.
// Mirrors customPlants.ts — a fourth independent localStorage namespace, ready for a future
// Supabase table (Phase H).

import { touchLastSaved } from "./storage";

const SOW_PLAN_KEY = "gt_sowplan";
const REMINDERS_KEY = "gt_reminders";

/** One intended crop for one season. The plan is per-year so it resets naturally each season. */
export interface SowPlanEntry {
  plantKey: string;
  year: number;
}

export const loadSowPlan = (): SowPlanEntry[] => JSON.parse(localStorage.getItem(SOW_PLAN_KEY) ?? "[]");

export function saveSowPlan(entries: SowPlanEntry[]): string {
  localStorage.setItem(SOW_PLAN_KEY, JSON.stringify(entries));
  return touchLastSaved();
}

/** reminderId → ISO timestamp of when the user dismissed/acted on that nudge. */
export type DismissedReminders = Record<string, string>;

export const loadDismissedReminders = (): DismissedReminders =>
  JSON.parse(localStorage.getItem(REMINDERS_KEY) ?? "{}");

/** Marks reminder ids as handled (dedupe — the strip won't re-nag them this season). */
export function dismissReminders(ids: string[]): DismissedReminders {
  const map = loadDismissedReminders();
  const stamp = new Date().toISOString();
  for (const id of ids) {
    map[id] = stamp;
  }
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(map));
  return map;
}
