import { GrowArea, CanvasObject } from '@/lib/api';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function checkGrowAreaIntersection(
  growArea: GrowArea,
  selectionRect: Rectangle
): boolean {
  if (growArea.positionX === undefined || growArea.positionY === undefined) {
    return false;
  }

  const areaRight = growArea.positionX + (growArea.width || 100);
  const areaBottom = growArea.positionY + (growArea.length || 100);
  const selRight = selectionRect.x + selectionRect.width;
  const selBottom = selectionRect.y + selectionRect.height;

  return (
    growArea.positionX <= selRight &&
    areaRight >= selectionRect.x &&
    growArea.positionY <= selBottom &&
    areaBottom >= selectionRect.y
  );
}

export function checkCanvasObjectIntersection(
  obj: CanvasObject,
  selectionRect: Rectangle
): boolean {
  const objRight = obj.x + (obj.width || 0);
  const objBottom = obj.y + (obj.height || 0);
  const selRight = selectionRect.x + selectionRect.width;
  const selBottom = selectionRect.y + selectionRect.height;

  return (
    obj.x <= selRight &&
    objRight >= selectionRect.x &&
    obj.y <= selBottom &&
    objBottom >= selectionRect.y
  );
}

export function getSelectedItems(
  growAreas: GrowArea[],
  canvasObjects: CanvasObject[],
  selectionRect: Rectangle
) {
  const selectedGrowAreaIds = new Set<string>();
  const selectedObjectIds = new Set<number>();

  growAreas.forEach((area) => {
    if (checkGrowAreaIntersection(area, selectionRect)) {
      selectedGrowAreaIds.add(area.id);
    }
  });

  canvasObjects.forEach((obj) => {
    if (checkCanvasObjectIntersection(obj, selectionRect)) {
      selectedObjectIds.add(obj.id);
    }
  });

  return { selectedGrowAreaIds, selectedObjectIds };
}
import { useEffect, useRef, useState } from 'react';

interface CanvasState {
  position: { x: number; y: number };
  scale: number;
  grid: boolean;
}

export function useCanvasPersistence(gardenId: string) {
  const hasLoadedSavedState = useRef(false);
  const isInitialMount = useRef(true);
  const initialGardenId = useRef(gardenId);

  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [showGrid, setShowGrid] = useState(true);

  // Load saved canvas state from localStorage on mount ONLY
  useEffect(() => {
    if (hasLoadedSavedState.current) return;

    const key = `garden-board-state-${initialGardenId.current}`;
    const savedState = localStorage.getItem(key);
    if (savedState) {
      try {
        const { position, zoom, scale: savedScale, grid } = JSON.parse(savedState);
        if (position) {
          setStagePosition(position);
        }
        // Support both old 'zoom' and new 'scale' format
        if (savedScale !== undefined) {
          setScale(savedScale);
        } else if (zoom !== undefined) {
          setScale(zoom / 100);
        }
        if (grid !== undefined) setShowGrid(grid);
      } catch (error) {
        console.error('Failed to parse saved board state:', error);
      }
    }
    hasLoadedSavedState.current = true;

    setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset state when garden changes
  useEffect(() => {
    if (initialGardenId.current !== gardenId) {
      initialGardenId.current = gardenId;
      hasLoadedSavedState.current = false;
      isInitialMount.current = true;

      const savedState = localStorage.getItem(`garden-board-state-${gardenId}`);
      if (savedState) {
        try {
          const { position, zoom, scale: savedScale, grid } = JSON.parse(savedState);
          if (position) setStagePosition(position);
          if (savedScale !== undefined) {
            setScale(savedScale);
          } else if (zoom !== undefined) {
            setScale(zoom / 100);
          }
          if (grid !== undefined) setShowGrid(grid);
        } catch (error) {
          console.error('Failed to parse saved board state:', error);
        }
      } else {
        setStagePosition({ x: 0, y: 0 });
        setScale(1);
        setShowGrid(true);
      }

      hasLoadedSavedState.current = true;
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    }
  }, [gardenId]);

  // Save canvas state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMount.current || !hasLoadedSavedState.current) {
      return;
    }

    const state: CanvasState = {
      position: stagePosition,
      scale: scale,
      grid: showGrid,
    };
    localStorage.setItem(`garden-board-state-${gardenId}`, JSON.stringify(state));
  }, [stagePosition, scale, showGrid, gardenId]);

  return {
    stagePosition,
    setStagePosition,
    scale,
    setScale,
    showGrid,
    setShowGrid,
  };
}

