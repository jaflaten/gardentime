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

export function generateGridLines({ dimensions, scale, stagePosition }: GridLinesProps): GridLine[] {
  const lines: GridLine[] = [];
  const gridSize = 50; // 50cm intervals at 100% zoom
  const scaledGridSize = gridSize * scale;

  // Calculate visible area accounting for stage position
  const startX = Math.floor(-stagePosition.x / scaledGridSize) * scaledGridSize;
  const startY = Math.floor(-stagePosition.y / scaledGridSize) * scaledGridSize;
  const endX = startX + dimensions.width / scale + scaledGridSize;
  const endY = startY + dimensions.height / scale + scaledGridSize;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    lines.push({
      key: `v-${x}`,
      points: [x, startY, x, endY],
      stroke: '#e5e7eb',
      strokeWidth: 1 / scale,
    });
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push({
      key: `h-${y}`,
      points: [startX, y, endX, y],
      stroke: '#e5e7eb',
      strokeWidth: 1 / scale,
    });
  }

  return lines;
}
