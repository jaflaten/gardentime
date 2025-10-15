'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { GrowArea, CanvasObject, canvasObjectService } from '@/lib/api';
import Konva from 'konva';
import GrowAreaBox from './GrowAreaBox';
import DrawingToolbar, { DrawingTool } from './DrawingToolbar';
import CanvasShape from './CanvasShape';

interface GardenBoardViewProps {
  growAreas: GrowArea[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdatePositions?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onUpdateDimensions: (id: string, width: number, height: number) => void;
  onSelectGrowArea: (growArea: GrowArea) => void;
  onAddGrowArea?: () => void;
  gardenId: string;
}

export default function GardenBoardView({
  growAreas,
  onUpdatePosition,
  onUpdatePositions,
  onUpdateDimensions,
  onSelectGrowArea,
  onAddGrowArea,
  gardenId,
}: GardenBoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const draggingIdRef = useRef<string | null>(null);
  const hasLoadedSavedState = useRef(false); // Track if we've loaded saved state
  const isInitialMount = useRef(true); // Track initial mount
  const initialGardenId = useRef(gardenId); // Store the initial gardenId

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState<number>(1); // Changed from discrete zoomLevel to continuous scale
  const [showGrid, setShowGrid] = useState(true);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drawing tool state
  const [activeTool, setActiveTool] = useState<DrawingTool>('SELECT');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<CanvasObject | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Load canvas objects from backend
  useEffect(() => {
    // Don't load if gardenId is not defined yet
    if (!gardenId) return;

    const loadCanvasObjects = async () => {
      try {
        const objects = await canvasObjectService.getByGardenId(gardenId);
        console.log(`✅ Loaded ${objects.length} canvas objects from backend:`, objects);
        setCanvasObjects(objects);
      } catch (error) {
        console.error('❌ Failed to load canvas objects:', error);
      }
    };
    loadCanvasObjects();
  }, [gardenId]);

  // Load saved canvas state from localStorage on mount ONLY
  useEffect(() => {
    // Only run this once on initial mount
    if (hasLoadedSavedState.current) return;

    const savedState = localStorage.getItem(`garden-board-state-${gardenId}`);
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

    // Small delay to ensure state is set before we allow saves
    setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
  }, []); // Empty dependency array - run only once!

  // Reset state when garden changes
  useEffect(() => {
    if (initialGardenId.current !== gardenId) {
      initialGardenId.current = gardenId;
      hasLoadedSavedState.current = false;
      isInitialMount.current = true;

      // Load new garden's saved state
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
    // Don't save on the very first render before we've had a chance to load
    if (isInitialMount.current) {
      return;
    }

    // Don't save until we've loaded saved state
    if (!hasLoadedSavedState.current) {
      return;
    }

    const state = {
      position: stagePosition,
      scale: scale,
      grid: showGrid,
    };
    localStorage.setItem(`garden-board-state-${gardenId}`, JSON.stringify(state));
  }, [stagePosition, scale, showGrid, gardenId]);

  // Update canvas dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(600, window.innerHeight - 300); // Min 600px, or viewport - header/toolbar
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle zoom changes from buttons
  const handleZoomChange = (zoomPercent: number) => {
    setScale(zoomPercent / 100);
  };

  // Handle mouse wheel zoom - now with smooth continuous zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Determine zoom direction and amount
    const scaleBy = 1.02; // Smaller increment for smoother zooming
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Clamp scale to reasonable limits (50% to 200%)
    newScale = Math.max(0.5, Math.min(2, newScale));

    // Calculate new position to zoom towards pointer
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
  };

  // Fit to view - centers and scales to show all grow areas
  const handleFitToView = () => {
    if (growAreas.length === 0) {
      setScale(1);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    // Find bounds of all grow areas
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

    // Calculate zoom to fit content with padding
    const scaleX = (dimensions.width * 0.8) / contentWidth;
    const scaleY = (dimensions.height * 0.8) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2); // Max 200% zoom

    // Center the content
    const centerX = (dimensions.width - contentWidth * newScale) / 2 - minX * newScale;
    const centerY = (dimensions.height - contentHeight * newScale) / 2 - minY * newScale;

    setScale(newScale);
    setStagePosition({ x: centerX, y: centerY });
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const gridSize = 50; // 50cm intervals at 100% zoom
    const scaledGridSize = gridSize * scale;

    // Calculate visible area accounting for stage position
    const startX = Math.floor(-stagePosition.x / scaledGridSize) * scaledGridSize;
    const startY = Math.floor(-stagePosition.y / scaledGridSize) * scaledGridSize;
    const endX = startX + dimensions.width / scale + scaledGridSize;
    const endY = startY + dimensions.height / scale + scaledGridSize;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e5e7eb"
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    }

    return lines;
  };

