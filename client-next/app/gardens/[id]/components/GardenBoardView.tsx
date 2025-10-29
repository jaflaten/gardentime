'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { GrowArea, CanvasObject, canvasObjectService } from '@/lib/api';
import Konva from 'konva';
import GrowAreaBox from './GrowAreaBox';
import DrawingToolbar, { DrawingTool } from './DrawingToolbar';
import CanvasShape from './CanvasShape';
import ZoomControls from './ZoomControls';
import ViewOptions from './ViewOptions';
import SelectionRectangle from './SelectionRectangle';
import { useCanvasPersistence } from '../hooks/useCanvasPersistence';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useDrawingInteraction } from '../hooks/useDrawingInteraction';
import { useSelectionState } from '../hooks/useSelectionState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { generateGridLines } from '../utils/gridUtils';

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

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<DrawingTool>('SELECT');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);

  // Use custom hooks
  const { stagePosition, setStagePosition, scale, setScale, showGrid, setShowGrid } =
    useCanvasPersistence(gardenId);

  const { handleZoomChange, handleWheel, handleFitToView, currentZoomPercent } =
    useCanvasZoom({
      scale,
      setScale,
      stagePosition,
      setStagePosition,
      dimensions,
      growAreas,
    });

  const {
    selectedId,
    setSelectedId,
    selectedObjectId,
    setSelectedObjectId,
    selectedIds,
    selectedObjectIds,
    isSelecting,
    selectionRect,
    startSelectionRect,
    updateSelectionRect,
    completeSelection,
    clearSelection,
    selectGrowArea,
    selectCanvasObject,
  } = useSelectionState(growAreas, canvasObjects, scale, stagePosition);

  const {
    isDrawing,
    currentDrawing,
    handleMouseDown: handleDrawingMouseDown,
    handleMouseMove: handleDrawingMouseMove,
    handleMouseUp: handleDrawingMouseUp,
    cancelDrawing,
  } = useDrawingInteraction({
    gardenId,
    activeTool,
    scale,
    stagePosition,
    onObjectCreated: (obj) => setCanvasObjects((prev) => [...prev, obj]),
  });

  // Load canvas objects from backend
  useEffect(() => {
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

  // Update canvas dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(600, window.innerHeight - 300);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
  useKeyboardShortcuts({
    selectedObjectId,
    onDeleteObject: deleteSelectedObject,
    onSetActiveTool: setActiveTool,
    onCancelDrawing: () => {
      clearSelection();
      cancelDrawing();
      setActiveTool('SELECT');
    },
  });

  // Handle stage mouse down
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();

    // Handle selection rectangle in SELECT mode
    if (activeTool === 'SELECT' && clickedOnEmpty) {
      startSelectionRect(stageRef.current);
      return;
    }

    // Handle drawing
    if (clickedOnEmpty) {
      handleDrawingMouseDown(stageRef.current, clickedOnEmpty);
    }
  };

  // Handle stage mouse move
  const handleStageMouseMove = () => {
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
  };

  // Handle stage mouse up
  const handleStageMouseUp = async () => {
    // Handle selection rectangle completion
    if (isSelecting) {
      completeSelection();
      return;
    }

    // Handle drawing completion
    if (isDrawing) {
      await handleDrawingMouseUp();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Drawing Toolbar */}
      <DrawingToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAddGrowArea={onAddGrowArea}
      />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <ZoomControls
          scale={scale}
          currentZoomPercent={currentZoomPercent}
          onZoomChange={handleZoomChange}
          onFitToView={handleFitToView}
        />

        <ViewOptions
          showGrid={showGrid}
          onGridToggle={setShowGrid}
          selectedIds={selectedIds}
          selectedObjectIds={selectedObjectIds}
          growAreas={growAreas}
        />
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
          onWheel={(e) => handleWheel(e, stageRef.current)}
          onDragEnd={(e) => {
            const target = e.target;
            if (target === stageRef.current) {
              setStagePosition({
                x: target.x(),
                y: target.y(),
              });
            }
          }}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              clearSelection();
            }
          }}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
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
              generateGridLines({ dimensions, scale, stagePosition }).map((line) => (
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
                  key={`${growArea.id}-${growArea.width}-${growArea.length}`}
                  growArea={growArea}
                  isSelected={selectedId === growArea.id && selectedIds.size <= 1}
                  isMultiSelected={showAsMultiSelected}
                  isDraggingEnabled={activeTool === 'SELECT'}
                  onDragStart={() => {
                    draggingIdRef.current = growArea.id;
                  }}
                  onDragEnd={(x, y) => {
                    const deltaX = x - (growArea.positionX ?? 0);
                    const deltaY = y - (growArea.positionY ?? 0);

                    if (selectedIds.has(growArea.id) && selectedIds.size > 1) {
                      const updates = Array.from(selectedIds).map((id) => {
                        const area = growAreas.find((a) => a.id === id);
                        if (area && area.positionX !== undefined && area.positionY !== undefined) {
                          return {
                            id,
                            x: area.positionX + deltaX,
                            y: area.positionY + deltaY,
                          };
                        }
                        return null;
                      }).filter((u): u is { id: string; x: number; y: number } => u !== null);

                      onUpdatePositions?.(updates);
                    } else {
                      onUpdatePosition(growArea.id, x, y);
                    }

                    draggingIdRef.current = null;
                  }}
                  onResize={(width, height) => {
                    onUpdateDimensions(growArea.id, width, height);
                  }}
                  onSelect={() => {
                    if (selectedIds.has(growArea.id)) {
                      return;
                    }
                    selectGrowArea(growArea);
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
                onSelect={() => selectCanvasObject(obj.id)}
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
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x, y, width, height } : s)));
                  try {
                    await canvasObjectService.update(obj.id, { x, y, width, height });
                  } catch (error) {
                    console.error('Failed to update canvas object:', error);
                    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? obj : s)));
                  }
                }}
                onUpdatePoints={async (points) => {
                  const pointsString = JSON.stringify(points);
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, points: pointsString } : s)));
                  try {
                    await canvasObjectService.update(obj.id, { points: pointsString });
                  } catch (error) {
                    console.error('Failed to update canvas object points:', error);
                    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? obj : s)));
                  }
                }}
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
        </Stage>
      </div>
    </div>
  );
}
