import type { BedType, SunExposure, SunNeed } from "../lib/boxMeta";
import type { PlantFamily } from "../lib/families";

export interface Box {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  zoneType?: "BOX" | "BUCKET" | string;
  sunExposure?: SunExposure;
  bedType?: BedType;
  /** Soil depth in cm. Drives the depth-fit check in box ranking; missing = unknown/unlimited (e.g. in-ground). */
  depthCm?: number;
  /** Real-world footprint in cm (independent of the abstract grid `layout` units). Both optional; shown as a chip. */
  widthCm?: number;
  lengthCm?: number;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Planting {
  id: string;
  /**
   * The box this planting lives in. **Optional** — a planting with no `boxId` is an *indoor seedling*
   * (forkultivering, Increment K): started on a windowsill before it has a home in the garden. The
   * "Plant ut" action fills `boxId` in and stamps `transplantedDate`, at which point the same row
   * becomes an ordinary box planting (its original indoor `plantedDate` is preserved for days-to-harvest).
   * Use `isIndoorSeedling()` rather than testing this directly. Every per-box filter (`boxId === box.id`)
   * already excludes seedlings; only *global* active-planting scans need to guard on it.
   */
  boxId?: string;
  plantKey: string;
  customName?: string;
  variety?: string;
  /** How many individual plants this row represents (e.g. 6 tomato plants in one row). Optional; missing = unspecified (counted as 1 in box totals). */
  quantity?: number;
  /** Sow/plant date. For an indoor seedling this is the *indoor* sow date — preserved through "Plant ut". */
  plantedDate: string;
  /** When an indoor seedling was planted out into its box (Increment K). Absent on direct-sown plantings; doubles as "was started indoors" provenance. */
  transplantedDate?: string;
  /**
   * How this planting started (Increment L). `"transplant"` = forkultivert/planted out as an
   * established seedling; `"direct"` = seeds sown straight into the bed on `plantedDate`. **Optional —
   * absent means "use the crop's default"** (its `gddToMaturity` calibration baseline), so existing
   * data and the common case are unchanged. Only stored when the user *deviates* from that default.
   * Drives the bounded GDD establishment credit; resolve via `resolveSowMethod()`, never read directly.
   */
  startMethod?: "direct" | "transplant";
  harvestDate?: string;
  /** Free-text yield logged at harvest (Phase F), e.g. "5 kg", "3 bøtter", "1 sekk". Optional. */
  harvestYield?: string;
  notes?: string;
  status: "active" | "harvested" | "removed" | "failed";
  year: number;
}

export type SowRule =
  | { type: "indoor"; weeksBeforeLastFrost: [number, number] }
  | { type: "outdoor"; weeksAfterLastFrost: [number, number]; minSoilTempC?: number }
  | { type: "transplant"; weeksAfterLastFrost: [number, number] };

export type HarvestRule =
  | { weeksFromSowing: [number, number] }
  | { weeksBeforeFirstFrost: number }
  // Absolute calendar harvest window that repeats every year, e.g. ["06-15", "07-31"] for
  // strawberries (mid-June→July). Used for perennials whose harvest is seasonal, not sow-relative.
  | { seasonal: [string, string] };

export interface PlantInfo {
  key: string;
  name_no: string;
  name_pl: string;
  name_en: string;
  emoji: string;
  /** A natural display colour for the plant (e.g. strawberry red, carrot orange). Used to tint the
   *  composition donut's species slices; missing = fall back to the generic chart palette. */
  color?: string;
  category: "vegetable" | "herb" | "fruit" | "flower";
  family: PlantFamily;
  sowRules?: SowRule[];
  harvestRule?: HarvestRule;
  // Box-ranking metadata (Increment B). All optional; missing = no constraint / no penalty.
  /** Minimum sunlight the plant needs. `full` plants are discouraged in shaded boxes. */
  sunNeed?: SunNeed;
  /** Bed types the plant does best in (e.g. heat-lovers prefer greenhouse/tunnel). A box outside this list is a soft mismatch. */
  prefersBedType?: BedType[];
  /** Minimum soil depth in cm the plant needs (root veg). A shallower box is discouraged. */
  minDepthCm?: number;
  // Growing-degree-day harvest model (Increment I, Layer 0). All optional; missing = fall back to
  // the `weeksFromSowing` harvest rule, so untagged/custom plants are unaffected.
  /**
   * Accumulated growing-degree-days from the plant's anchor to first harvest. The anchor is the
   * *outdoor* start: the transplant date for plants with a `transplant` sow rule, otherwise the
   * sow date. With a station GDD curve this yields a location-aware first-harvest date that
   * supersedes `weeksFromSowing` (a cold garden ripens later from the *same* number).
   */
  gddToMaturity?: number;
  /** Base temperature for `gddToMaturity`: 5 for cool crops, 10 for warm (heat-loving) crops. Default 5. */
  gddBase?: 5 | 10;
  /**
   * Bounded seed→transplant-ready establishment phase, in GDD **of this plant's own `gddBase`**
   * (Increment L). The developmental head-start a pre-cultivated seedling has at plant-out — NOT the
   * literal weeks spent indoors (a carton seedling is light/root-limited; the edible part bulks in the
   * field). Used *only* when a planting's sow method deviates from the crop's default: credited
   * (−) when forkultivating a natural-direct crop, added (+) when direct-sowing a natural-transplant
   * crop. Clamped to ≤40 % of `gddToMaturity` in `effectiveGddToMaturity()` so fast crops can't
   * collapse to "harvest on plant-out". Missing ⇒ a ~30 % fallback (still clamped).
   */
  gddEstablishment?: number;
  // Companion planting (Increment F). Lists hold OTHER plant keys; missing = no known pairing.
  /** Plants this one grows well beside — surfaced as a green hint when added near them. */
  companionsGood?: string[];
  /** Plants this one does poorly beside — surfaced as a soft amber caution. */
  companionsBad?: string[];
  /** Succession interval in weeks (Increment E): re-sow every N weeks for a continuous harvest (salat, reddik). */
  successionWeeks?: number;
  /**
   * How many weeks the crop is *picked over* once it starts cropping (continuous croppers — beans,
   * tomatoes, courgette, salat). Only meaningful with a `weeksFromSowing` harvest rule: the season
   * timeline extends the harvest band by this many weeks past first-harvest, so a long-cropping plant
   * draws a longer bar than a one-shot root. Missing = treated as a single short pick (no extension).
   */
  harvestDurationWeeks?: number;
  /**
   * Perennial — stays in the bed across seasons and re-fruits each year (jordbær, rabarbra, urter).
   * Its harvest window should be a `{ seasonal }` rule (absolute, repeats yearly) rather than sow-relative,
   * and the season timeline draws that band every year regardless of which year it was planted.
   */
  perennial?: boolean;
  /**
   * Rain-sensitive (Increment B follow-up) — foliage dislikes rain (fungal disease, fruit splitting),
   * so the plant really wants a cover (greenhouse/tunnel), not just prefers it. Surfaces a note in the
   * D2 card's "Plant ut" group and turns an uncovered-bed placement into a soft caution in box ranking.
   */
  rainSensitive?: boolean;
}
