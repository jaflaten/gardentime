import React from 'react';
import { Rect } from 'react-konva';

interface SelectionRectangleProps {
  rect: { x: number; y: number; width: number; height: number };
}

export default function SelectionRectangle({ rect }: SelectionRectangleProps) {
  return (
    <Rect
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgba(59, 130, 246, 0.5)"
      strokeWidth={2}
      listening={false}
    />
  );
}

