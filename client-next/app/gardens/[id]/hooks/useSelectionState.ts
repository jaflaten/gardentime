import { useState, useCallback } from 'react';
import Konva from 'konva';
import { GrowArea, CanvasObject } from '@/lib/api';
import { getSelectedItems } from '../utils/selectionUtils';

export function useSelectionState(
  growAreas: GrowArea[],
  canvasObjects: CanvasObject[],
  scale: number,
  stagePosition: { x: number; y: number }
) {
  // Single selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<number>>(new Set());

  // Selection rectangle
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);

  const convertToCanvasCoords = useCallback((screenPos: { x: number; y: number }) => {
    return {
      x: (screenPos.x - stagePosition.x) / scale,
      y: (screenPos.y - stagePosition.y) / scale,
    };
  }, [scale, stagePosition]);

  const startSelectionRect = useCallback((stage: Konva.Stage | null) => {
    if (!stage) return false;

    const pos = stage.getPointerPosition();
    if (!pos) return false;

    const canvasPos = convertToCanvasCoords(pos);
    setIsSelecting(true);
    setDrawingStart(canvasPos);
    setSelectionRect({ x: canvasPos.x, y: canvasPos.y, width: 0, height: 0 });
    return true;
  }, [convertToCanvasCoords]);

  const updateSelectionRect = useCallback((stage: Konva.Stage | null) => {
    if (!stage || !isSelecting || !drawingStart) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const canvasPos = convertToCanvasCoords(pos);
    const width = canvasPos.x - drawingStart.x;
    const height = canvasPos.y - drawingStart.y;

    setSelectionRect({
      x: Math.min(drawingStart.x, canvasPos.x),
      y: Math.min(drawingStart.y, canvasPos.y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }, [isSelecting, drawingStart, convertToCanvasCoords]);

  const completeSelection = useCallback(() => {
    if (!isSelecting || !selectionRect) {
      setIsSelecting(false);
      setSelectionRect(null);
      setDrawingStart(null);
      return;
    }

    const { selectedGrowAreaIds, selectedObjectIds: selectedObjIds } = getSelectedItems(
      growAreas,
      canvasObjects,
      selectionRect
    );

    setSelectedIds(selectedGrowAreaIds);
    setSelectedObjectIds(selectedObjIds);

    // Set single selection state
    if (selectedGrowAreaIds.size > 1 || selectedObjIds.size > 1) {
      setSelectedId(null);
      setSelectedObjectId(null);
    } else if (selectedGrowAreaIds.size === 1) {
      setSelectedId(Array.from(selectedGrowAreaIds)[0]);
      setSelectedObjectId(null);
    } else if (selectedObjIds.size === 1) {
      setSelectedId(null);
      setSelectedObjectId(Array.from(selectedObjIds)[0]);
    } else {
      setSelectedId(null);
      setSelectedObjectId(null);
    }

    setIsSelecting(false);
    setSelectionRect(null);
    setDrawingStart(null);
  }, [isSelecting, selectionRect, growAreas, canvasObjects]);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedObjectId(null);
    setSelectedIds(new Set());
    setSelectedObjectIds(new Set());
    setIsSelecting(false);
    setSelectionRect(null);
    setDrawingStart(null);
  }, []);

  const selectGrowArea = useCallback((growArea: GrowArea) => {
    // If clicking on an item that's already in the multi-selection, keep the entire selection
    if (selectedIds.has(growArea.id)) {
      return;
    }

    // Otherwise, this is a new selection
    setSelectedId(growArea.id);
    setSelectedIds(new Set([growArea.id]));
    setSelectedObjectId(null);
    setSelectedObjectIds(new Set());
  }, [selectedIds]);

  const selectCanvasObject = useCallback((objectId: number) => {
    setSelectedObjectId(objectId);
    setSelectedId(null);
  }, []);

  return {
    // Single selection
    selectedId,
    setSelectedId,
    selectedObjectId,
    setSelectedObjectId,

    // Multi-selection
    selectedIds,
    selectedObjectIds,

    // Selection rectangle
    isSelecting,
    selectionRect,

    // Methods
    startSelectionRect,
    updateSelectionRect,
    completeSelection,
    clearSelection,
    selectGrowArea,
    selectCanvasObject,
  };
}
