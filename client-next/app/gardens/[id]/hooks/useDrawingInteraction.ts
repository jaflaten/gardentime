import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import { CanvasObject, canvasObjectService } from '@/lib/api';
import { DrawingTool } from '../components/DrawingToolbar';

interface UseDrawingInteractionProps {
  gardenId: string;
  activeTool: DrawingTool;
  scale: number;
  stagePosition: { x: number; y: number };
  onObjectCreated: (obj: CanvasObject) => void;
}

export function useDrawingInteraction({
  gardenId,
  activeTool,
  scale,
  stagePosition,
  onObjectCreated,
}: UseDrawingInteractionProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<CanvasObject | null>(null);
  const shiftKeyPressed = useRef(false);

  const convertToCanvasCoords = useCallback((screenPos: { x: number; y: number }) => {
    return {
      x: (screenPos.x - stagePosition.x) / scale,
      y: (screenPos.y - stagePosition.y) / scale,
    };
  }, [scale, stagePosition]);

  // Helper function to constrain line angle to 0°, 45°, 90°, 135°, 180°, etc.
  const constrainLineAngle = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Snap to nearest 45° increment
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    
    return {
      x: start.x + Math.cos(snapAngle) * distance,
      y: start.y + Math.sin(snapAngle) * distance,
    };
  }, []);

  const saveCanvasObject = useCallback(async (obj: CanvasObject) => {
    try {
      const saved = await canvasObjectService.create({
        gardenId: obj.gardenId,
        type: obj.type,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        points: obj.points,
        fillColor: obj.fillColor,
        strokeColor: obj.strokeColor,
        strokeWidth: obj.strokeWidth,
        opacity: obj.opacity,
        text: obj.text,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
      });
      onObjectCreated(saved);
    } catch (error) {
      console.error('Failed to save canvas object:', error);
      alert('Failed to save drawing. Please try again.');
    }
  }, [onObjectCreated]);

  const handleMouseDown = useCallback((stage: Konva.Stage | null, clickedOnEmpty: boolean) => {
    if (!stage || !clickedOnEmpty || activeTool === 'SELECT' || activeTool === 'PAN') {
      return false;
    }

    const pos = stage.getPointerPosition();
    if (!pos) return false;

    const canvasPos = convertToCanvasCoords(pos);
    setIsDrawing(true);
    setDrawingStart(canvasPos);

    // Capture shift key state at start of drawing
    shiftKeyPressed.current = stage.getStage()?.getPointerPosition() ? 
      (window.event as KeyboardEvent)?.shiftKey || false : false;

    const baseId = Date.now();

    // Handle text tool immediately
    if (activeTool === 'TEXT') {
      const textPrompt = prompt('Enter text:', 'Double-click to edit');
      if (textPrompt !== null) { // Allow empty string
        const newTextObject: CanvasObject = {
          id: baseId,
          gardenId,
          type: 'TEXT',
          x: canvasPos.x,
          y: canvasPos.y,
          width: 200,
          height: 40,
          text: textPrompt || 'Double-click to edit',
          fontSize: 16,
          fontFamily: 'Arial',
          strokeColor: '#000000',
          fillColor: 'transparent',
          opacity: 1,
        };
        saveCanvasObject(newTextObject);
      }
      setIsDrawing(false);
      setDrawingStart(null);
      return true;
    }

    // Initialize drawing based on tool type
    if (activeTool === 'FREEHAND') {
      setCurrentDrawing({
        id: baseId,
        gardenId,
        type: 'FREEHAND',
        x: canvasPos.x,
        y: canvasPos.y,
        points: JSON.stringify([canvasPos.x, canvasPos.y]),
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
      });
    } else if (activeTool === 'RECTANGLE') {
      setCurrentDrawing({
        id: baseId,
        gardenId,
        type: 'RECTANGLE',
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
        fillColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 0.7,
      });
    } else if (activeTool === 'CIRCLE') {
      setCurrentDrawing({
        id: baseId,
        gardenId,
        type: 'CIRCLE',
        x: canvasPos.x,
        y: canvasPos.y,
        width: 0,
        height: 0,
        fillColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 0.7,
      });
    } else if (activeTool === 'LINE' || activeTool === 'ARROW') {
      setCurrentDrawing({
        id: baseId,
        gardenId,
        type: activeTool,
        x: 0,
        y: 0,
        points: JSON.stringify([canvasPos.x, canvasPos.y, canvasPos.x, canvasPos.y]),
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
      });
    }

    return true;
  }, [activeTool, gardenId, convertToCanvasCoords, saveCanvasObject]);

  const handleMouseMove = useCallback((stage: Konva.Stage | null) => {
    if (!stage || !isDrawing || !drawingStart || !currentDrawing) {
      return;
    }

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const canvasPos = convertToCanvasCoords(pos);
    
    // Update shift key state during drawing
    const isShiftPressed = (window.event as any)?.shiftKey || false;

    if (activeTool === 'RECTANGLE') {
      let width = canvasPos.x - drawingStart.x;
      let height = canvasPos.y - drawingStart.y;

      // If shift is pressed, make it a perfect square
      if (isShiftPressed) {
        const maxDimension = Math.max(Math.abs(width), Math.abs(height));
        width = width >= 0 ? maxDimension : -maxDimension;
        height = height >= 0 ? maxDimension : -maxDimension;
      }

      setCurrentDrawing((prev) => ({
        ...(prev || {}),
        x: width > 0 ? drawingStart.x : drawingStart.x + width,
        y: height > 0 ? drawingStart.y : drawingStart.y + height,
        width: Math.abs(width),
        height: Math.abs(height),
      } as CanvasObject));
    } else if (activeTool === 'CIRCLE') {
      const width = Math.abs(canvasPos.x - drawingStart.x);
      const height = Math.abs(canvasPos.y - drawingStart.y);
      
      // Always draw perfect circles (uniform diameter)
      // If shift is pressed, it's already a circle, so no change needed
      const diameter = isShiftPressed 
        ? Math.max(width, height)  // Perfect circle from corner
        : Math.max(width, height);  // Always perfect circle

      setCurrentDrawing((prev) => ({
        ...(prev || {}),
        x: drawingStart.x,
        y: drawingStart.y,
        width: diameter,
        height: diameter,
      } as CanvasObject));
    } else if (activeTool === 'LINE' || activeTool === 'ARROW') {
      let endPoint = canvasPos;
      
      // If shift is pressed, constrain to 45° angles
      if (isShiftPressed) {
        endPoint = constrainLineAngle(drawingStart, canvasPos);
      }
      
      setCurrentDrawing((prev) => ({
        ...(prev || {}),
        points: JSON.stringify([drawingStart.x, drawingStart.y, endPoint.x, endPoint.y]),
      } as CanvasObject));
    } else if (activeTool === 'FREEHAND') {
      const existingPoints = JSON.parse(currentDrawing.points || '[]') as number[];
      const newPoints = [...existingPoints, canvasPos.x, canvasPos.y];
      setCurrentDrawing((prev) => ({ ...(prev || {}), points: JSON.stringify(newPoints) } as CanvasObject));
    }
  }, [isDrawing, drawingStart, currentDrawing, activeTool, convertToCanvasCoords, constrainLineAngle]);

  const handleMouseUp = useCallback(async () => {
    if (!isDrawing) {
      setDrawingStart(null);
      setCurrentDrawing(null);
      return;
    }

    // Validate minimum size for shapes
    if (currentDrawing && (currentDrawing.type === 'RECTANGLE' || currentDrawing.type === 'CIRCLE')) {
      const minSize = 5;
      if ((currentDrawing.width || 0) < minSize && (currentDrawing.height || 0) < minSize) {
        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
        return;
      }
    }

    // Validate freehand has enough points
    if (currentDrawing && currentDrawing.type === 'FREEHAND') {
      const pts = JSON.parse(currentDrawing.points || '[]') as number[];
      if (pts.length < 4) {
        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
        return;
      }
    }

    setIsDrawing(false);
    setDrawingStart(null);

    if (currentDrawing) {
      await saveCanvasObject(currentDrawing);
    }

    setCurrentDrawing(null);
  }, [isDrawing, currentDrawing, saveCanvasObject]);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawingStart(null);
    setCurrentDrawing(null);
  }, []);

  return {
    isDrawing,
    currentDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    cancelDrawing,
  };
}

