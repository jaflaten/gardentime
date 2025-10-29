interface GridLinesProps {
  dimensions: { width: number; height: number };
  scale: number;
  stagePosition: { x: number; y: number };
}

interface GridLine {
  key: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export const GRID_SIZE = 50; // 50cm intervals

export function generateGridLines({ dimensions, scale, stagePosition }: GridLinesProps): GridLine[] {
  const lines: GridLine[] = [];
  const scaledGridSize = GRID_SIZE * scale;

  // Calculate visible area accounting for stage position
  const startX = Math.floor(-stagePosition.x / scaledGridSize) * scaledGridSize;
  const startY = Math.floor(-stagePosition.y / scaledGridSize) * scaledGridSize;
  const endX = startX + dimensions.width / scale + scaledGridSize;
  const endY = startY + dimensions.height / scale + scaledGridSize;

  // Vertical lines
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    lines.push({
      key: `v-${x}`,
      points: [x, startY, x, endY],
      stroke: '#e5e7eb',
      strokeWidth: 1 / scale,
    });
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    lines.push({
      key: `h-${y}`,
      points: [startX, y, endX, y],
      stroke: '#e5e7eb',
      strokeWidth: 1 / scale,
    });
  }

  return lines;
}

/**
 * Snap a coordinate to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a position object to grid
 */
export function snapPositionToGrid(
  position: { x: number; y: number },
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  };
}