  // Get current zoom percentage for display
  const currentZoomPercent = Math.round(scale * 100);

  // Handle mouse down on stage - start drawing
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check if we clicked on the stage background
    const clickedOnEmpty = e.target === e.target.getStage();

    // Handle selection rectangle in SELECT mode
    if (activeTool === 'SELECT' && clickedOnEmpty) {
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const x = (pos.x - stagePosition.x) / scale;
      const y = (pos.y - stagePosition.y) / scale;

      setIsSelecting(true);
      setDrawingStart({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
      return;
    }

    // Only start drawing if a drawing tool is active (not SELECT or PAN)
    if (activeTool === 'SELECT' || activeTool === 'PAN') return;

    // Prevent stage dragging when drawing
    const stage = stageRef.current;
    if (!stage) return;

    // Only handle clicks on the stage background (not on shapes)
    if (e.target !== stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
    const x = (pos.x - stagePosition.x) / scale;
    const y = (pos.y - stagePosition.y) / scale;

    setIsDrawing(true);
    setDrawingStart({ x, y });

    // For text tool, create text immediately
    if (activeTool === 'TEXT') {
      const textPrompt = prompt('Enter text:', 'Text');
      if (textPrompt) {
        const newTextObject: CanvasObject = {
          id: Date.now(), // Temporary ID until saved
          gardenId: gardenId,
          type: 'TEXT',
          x,
          y,
          width: 200,
          height: 40,
          text: textPrompt,
          fontSize: 16,
          fontFamily: 'Arial',
          strokeColor: '#000000',
          fillColor: '#ffffff',
          opacity: 1,
        };

        // Save to backend immediately
        saveCanvasObject(newTextObject);
      }
      setActiveTool('SELECT');
      setIsDrawing(false);
      setDrawingStart(null);
      return;
    }

    // For freehand, start with initial point
    if (activeTool === 'FREEHAND') {
      setCurrentDrawing({
        id: Date.now(),
        gardenId: gardenId,
        type: 'FREEHAND',
        x: 0,
        y: 0,
        points: JSON.stringify([x, y]),
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
      });
    }
  };

  // Handle mouse move on stage - update drawing preview
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const x = (pos.x - stagePosition.x) / scale;
    const y = (pos.y - stagePosition.y) / scale;

    // Handle selection rectangle in SELECT mode
    if (activeTool === 'SELECT' && isSelecting && drawingStart) {
      const width = x - drawingStart.x;
      const height = y - drawingStart.y;

      setSelectionRect({
        x: Math.min(drawingStart.x, x),
        y: Math.min(drawingStart.y, y),
        width: Math.abs(width),
        height: Math.abs(height),
      });
      return;
    }

    if (!isDrawing || !drawingStart || activeTool === 'SELECT' || activeTool === 'PAN') return;

    // Update preview based on tool type
    if (activeTool === 'RECTANGLE') {
      const width = x - drawingStart.x;
      const height = y - drawingStart.y;

      setCurrentDrawing({
        id: Date.now(),
        gardenId: gardenId,
        type: 'RECTANGLE',
        x: width > 0 ? drawingStart.x : x,
        y: height > 0 ? drawingStart.y : y,
        width: Math.abs(width),
        height: Math.abs(height),
        fillColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 0.7,
      });
    } else if (activeTool === 'CIRCLE') {
      const width = Math.abs(x - drawingStart.x);
      const height = Math.abs(y - drawingStart.y);
      const diameter = Math.max(width, height);

      setCurrentDrawing({
        id: Date.now(),
        gardenId: gardenId,
        type: 'CIRCLE',
        x: drawingStart.x,
        y: drawingStart.y,
        width: diameter,
        height: diameter,
        fillColor: 'transparent',
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 0.7,
      });
    } else if (activeTool === 'LINE' || activeTool === 'ARROW') {
      setCurrentDrawing({
        id: Date.now(),
        gardenId: gardenId,
        type: activeTool,
        x: 0,
        y: 0,
        points: JSON.stringify([drawingStart.x, drawingStart.y, x, y]),
        strokeColor: '#000000',
        strokeWidth: 2,
        opacity: 1,
      });
    } else if (activeTool === 'FREEHAND' && currentDrawing) {
      // Add new point to freehand path
      const existingPoints = JSON.parse(currentDrawing.points || '[]') as number[];
      const newPoints = [...existingPoints, x, y];

      setCurrentDrawing({
        ...currentDrawing,
        points: JSON.stringify(newPoints),
      });
    }
  };

  // Handle mouse up on stage - finalize drawing or selection
  const handleStageMouseUp = async () => {
    // Handle selection rectangle completion
    if (isSelecting && selectionRect && drawingStart) {
      const newSelectedIds = new Set<string>();
      const newSelectedObjectIds = new Set<number>();

      console.log('🔍 Selection rectangle completed:', selectionRect);
      console.log('📦 Total grow areas to check:', growAreas.length);

      // Check grow areas
      growAreas.forEach((area) => {
        if (area.positionX === undefined || area.positionY === undefined) return;

        const areaRight = area.positionX + (area.width || 100);
        const areaBottom = area.positionY + (area.length || 100);
        const selRight = selectionRect.x + selectionRect.width;
        const selBottom = selectionRect.y + selectionRect.height;

        // Check if area intersects with selection rectangle
        const intersects = area.positionX <= selRight &&
          areaRight >= selectionRect.x &&
          area.positionY <= selBottom &&
          areaBottom >= selectionRect.y;

        if (intersects) {
          console.log(`✅ Area "${area.name}" (${area.id}) selected - Position: (${area.positionX}, ${area.positionY}), Size: (${area.width}, ${area.length})`);
          newSelectedIds.add(area.id);
        } else {
          console.log(`❌ Area "${area.name}" (${area.id}) NOT selected - Position: (${area.positionX}, ${area.positionY})`);
        }
      });

      // Check canvas objects
      canvasObjects.forEach((obj) => {
        const objRight = obj.x + (obj.width || 0);
        const objBottom = obj.y + (obj.height || 0);
        const selRight = selectionRect.x + selectionRect.width;
        const selBottom = selectionRect.y + selectionRect.height;

        if (
          obj.x <= selRight &&
          objRight >= selectionRect.x &&
          obj.y <= selBottom &&
          objBottom >= selectionRect.y
        ) {
          newSelectedObjectIds.add(obj.id);
        }
      });

      console.log('🎯 Selection complete:', {
        growAreasSelected: newSelectedIds.size,
        objectsSelected: newSelectedObjectIds.size,
        growAreaIds: Array.from(newSelectedIds),
        objectIds: Array.from(newSelectedObjectIds),
      });

      setSelectedIds(newSelectedIds);
      setSelectedObjectIds(newSelectedObjectIds);

      // Clear single selection when we have multi-selection
      if (newSelectedIds.size > 1 || newSelectedObjectIds.size > 1) {
        console.log('🔄 Multi-selection detected - clearing single selection');
        setSelectedId(null);
        setSelectedObjectId(null);
      } else if (newSelectedIds.size === 1) {
        // If only one grow area selected, also set it as single selection for resize handles
        const singleId = Array.from(newSelectedIds)[0];
        console.log('🔄 Single grow area selected:', singleId);
        setSelectedId(singleId);
        setSelectedObjectId(null);
      } else if (newSelectedObjectIds.size === 1) {
        // If only one object selected, also set it as single selection
        const singleObjId = Array.from(newSelectedObjectIds)[0];
        console.log('🔄 Single object selected:', singleObjId);
        setSelectedId(null);
        setSelectedObjectId(singleObjId);
      } else {
        // Nothing selected
        console.log('🔄 Nothing selected - clearing all selections');
        setSelectedId(null);
        setSelectedObjectId(null);
      }

      setIsSelecting(false);
      setSelectionRect(null);
      setDrawingStart(null);
      return;
    }

    if (!isDrawing || !currentDrawing) {
      setIsDrawing(false);
      setDrawingStart(null);
      setIsSelecting(false);
      setSelectionRect(null);
      return;
    }

    // Don't save shapes that are too small (likely accidental clicks)
    if (activeTool === 'RECTANGLE' || activeTool === 'CIRCLE') {
      const minSize = 5; // minimum 5px
      if ((currentDrawing.width || 0) < minSize && (currentDrawing.height || 0) < minSize) {
        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
        return;
      }
    }

    setIsDrawing(false);
    setDrawingStart(null);

    // Save the completed shape to backend
    await saveCanvasObject(currentDrawing);

    setCurrentDrawing(null);
    setActiveTool('SELECT'); // Switch back to select mode
  };

  // Save canvas object to backend
  const saveCanvasObject = async (obj: CanvasObject) => {
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

      // Add to local state with real ID from backend
      setCanvasObjects((prev) => [...prev, saved]);
    } catch (error) {
      console.error('Failed to save canvas object:', error);
      alert('Failed to save drawing. Please try again.');
    }
  };

