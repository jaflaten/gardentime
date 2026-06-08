import { nanoid } from "nanoid";
import type { Box } from "../types";

interface DinoGrowArea {
  name: string;
  zoneType: "BOX" | "BUCKET" | string;
  positionX: number;
  positionY: number;
  width: number;
  length: number;
  rotation: number;
  notes: string | null;
}

interface DinoExport {
  exportVersion: string;
  garden: { name: string; description: string | null };
  growAreas: DinoGrowArea[];
}

const CANVAS_MIN_X = -263;
const CANVAS_MIN_Y = 80;
const GRID_UNIT_PX = 60;
export const LEGACY_GRID_COLS = 39;

function getVisualDimensions(width: number, length: number, rotationDeg: number): { visW: number; visH: number } {
  if (rotationDeg === 90) {
    return { visW: length, visH: width };
  }
  if (rotationDeg === 0) {
    return { visW: width, visH: length };
  }
  const r = (rotationDeg * Math.PI) / 180;
  return {
    visW: Math.abs(width * Math.cos(r)) + Math.abs(length * Math.sin(r)),
    visH: Math.abs(width * Math.sin(r)) + Math.abs(length * Math.cos(r)),
  };
}

function toGrid(canvasPx: number, canvasOrigin: number): number {
  return Math.round((canvasPx - canvasOrigin) / GRID_UNIT_PX);
}

export function importLegacyExport(jsonString: string): Box[] {
  const data: DinoExport = JSON.parse(jsonString);

  if (!data.exportVersion?.startsWith("1.") || !Array.isArray(data.growAreas)) {
    throw new Error("Invalid DinoGarden export");
  }

  return data.growAreas.map((area): Box => {
    const { visW, visH } = getVisualDimensions(area.width, area.length, area.rotation);

    return {
      id: nanoid(),
      name: area.name,
      description: area.notes ?? undefined,
      createdAt: new Date().toISOString(),
      zoneType: area.zoneType,
      layout: {
        x: toGrid(area.positionX, CANVAS_MIN_X),
        y: toGrid(area.positionY, CANVAS_MIN_Y),
        w: Math.max(1, Math.round(visW / GRID_UNIT_PX)),
        h: Math.max(1, Math.round(visH / GRID_UNIT_PX)),
      },
    };
  });
}
