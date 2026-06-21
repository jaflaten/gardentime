// Small shared helpers for planting fields, kept out of components so the add/edit
// surfaces (QuickAddSheet, BoxDetail, PlantingRow) all parse the same way.

import { now } from "./clock";
import type { Planting } from "../types";

/**
 * Indoor seedling (forkultivering, Increment K): a planting started before it has a box.
 * A seedling has no `boxId`; "Plant ut" assigns one. The single source of truth for the
 * distinction so global active-planting scans (timeline, succession, harvest-soon) can
 * exclude windowsill sprouts from garden views.
 */
export function isIndoorSeedling(planting: Planting): boolean {
  return !planting.boxId;
}

/** Parse an "antall planter" input into a positive integer, or undefined for blank/invalid. */
export function parseQuantity(value: string): number | undefined {
  const n = value.trim() === "" ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

/**
 * Whole days between a planting's date (YYYY-MM-DD) and `now`. Both ends are normalized to local
 * midnight so the count doesn't drift across a DST transition. Negative if the date is in the future.
 */
export function daysSince(dateStr: string, today: Date = now()): number {
  const planted = new Date(`${dateStr}T00:00:00`);
  const plantedMid = new Date(planted.getFullYear(), planted.getMonth(), planted.getDate()).getTime();
  const nowMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((nowMid - plantedMid) / 86_400_000);
}

/** Norwegian "planted N days ago" label: "i dag" / "1 dag siden" / "N dager siden". Empty for future dates. */
export function plantedAgeLabel(dateStr: string, now?: Date): string {
  const days = daysSince(dateStr, now);
  if (days < 0) {
    return "";
  }
  if (days === 0) {
    return "i dag";
  }
  return `${days} ${days === 1 ? "dag" : "dager"} siden`;
}
