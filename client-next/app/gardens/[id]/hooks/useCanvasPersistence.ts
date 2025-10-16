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

