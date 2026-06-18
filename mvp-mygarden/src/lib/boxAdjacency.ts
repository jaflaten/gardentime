import type { Box } from "../types";

/**
 * How close (in grid units) two boxes' footprints must be to count as neighbours. Touching boxes
 * have a gap of 0; one empty cell between them is 1. The demo/standard gardens space rows ~2 units
 * apart, so 2 captures both side-by-side and stacked neighbours — boxes that "share airspace"
 * (pests, pollinators, shade) even though their soil doesn't mix. Tunable; a future cm-footprint
 * model (Box.widthCm/lengthCm) could refine "near" into a real-distance threshold.
 */
export const NEIGHBOUR_GAP_UNITS = 2;

/** Axis gaps between two box footprints in grid units: 0 if they overlap/touch on that axis. */
function rectGaps(a: Box["layout"], b: Box["layout"]): { dx: number; dy: number } {
  const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
  const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
  return { dx, dy };
}

/**
 * Boxes within {@link NEIGHBOUR_GAP_UNITS} of `box` on both axes (excluding `box` itself).
 * Used by the proximity-companion hint — companionship matters one bed over, not just in-soil.
 */
export function neighbouringBoxes(box: Box, boxes: Box[], gap: number = NEIGHBOUR_GAP_UNITS): Box[] {
  return boxes.filter((other) => {
    if (other.id === box.id) {
      return false;
    }
    const { dx, dy } = rectGaps(box.layout, other.layout);
    return dx <= gap && dy <= gap;
  });
}

/**
 * Active plant keys growing in boxes neighbouring `box`, excluding any key already present in `box`
 * itself (same-box companionship is the stronger, separately-rendered signal). De-duped.
 */
export function nearbyActivePlantKeys(
  box: Box,
  boxes: Box[],
  plantings: { boxId: string; plantKey: string; status: string }[],
  sameBoxKeys: string[],
): string[] {
  const neighbourIds = new Set(neighbouringBoxes(box, boxes).map((b) => b.id));
  const exclude = new Set(sameBoxKeys);
  const keys = new Set<string>();
  for (const planting of plantings) {
    if (planting.status !== "active" || !planting.plantKey) {
      continue;
    }
    if (neighbourIds.has(planting.boxId) && !exclude.has(planting.plantKey)) {
      keys.add(planting.plantKey);
    }
  }
  return [...keys];
}
