'use client';

import { useCallback } from 'react';
import Konva from 'konva';
import { DrawingTool } from '../components/DrawingToolbar';

interface UseStageEventHandlersProps {
  activeTool: DrawingTool;
  stageRef: React.RefObject<Konva.Stage | null>;
  isDrawing: boolean;
  isSelecting: boolean;
  startSelectionRect: (stage: Konva.Stage | null) => void;
  updateSelectionRect: (stage: Konva.Stage) => void;
  completeSelection: () => void;
  handleDrawingMouseDown: (stage: Konva.Stage | null, clickedOnEmpty: boolean) => void;
  handleDrawingMouseMove: (stage: Konva.Stage) => void;
  handleDrawingMouseUp: () => Promise<void>;
  setContextMenu: (menu: { x: number; y: number; objectId: number } | null) => void;
}

export function useStageEventHandlers({
  activeTool,
  stageRef,
  isDrawing,
  isSelecting,
  startSelectionRect,
  updateSelectionRect,
  completeSelection,
  handleDrawingMouseDown,
  handleDrawingMouseMove,
  handleDrawingMouseUp,
  setContextMenu,
}: UseStageEventHandlersProps) {

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();

    // Close context menu on any click
    setContextMenu(null);

    // Handle selection rectangle in SELECT mode
    if (activeTool === 'SELECT' && clickedOnEmpty) {
      startSelectionRect(stageRef.current);
      return;
    }

    // Handle drawing
    if (clickedOnEmpty) {
      handleDrawingMouseDown(stageRef.current, clickedOnEmpty);
    }
  }, [activeTool, stageRef, startSelectionRect, handleDrawingMouseDown, setContextMenu]);

  const handleStageMouseMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Handle selection rectangle in SELECT mode
    if (activeTool === 'SELECT' && isSelecting) {
      updateSelectionRect(stage);
      return;
    }

    // Handle drawing
    if (isDrawing) {
      handleDrawingMouseMove(stage);
    }
  }, [activeTool, stageRef, isSelecting, isDrawing, updateSelectionRect, handleDrawingMouseMove]);

  const handleStageMouseUp = useCallback(async () => {
    // Handle selection rectangle completion
    if (isSelecting) {
      completeSelection();
      return;
    }

    // Handle drawing completion
    if (isDrawing) {
      await handleDrawingMouseUp();
    }
  }, [isSelecting, isDrawing, completeSelection, handleDrawingMouseUp]);

  return {
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  };
}