  // Delete selected canvas object
  const deleteSelectedObject = async () => {
    if (!selectedObjectId) return;

    const confirmed = confirm('Delete this shape?');
    if (!confirmed) return;

    try {
      await canvasObjectService.delete(selectedObjectId);
      setCanvasObjects((prev) => prev.filter((obj) => obj.id !== selectedObjectId));
      setSelectedObjectId(null);
    } catch (error) {
      console.error('Failed to delete canvas object:', error);
      alert('Failed to delete shape. Please try again.');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete selected object (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedObjectId) {
          deleteSelectedObject();
        }
        return;
      }

      // Escape - deselect and cancel drawing
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedObjectId(null);
        setIsDrawing(false);
        setDrawingStart(null);
        setCurrentDrawing(null);
        setActiveTool('SELECT');
        return;
      }

      // Number key shortcuts for tools (no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTool('SELECT');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTool('PAN');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTool('RECTANGLE');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTool('CIRCLE');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTool('LINE');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveTool('ARROW');
        } else if (e.key === '7') {
          e.preventDefault();
          setActiveTool('TEXT');
        } else if (e.key === '8') {
          e.preventDefault();
          setActiveTool('FREEHAND');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Drawing Toolbar - always visible */}
      <DrawingToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAddGrowArea={onAddGrowArea}
      />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleZoomChange(50)}
              className={`px-3 py-1 text-sm rounded ${
                Math.abs(scale - 0.5) < 0.01
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              50%
            </button>
            <button
              onClick={() => handleZoomChange(100)}
              className={`px-3 py-1 text-sm rounded ${
                Math.abs(scale - 1) < 0.01
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => handleZoomChange(200)}
              className={`px-3 py-1 text-sm rounded ${
                Math.abs(scale - 2) < 0.01
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              200%
            </button>
            <button
              onClick={handleFitToView}
              className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Fit to View
            </button>
          </div>
          <div className="text-sm font-medium text-green-600">
            {currentZoomPercent}%
          </div>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Show Grid</span>
          </label>

          {/* Multi-selection indicator */}
          {(selectedIds.size > 1 || selectedObjectIds.size > 1) && (
            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
              {selectedIds.size + selectedObjectIds.size} items selected
            </div>
          )}

          <div className="text-sm text-gray-600">
            {growAreas.filter(a => a.positionX !== undefined).length} / {growAreas.length} areas placed
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 bg-gray-100 overflow-hidden relative">
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          draggable={activeTool === 'PAN'}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={scale}
          scaleY={scale}
          onWheel={handleWheel}
          onDragEnd={(e) => {
            // Only update stage position if we actually dragged the stage (not a grow area)
            const target = e.target;
            if (target === stageRef.current) {
              setStagePosition({
                x: target.x(),
                y: target.y(),
              });
            }
          }}
          onClick={(e) => {
            // Deselect when clicking on stage background
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
              setSelectedObjectId(null);
              setSelectedIds(new Set());
              setSelectedObjectIds(new Set());
            }
          }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            {/* Background rectangle for canvas area */}
            <Rect
              x={-10000}
              y={-10000}
              width={20000}
              height={20000}
              fill="#ffffff"
              listening={false}
            />

            {/* Grid */}
            {showGrid && generateGridLines()}

            {/* Grow Areas */}
            {growAreas.map((growArea) => {
              // Skip areas without positions - they'll appear in a sidebar later
              if (growArea.positionX === undefined || growArea.positionY === undefined) {
                return null;
              }

              const isPartOfMultiSelect = selectedIds.has(growArea.id);
              const showAsMultiSelected = isPartOfMultiSelect && selectedIds.size > 1;

              return (
                <GrowAreaBox
                  key={`${growArea.id}-${growArea.width}-${growArea.length}`}
                  growArea={growArea}
                  isSelected={selectedId === growArea.id && selectedIds.size <= 1}
                  isMultiSelected={showAsMultiSelected}
                  isDraggingEnabled={activeTool === 'SELECT'}
                  onDragStart={() => {
                    draggingIdRef.current = growArea.id;
                  }}
                  onDragEnd={(x, y) => {
                    console.log(`🎯 Drag ended for "${growArea.name}" (${growArea.id}):`, {
                      newPosition: { x, y },
                      originalPosition: { x: growArea.positionX, y: growArea.positionY },
                      isPartOfMultiSelect: selectedIds.has(growArea.id),
                      multiSelectSize: selectedIds.size,
                      selectedIds: Array.from(selectedIds),
                    });

                    // Calculate the offset from the original position
                    const deltaX = x - (growArea.positionX ?? 0);
                    const deltaY = y - (growArea.positionY ?? 0);

                    console.log(`📐 Delta calculated:`, { deltaX, deltaY });

                    // If this item is part of a multi-selection, move all selected items
                    if (selectedIds.has(growArea.id) && selectedIds.size > 1) {
                      console.log(`🚚 Multi-select drag detected - moving ${selectedIds.size} items`);

                      const updates = Array.from(selectedIds).map((id) => {
                        const area = growAreas.find((a) => a.id === id);
                        if (area && area.positionX !== undefined && area.positionY !== undefined) {
                          const update = {
                            id,
                            x: area.positionX + deltaX,
                            y: area.positionY + deltaY,
                          };
                          console.log(`  ➡️ Moving "${area.name}" (${id}) to:`, update);
                          return update;
                        }
                        return null;
                      }).filter((u): u is { id: string; x: number; y: number } => u !== null);

                      console.log(`✅ Calling onUpdatePositions with ${updates.length} updates:`, updates);
                      onUpdatePositions?.(updates);
                    } else {
                      // Single item move
                      console.log(`🔵 Single item move for "${growArea.name}"`);
                      onUpdatePosition(growArea.id, x, y);
                    }

                    draggingIdRef.current = null;
                  }}
                  onResize={(width, height) => {
                    onUpdateDimensions(growArea.id, width, height);
                  }}
                  onSelect={() => {
                    console.log(`🖱️ Click on "${growArea.name}" (${growArea.id}):`, {
                      isPartOfMultiSelect: selectedIds.has(growArea.id),
                      currentSelectionSize: selectedIds.size,
                      selectedIds: Array.from(selectedIds),
                    });

                    // If clicking on an item that's already in the multi-selection, keep the entire selection
                    if (selectedIds.has(growArea.id)) {
                      console.log(`✋ Item already selected - keeping multi-selection`);
                      return; // Don't change anything
                    }

                    // Otherwise, this is a new selection - clear multi-select and select just this item
                    console.log(`🆕 New selection - clearing multi-select and selecting just this item`);
                    setSelectedId(growArea.id);
                    setSelectedIds(new Set([growArea.id]));
                    setSelectedObjectId(null);
                    setSelectedObjectIds(new Set());
                  }}
                  onDoubleClick={() => onSelectGrowArea(growArea)}
                />
              );
            })}

            {/* Canvas Objects */}
            {canvasObjects.map((obj) => (
              <CanvasShape
                key={obj.id}
                canvasObject={obj}
                isSelected={selectedObjectId === obj.id}
                isDraggingEnabled={activeTool === 'SELECT'}
                onSelect={() => setSelectedObjectId(obj.id)}
                onDragEnd={async (x, y) => {
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x, y } : s)));
                  try {
                    await canvasObjectService.update(obj.id, { x, y });
                  } catch (error) {
                    console.error('Failed to update canvas object position:', error);
                    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? obj : s)));
                  }
                }}
                onResize={async (x, y, width, height) => {
                  // optimistic
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x, y, width, height } : s)));
                  try {
                    await canvasObjectService.update(obj.id, { x, y, width, height });
                  } catch (error) {
                    console.error('Failed to resize canvas object:', error);
                    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? obj : s)));
                  }
                }}
              />
            ))}

            {/* Preview of shape being drawn */}
            {isDrawing && currentDrawing && (
              <CanvasShape
                key="preview"
                canvasObject={currentDrawing}
                isSelected={false}
                onSelect={() => {}}
                onDragEnd={() => {}}
              />
            )}

            {/* Selection rectangle for multi-select */}
            {isSelecting && selectionRect && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(0, 123, 255, 0.3)"
                stroke="#007bff"
                strokeWidth={2}
                dash={[4, 2]}
                listening={false}
              />
            )}
          </Layer>
        </Stage>

        {/* Instructions overlay when empty */}
        {growAreas.filter(a => a.positionX !== undefined).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Board View
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Create grow areas and they will appear here. You can drag them to arrange your garden layout.
              </p>
              <p className="text-gray-500 text-xs">
                💡 Tip: Grow areas need width and length values to appear on the board.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
        <div className="flex gap-4">
          <span>💡 Tip: Drag the canvas to pan, drag grow areas to reposition</span>
          <span>📏 Grid: 50cm intervals</span>
          <span>🖱️ Double-click a grow area to edit</span>
        </div>
      </div>
    </div>
  );
}
