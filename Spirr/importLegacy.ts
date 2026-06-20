/**
 * importLegacy.ts
 * Converts a DinoGarden JSON export (exportVersion 1.x) into Spirr MVP
 * Box[] objects with pre-computed react-grid-layout positions.
 *
 * Usage:
 *   import { importLegacyExport } from "../lib/importLegacy";
 *   const boxes = importLegacyExport(jsonString);
 *   saveBoxes(boxes);
 *
 * Call once from Settings.tsx via "Importer fra DinoGarden"-button, then never again.
 */

import { nanoid } from "nanoid";
import { Box } from "../types";

// ---------------------------------------------------------------------------
// Types matching the DinoGarden export schema
// ---------------------------------------------------------------------------
interface DinoGrowArea {
  name: string;
  zoneType: "BOX" | "BUCKET" | string;
  positionX: number;
  positionY: number;
  width: number;
  length: number;
  rotation: number; // degrees: 0, 90, or 67.5 for diagonal boxes
  notes: string | null;
  cropRecords: unknown[];
}

interface DinoExport {
  exportVersion: string;
  garden: { name: string; description: string | null };
  growAreas: DinoGrowArea[];
}

// ---------------------------------------------------------------------------
// Coordinate system constants (derived from your specific garden export)
// ---------------------------------------------------------------------------

// The canvas in DinoGarden spans approximately:
//   X: -263 to 2074  (width  ≈ 2337 px)
//   Y:   80 to 1878  (height ≈ 1798 px)
const CANVAS_MIN_X = -263;
const CANVAS_MIN_Y = 80;

// We map to a 39-column react-grid-layout grid.
// Each grid unit = 60 canvas pixels — chosen so the smallest box dimension (80px)
// maps to at least 1 unit, and adjacent boxes don't collide.
const GRID_UNIT_PX = 60;

// react-grid-layout column count — must match the `cols` prop on <GridLayout>
export const LEGACY_GRID_COLS = 39;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Returns the axis-aligned visual width and height of a box after rotation.
 * DinoGarden uses three rotation values:
 *   0°   → box is width × length  (portrait)
 *   90°  → box is length × width  (landscape)
 *   67.5°→ diagonal (bounding box calculated trigonometrically)
 */
function getVisualDimensions(
  width: number,
  length: number,
  rotationDeg: number
): { visW: number; visH: number } {
  if (rotationDeg === 90) {
    return { visW: length, visH: width };
  }
  if (rotationDeg === 0) {
    return { visW: width, visH: length };
  }
  // Diagonal — use bounding box of the rotated rectangle
  const r = (rotationDeg * Math.PI) / 180;
  return {
    visW: Math.abs(width * Math.cos(r)) + Math.abs(length * Math.sin(r)),
    visH: Math.abs(width * Math.sin(r)) + Math.abs(length * Math.cos(r)),
  };
}

/**
 * Converts a canvas pixel coordinate to a grid unit index.
 * Uses Math.round so that boxes snap to the nearest grid cell.
 */
function toGrid(canvasPx: number, canvasOrigin: number): number {
  return Math.round((canvasPx - canvasOrigin) / GRID_UNIT_PX);
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export function importLegacyExport(jsonString: string): Box[] {
  const data: DinoExport = JSON.parse(jsonString);

  if (!data.growAreas || !Array.isArray(data.growAreas)) {
    throw new Error("Invalid DinoGarden export: missing growAreas array");
  }

  return data.growAreas.map((area): Box => {
    const { visW, visH } = getVisualDimensions(
      area.width,
      area.length,
      area.rotation
    );

    return {
      id: nanoid(),
      name: area.name,
      description: area.notes ?? undefined,
      createdAt: new Date().toISOString(),
      zoneType: area.zoneType,
      layout: {
        x: toGrid(area.positionX, CANVAS_MIN_X),
        y: toGrid(area.positionY, CANVAS_MIN_Y),
        // Minimum size of 1×1 for visibility; typical boxes map to 2w×1h or 1w×2h
        w: Math.max(1, Math.round(visW / GRID_UNIT_PX)),
        h: Math.max(1, Math.round(visH / GRID_UNIT_PX)),
      },
    };
  });
}
