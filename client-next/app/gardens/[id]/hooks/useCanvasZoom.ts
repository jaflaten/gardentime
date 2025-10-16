import { useCallback } from 'react';
import Konva from 'konva';
import { GrowArea } from '@/lib/api';

interface UseCanvasZoomProps {
  scale: number;
  setScale: (scale: number) => void;
  stagePosition: { x: number; y: number };
  setStagePosition: (pos: { x: number; y: number }) => void;
  dimensions: { width: number; height: number };
  growAreas: GrowArea[];
}

export function useCanvasZoom({
  scale,
  setScale,
  stagePosition,
  setStagePosition,
  dimensions,
  growAreas,
}: UseCanvasZoomProps) {

  const handleZoomChange = useCallback((zoomPercent: number) => {
    setScale(zoomPercent / 100);
  }, [setScale]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>, stageRef: Konva.Stage | null) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    if (!stageRef) return;

    const oldScale = scale;
    const pointer = stageRef.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.02;
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Clamp scale to reasonable limits (50% to 200%)
    newScale = Math.max(0.5, Math.min(2, newScale));

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setStagePosition(newPos);
  }, [scale, stagePosition, setScale, setStagePosition]);

  const handleFitToView = useCallback(() => {
    if (growAreas.length === 0) {
      setScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    const positions = growAreas
      .filter(area => area.positionX !== undefined && area.positionY !== undefined)
      .map(area => ({
        x: area.positionX!,
        y: area.positionY!,
        width: area.width || 100,
        height: area.length || 100,
      }));

    if (positions.length === 0) {
      setScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = (dimensions.width * 0.8) / contentWidth;
    const scaleY = (dimensions.height * 0.8) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2);

    const centerX = (dimensions.width - contentWidth * newScale) / 2 - minX * newScale;
    const centerY = (dimensions.height - contentHeight * newScale) / 2 - minY * newScale;

    setScale(newScale);
    setStagePosition({ x: centerX, y: centerY });
  }, [growAreas, dimensions, setScale, setStagePosition]);

  return {
    handleZoomChange,
    handleWheel,
    handleFitToView,
    currentZoomPercent: Math.round(scale * 100),
  };
}

