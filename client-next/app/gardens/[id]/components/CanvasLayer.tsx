'use client';

import React from 'react';
import { Layer, Rect, Line } from 'react-konva';
import { GrowArea, CanvasObject } from '@/lib/api';
import GrowAreaBox from './GrowAreaBox';
import CanvasShape from './CanvasShape';
import SelectionRectangle from './SelectionRectangle';
import { snapPositionToGrid, GRID_SIZE } from '../utils/gridUtils';

interface GridLine {
  key: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasLayerProps {
  // Grid
  showGrid: boolean;
  gridLines: GridLine[];
  // Grow areas
  growAreas: GrowArea[];
  selectedId: string | null;
  selectedIds: Set<string>;
  activeTool: string;
  onGrowAreaDragStart: (id: string) => void;
  onGrowAreaDragEnd: (id: string, x: number, y: number) => void;
  onGrowAreaResize: (id: string, width: number, height: number) => void;
  onGrowAreaRotate: (id: string, rotation: number) => void;
  onGrowAreaSelect: (id: string) => void;
  onGrowAreaDoubleClick: (id: string) => void;
  // Canvas objects
  canvasObjects: CanvasObject[];
  selectedObjectId: number | null;
  snapToGrid: boolean;
  onObjectSelect: (id: number) => void;
  onObjectDragStart: (obj: CanvasObject) => void;
  onObjectDragEnd: (obj: CanvasObject, x: number, y: number) => void;
  onObjectResize: (obj: CanvasObject, x: number, y: number, width: number, height: number) => void;
  onObjectUpdatePoints: (obj: CanvasObject, points: number[]) => void;
  onObjectContextMenu: (e: any, objectId: number) => void;
  onObjectTextEdit: (obj: CanvasObject, text: string) => void;
  // Drawing preview
  currentDrawing: CanvasObject | null;
  // Selection rectangle
  selectionRect: SelectionRect | null;
}

export default function CanvasLayer({
  showGrid,
  gridLines,
  growAreas,
  selectedId,
  selectedIds,
  activeTool,
  onGrowAreaDragStart,
  onGrowAreaDragEnd,
  onGrowAreaResize,
  onGrowAreaRotate,
  onGrowAreaSelect,
  onGrowAreaDoubleClick,
  canvasObjects,
  selectedObjectId,
  snapToGrid,
  onObjectSelect,
  onObjectDragStart,
  onObjectDragEnd,
  onObjectResize,
  onObjectUpdatePoints,
  onObjectContextMenu,
  onObjectTextEdit,
  currentDrawing,
  selectionRect,
}: CanvasLayerProps) {
  return (
    <Layer>
      {/* Background */}
      <Rect
        x={-10000}
        y={-10000}
        width={20000}
        height={20000}
        fill="#ffffff"
        listening={false}
      />

      {/* Grid */}
      {showGrid &&
        gridLines.map((line) => (
          <Line
            key={line.key}
            points={line.points}
            stroke={line.stroke}
            strokeWidth={line.strokeWidth}
            listening={false}
          />
        ))}

      {/* Grow Areas */}
      {growAreas.map((growArea) => {
        if (growArea.positionX === undefined || growArea.positionY === undefined) {
          return null;
        }

        const isPartOfMultiSelect = selectedIds.has(growArea.id);
        const showAsMultiSelected = isPartOfMultiSelect && selectedIds.size > 1;

        return (
          <GrowAreaBox
            key={growArea.id}
            growArea={growArea}
            isSelected={selectedId === growArea.id && selectedIds.size <= 1}
            isMultiSelected={showAsMultiSelected}
            isDraggingEnabled={activeTool === 'SELECT'}
            onDragStart={onGrowAreaDragStart}
            onDragEnd={onGrowAreaDragEnd}
            onResize={onGrowAreaResize}
            onRotate={onGrowAreaRotate}
            onSelect={onGrowAreaSelect}
            onDoubleClick={onGrowAreaDoubleClick}
          />
        );
      })}

      {/* Canvas Objects - sorted by zIndex */}
      {[...canvasObjects]
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((obj) => (
          <CanvasShape
            key={obj.id}
            canvasObject={obj}
            isSelected={selectedObjectId === obj.id}
            isDraggingEnabled={activeTool === 'SELECT'}
            onSelect={() => onObjectSelect(obj.id)}
            onDragStart={() => onObjectDragStart(obj)}
            onDragEnd={(x, y) => {
              const finalPos = snapToGrid ? snapPositionToGrid({ x, y }, GRID_SIZE) : { x, y };
              onObjectDragEnd(obj, finalPos.x, finalPos.y);
            }}
            onResize={(x, y, width, height) => {
              const finalPos = snapToGrid ? snapPositionToGrid({ x, y }, GRID_SIZE) : { x, y };
              onObjectResize(obj, finalPos.x, finalPos.y, width, height);
            }}
            onUpdatePoints={(points) => onObjectUpdatePoints(obj, points)}
            onContextMenu={(e) => onObjectContextMenu(e, obj.id)}
            onTextEdit={(text) => onObjectTextEdit(obj, text)}
          />
        ))}

      {/* Drawing Preview */}
      {currentDrawing && (
        <CanvasShape
          canvasObject={currentDrawing}
          isSelected={false}
          isDraggingEnabled={false}
          onSelect={() => {}}
          onDragEnd={() => {}}
          onResize={() => {}}
        />
      )}

      {/* Selection Rectangle */}
      {selectionRect && <SelectionRectangle rect={selectionRect} />}
    </Layer>
  );
}
