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
import ShapePropertiesPanel from './ShapePropertiesPanel';
import BulkActionsPanel from './BulkActionsPanel';
import GrowAreaPropertiesPanel from './GrowAreaPropertiesPanel';
import ContextMenu from './ContextMenu';
import SaveIndicator from './SaveIndicator';
import MiniMap from './MiniMap';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useCanvasPersistence } from '../hooks/useCanvasPersistence';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useDrawingInteraction } from '../hooks/useDrawingInteraction';
import { useSelectionState } from '../hooks/useSelectionState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCanvasObjectSaver } from '../hooks/useCanvasObjectSaver';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useCopyPaste } from '../hooks/useCopyPaste';
import { generateGridLines, snapPositionToGrid, GRID_SIZE } from '../utils/gridUtils';

interface GardenBoardViewProps {
  growAreas: GrowArea[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdatePositions?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onUpdateDimensions: (id: string, width: number, height: number) => void;
  onSelectGrowArea: (growArea: GrowArea) => void;
  onAddGrowArea?: () => void;
  onDeleteGrowArea?: (growArea: GrowArea) => void;
  onAddCrop?: (growArea: GrowArea) => void; // New: for adding crops from board
  gardenId: string;
}

export default function GardenBoardView({
  growAreas,
  onUpdatePosition,
  onUpdatePositions,
  onUpdateDimensions,
  onSelectGrowArea,
  onAddGrowArea,
  onDeleteGrowArea,
  onAddCrop,
  gardenId,
}: GardenBoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const draggingIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ id: string; x: number; y: number; isGrowArea: boolean } | null>(null);
  const resizeStartRef = useRef<{ id: string; width: number; height: number; isGrowArea: boolean } | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<DrawingTool>('SELECT');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [brushSize, setBrushSize] = useState(3); // Default brush size for freehand
  const [snapToGrid, setSnapToGrid] = useState(false); // Snap-to-grid toggle
  const [showMiniMap, setShowMiniMap] = useState(true); // Mini-map visibility
  const [showShortcutsModal, setShowShortcutsModal] = useState(false); // Keyboard shortcuts help modal

  // Auto-save hook for canvas objects
  const { scheduleUpdate: scheduleCanvasObjectSave, saveNow: saveCanvasObjectsNow } = useCanvasObjectSaver(800);

  // Undo/Redo hook
  const { canUndo, canRedo, undo, redo, recordAction } = useUndoRedo({
    onCreateObject: async (object) => {
      const created = await canvasObjectService.create(object);
      setCanvasObjects((prev) => [...prev, created]);
    },
    onUpdateObject: async (id, updates) => {
      setCanvasObjects((prev) => prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)));
      await canvasObjectService.update(id, updates);
    },
    onDeleteObject: async (id) => {
      setCanvasObjects((prev) => prev.filter((obj) => obj.id !== id));
      await canvasObjectService.delete(id);
    },
    onMoveGrowArea: (id, x, y) => {
      onUpdatePosition(id, x, y);
    },
    onResizeGrowArea: (id, width, height) => {
      onUpdateDimensions(id, width, height);
    },
    onBatchMove: (moves) => {
      const growAreaMoves = moves.filter(m => m.isGrowArea).map(m => ({ id: m.id, x: m.x, y: m.y }));
      const objectMoves = moves.filter(m => !m.isGrowArea);
      
      if (growAreaMoves.length > 0) {
        onUpdatePositions?.(growAreaMoves);
      }
      
      objectMoves.forEach(m => {
        setCanvasObjects((prev) => prev.map((obj) => (obj.id === parseInt(m.id) ? { ...obj, x: m.x, y: m.y } : obj)));
        scheduleCanvasObjectSave(parseInt(m.id), { x: m.x, y: m.y });
      });
    },
  });

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
    brushSize, // Pass current brush size
    onObjectCreated: (obj) => {
      setCanvasObjects((prev) => [...prev, obj]);
      // Record create action for undo
      recordAction({
        type: 'CREATE_OBJECT',
        object: obj,
      });
    },
  });

  // Copy/Paste hook
  const { copySelectedObject, pasteObject, hasCopiedObject } = useCopyPaste({
    canvasObjects,
    selectedObjectId,
    onObjectCreated: async (obj) => {
      const created = await canvasObjectService.create(obj);
      setCanvasObjects((prev) => [...prev, created]);
      recordAction({
        type: 'CREATE_OBJECT',
        object: created,
      });
      setSelectedObjectId(created.id);
    },
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

  // Delete selected canvas object (no confirmation - undo/redo available)
  const deleteSelectedObject = async () => {
    if (!selectedObjectId) return;

    const objectToDelete = canvasObjects.find((obj) => obj.id === selectedObjectId);
    if (!objectToDelete) return;

    try {
      // Record undo action before deleting
      recordAction({
        type: 'DELETE_OBJECT',
        object: objectToDelete,
      });

      await canvasObjectService.delete(selectedObjectId);
      setCanvasObjects((prev) => prev.filter((obj) => obj.id !== selectedObjectId));
      setSelectedObjectId(null);
    } catch (error) {
      console.error('Failed to delete canvas object:', error);
      alert('Failed to delete shape. Please try again.');
    }
  };

  // Duplicate selected canvas object
  const duplicateSelectedObject = async () => {
    if (!selectedObjectId) return;

    const objectToDuplicate = canvasObjects.find((obj) => obj.id === selectedObjectId);
    if (!objectToDuplicate) return;

    try {
      // Create a copy with offset position
      const { id, ...objectData } = objectToDuplicate;
      const duplicatedObject = await canvasObjectService.create({
        ...objectData,
        x: objectToDuplicate.x + 20,
        y: objectToDuplicate.y + 20,
        zIndex: (objectToDuplicate.zIndex || 0) + 1,
      });
      
      // Record undo action for duplicate (create)
      recordAction({
        type: 'CREATE_OBJECT',
        object: duplicatedObject,
      });
      
      setCanvasObjects((prev) => [...prev, duplicatedObject]);
      setSelectedObjectId(duplicatedObject.id);
    } catch (error) {
      console.error('Failed to duplicate canvas object:', error);
      alert('Failed to duplicate shape. Please try again.');
    }
  };

  // Move selected canvas object with arrow keys
  const handleMoveObject = (dx: number, dy: number) => {
    if (!selectedObjectId) return;

    const obj = canvasObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;

    const newX = obj.x + dx;
    const newY = obj.y + dy;

    // Record undo action
    recordAction({
      type: 'UPDATE_OBJECT',
      objectId: obj.id,
      before: { x: obj.x, y: obj.y },
      after: { x: newX, y: newY },
    });

    // Update locally and save
    setCanvasObjects((prev) =>
      prev.map((o) => (o.id === selectedObjectId ? { ...o, x: newX, y: newY } : o))
    );
    scheduleCanvasObjectSave(selectedObjectId, { x: newX, y: newY });
  };

  // Move selected grow area with arrow keys
  const handleMoveGrowArea = (dx: number, dy: number) => {
    if (!selectedId) return;

    const growArea = growAreas.find((ga) => ga.id === selectedId);
    if (!growArea || growArea.positionX === undefined || growArea.positionY === undefined) return;

    const newX = growArea.positionX + dx;
    const newY = growArea.positionY + dy;

    // Record undo action
    recordAction({
      type: 'MOVE_GROW_AREA',
      areaId: selectedId,
      before: { x: growArea.positionX, y: growArea.positionY },
      after: { x: newX, y: newY },
    });

    onUpdatePosition(selectedId, newX, newY);
  };

  // Zoom functions for keyboard shortcuts
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.1, 5);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.1, 0.1);
    setScale(newScale);
  };

  // Bulk update for multi-selected objects
  const handleBulkUpdate = async (updates: Partial<CanvasObject>) => {
    if (selectedObjectIds.size === 0) return;

    const objectsToUpdate = canvasObjects.filter(obj => selectedObjectIds.has(obj.id));
    
    try {
      // Optimistic update
      setCanvasObjects((prev) =>
        prev.map((obj) => 
          selectedObjectIds.has(obj.id) ? { ...obj, ...updates } : obj
        )
      );

      // Save each object
      for (const obj of objectsToUpdate) {
        scheduleCanvasObjectSave(obj.id, updates);
      }
    } catch (error) {
      console.error('Failed to update objects:', error);
      alert('Failed to update shapes. Please try again.');
    }
  };

  // Bulk delete for multi-selected objects
  const handleBulkDelete = async () => {
    if (selectedObjectIds.size === 0) return;

    const objectsToDelete = canvasObjects.filter(obj => selectedObjectIds.has(obj.id));
    
    try {
      // Record undo actions for all deleted objects
      for (const obj of objectsToDelete) {
        recordAction({
          type: 'DELETE_OBJECT',
          object: obj,
        });
      }

      // Delete all objects
      for (const obj of objectsToDelete) {
        await canvasObjectService.delete(obj.id);
      }
      
      setCanvasObjects((prev) => prev.filter((obj) => !selectedObjectIds.has(obj.id)));
      clearSelection();
    } catch (error) {
      console.error('Failed to delete objects:', error);
      alert('Failed to delete shapes. Please try again.');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedObjectId,
    selectedGrowAreaId: selectedId,
    onDeleteObject: () => {
      // Handle bulk delete if multiple objects selected
      if (selectedObjectIds.size > 1) {
        handleBulkDelete();
      } else if (selectedObjectId) {
        deleteSelectedObject();
      } else if (selectedId && onDeleteGrowArea) {
        // Delete grow area if one is selected
        const growArea = growAreas.find(ga => ga.id === selectedId);
        if (growArea && confirm(`Delete "${growArea.name}"? This cannot be undone.`)) {
          onDeleteGrowArea(growArea);
        }
      }
    },
    onSetActiveTool: setActiveTool,
    onCancelDrawing: () => {
      clearSelection();
      cancelDrawing();
      setActiveTool('SELECT');
    },
    onUndo: () => {
      if (canUndo) {
        undo();
      }
    },
    onRedo: () => {
      if (canRedo) {
        redo();
      }
    },
    onCopy: copySelectedObject,
    onPaste: pasteObject,
    onDuplicate: duplicateSelectedObject,
    onMoveObject: handleMoveObject,
    onMoveGrowArea: handleMoveGrowArea,
    onShowHelp: () => setShowShortcutsModal(true),
    onFitToView: handleFitToView,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
  });

  // Handle stage mouse down
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
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

  // Update canvas object properties
  const handleUpdateObjectProperties = async (updates: Partial<CanvasObject>) => {
    if (!selectedObjectId) return;

    // Optimistic update
    setCanvasObjects((prev) =>
      prev.map((obj) => (obj.id === selectedObjectId ? { ...obj, ...updates } : obj))
    );

    // Debounced save
    setSaveStatus('pending');
    scheduleCanvasObjectSave(selectedObjectId, updates);
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
  };

  // Update grow area properties (Step 27.9 - color customization)
  const handleUpdateGrowAreaProperties = async (updates: Partial<GrowArea>) => {
    if (!selectedId) return;

    const growArea = growAreas.find(ga => ga.id === selectedId);
    if (!growArea) return;

    try {
      // Make API call to update grow area
      const response = await fetch(`/api/grow-areas/${selectedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update grow area');
      }

      // The parent component will re-fetch and update the grow areas
      // So we don't need to do anything else here
    } catch (error) {
      console.error('Failed to update grow area:', error);
      alert('Failed to update grow area. Please try again.');
    }
  };

  // Context menu handlers
  const handleContextMenuOpen = (e: any, objectId: number) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      setContextMenu({
        x: pointerPosition.x,
        y: pointerPosition.y,
        objectId,
      });
      setSelectedObjectId(objectId);
    }
  };

  const handleBringToFront = () => {
    if (!contextMenu) return;
    const maxZIndex = Math.max(...canvasObjects.map(obj => obj.zIndex || 0), 0);
    handleUpdateObjectProperties({ zIndex: maxZIndex + 1 });
  };

  const handleBringForward = () => {
    if (!contextMenu) return;
    const obj = canvasObjects.find(o => o.id === contextMenu.objectId);
    handleUpdateObjectProperties({ zIndex: (obj?.zIndex || 0) + 1 });
  };

  const handleSendBackward = () => {
    if (!contextMenu) return;
    const obj = canvasObjects.find(o => o.id === contextMenu.objectId);
    handleUpdateObjectProperties({ zIndex: Math.max(0, (obj?.zIndex || 0) - 1) });
  };

  const handleSendToBack = () => {
    if (!contextMenu) return;
    handleUpdateObjectProperties({ zIndex: 0 });
  };

  // Get selected canvas object
  const selectedCanvasObject = canvasObjects.find((obj) => obj.id === selectedObjectId) || null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Drawing Toolbar */}
      <DrawingToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAddGrowArea={onAddGrowArea}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <ZoomControls
          scale={scale}
          currentZoomPercent={currentZoomPercent}
          onZoomChange={handleZoomChange}
          onFitToView={handleFitToView}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          snapToGrid={snapToGrid}
          onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        />

        <ViewOptions
          showGrid={showGrid}
          onGridToggle={setShowGrid}
          selectedIds={selectedIds}
          selectedObjectIds={selectedObjectIds}
          growAreas={growAreas}
        />

        {/* Help and Mini-map buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              showMiniMap ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
            title="Toggle Mini-map"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="Keyboard Shortcuts (?)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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
                    // Store starting position for undo
                    dragStartPosRef.current = {
                      id: growArea.id,
                      x: growArea.positionX ?? 0,
                      y: growArea.positionY ?? 0,
                      isGrowArea: true,
                    };
                  }}
                  onDragEnd={(x, y) => {
                    const deltaX = x - (growArea.positionX ?? 0);
                    const deltaY = y - (growArea.positionY ?? 0);

                    if (selectedIds.has(growArea.id) && selectedIds.size > 1) {
                      // Multi-select batch move
                      const moves = Array.from(selectedIds).map((id) => {
                        const area = growAreas.find((a) => a.id === id);
                        if (area && area.positionX !== undefined && area.positionY !== undefined) {
                          return {
                            id,
                            isGrowArea: true,
                            before: { x: area.positionX, y: area.positionY },
                            after: { x: area.positionX + deltaX, y: area.positionY + deltaY },
                          };
                        }
                        return null;
                      }).filter((m): m is { id: string; isGrowArea: boolean; before: { x: number; y: number }; after: { x: number; y: number } } => m !== null);

                      if (moves.length > 0) {
                        recordAction({ type: 'BATCH_MOVE', moves });
                      }

                      const updates = moves.map(m => ({ id: m.id, x: m.after.x, y: m.after.y }));
                      onUpdatePositions?.(updates);
                    } else {
                      // Single grow area move
                      if (dragStartPosRef.current) {
                        recordAction({
                          type: 'MOVE_GROW_AREA',
                          areaId: growArea.id,
                          before: { x: dragStartPosRef.current.x, y: dragStartPosRef.current.y },
                          after: { x, y },
                        });
                      }
                      onUpdatePosition(growArea.id, x, y);
                    }

                    draggingIdRef.current = null;
                    dragStartPosRef.current = null;
                  }}
                  onResize={(width, height) => {
                    // Record resize action for undo
                    const before = {
                      width: growArea.width ?? 100,
                      height: growArea.length ?? 100,
                    };
                    recordAction({
                      type: 'RESIZE_GROW_AREA',
                      areaId: growArea.id,
                      before,
                      after: { width, height },
                    });
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

            {/* Canvas Objects - sorted by zIndex */}
            {[...canvasObjects]
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
              .map((obj) => (
              <CanvasShape
                key={obj.id}
                canvasObject={obj}
                isSelected={selectedObjectId === obj.id}
                isDraggingEnabled={activeTool === 'SELECT'}
                onSelect={() => selectCanvasObject(obj.id)}
                onDragStart={() => {
                  // Store starting position for undo
                  dragStartPosRef.current = {
                    id: obj.id.toString(),
                    x: obj.x,
                    y: obj.y,
                    isGrowArea: false,
                  };
                }}
                onDragEnd={(x, y) => {
                  // Apply snap-to-grid if enabled
                  const finalPos = snapToGrid ? snapPositionToGrid({ x, y }, GRID_SIZE) : { x, y };
                  
                  // Record undo action
                  if (dragStartPosRef.current) {
                    recordAction({
                      type: 'UPDATE_OBJECT',
                      objectId: obj.id,
                      before: { x: dragStartPosRef.current.x, y: dragStartPosRef.current.y },
                      after: { x: finalPos.x, y: finalPos.y },
                    });
                  }
                  
                  // Optimistic update
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x: finalPos.x, y: finalPos.y } : s)));
                  setSaveStatus('pending');
                  // Debounced save
                  scheduleCanvasObjectSave(obj.id, { x: finalPos.x, y: finalPos.y });
                  setTimeout(() => setSaveStatus('saving'), 100);
                  setTimeout(() => setSaveStatus('saved'), 900);
                  setTimeout(() => setSaveStatus('idle'), 2900);
                  
                  dragStartPosRef.current = null;
                }}
                onResize={async (x, y, width, height) => {
                  // Apply snap-to-grid if enabled
                  const finalPos = snapToGrid ? snapPositionToGrid({ x, y }, GRID_SIZE) : { x, y };
                  
                  // Record undo action
                  recordAction({
                    type: 'UPDATE_OBJECT',
                    objectId: obj.id,
                    before: { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
                    after: { x: finalPos.x, y: finalPos.y, width, height },
                  });
                  
                  // Optimistic update
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x: finalPos.x, y: finalPos.y, width, height } : s)));
                  setSaveStatus('pending');
                  // Debounced save
                  scheduleCanvasObjectSave(obj.id, { x: finalPos.x, y: finalPos.y, width, height });
                  setTimeout(() => setSaveStatus('saving'), 100);
                  setTimeout(() => setSaveStatus('saved'), 900);
                  setTimeout(() => setSaveStatus('idle'), 2900);
                }}
                onUpdatePoints={async (points) => {
                  const pointsString = JSON.stringify(points);
                  // Optimistic update
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, points: pointsString } : s)));
                  setSaveStatus('pending');
                  // Debounced save
                  scheduleCanvasObjectSave(obj.id, { points: pointsString });
                  setTimeout(() => setSaveStatus('saving'), 100);
                  setTimeout(() => setSaveStatus('saved'), 900);
                  setTimeout(() => setSaveStatus('idle'), 2900);
                }}
                onContextMenu={(e) => handleContextMenuOpen(e, obj.id)}
                onTextEdit={(text) => {
                  // Optimistic update
                  setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, text } : s)));
                  setSaveStatus('pending');
                  // Debounced save
                  scheduleCanvasObjectSave(obj.id, { text });
                  setTimeout(() => setSaveStatus('saving'), 100);
                  setTimeout(() => setSaveStatus('saved'), 900);
                  setTimeout(() => setSaveStatus('idle'), 2900);
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

      {/* Shape Properties Panel - single selection */}
      {selectedCanvasObject && selectedObjectIds.size <= 1 && (
        <ShapePropertiesPanel
          selectedObject={selectedCanvasObject}
          onUpdate={handleUpdateObjectProperties}
          onDelete={deleteSelectedObject}
          onDuplicate={duplicateSelectedObject}
          onClose={() => setSelectedObjectId(null)}
        />
      )}

      {/* Bulk Actions Panel - multi selection */}
      {selectedObjectIds.size > 1 && (
        <BulkActionsPanel
          selectedCount={selectedObjectIds.size}
          selectedObjects={canvasObjects.filter(obj => selectedObjectIds.has(obj.id))}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onClose={clearSelection}
        />
      )}

      {/* Grow Area Properties Panel - when grow area is selected (Step 27.9) */}
      {selectedId && !selectedObjectId && selectedObjectIds.size === 0 && (
        <GrowAreaPropertiesPanel
          selectedGrowArea={growAreas.find(ga => ga.id === selectedId)!}
          onUpdate={handleUpdateGrowAreaProperties}
          onDelete={onDeleteGrowArea ? () => {
            const growArea = growAreas.find(ga => ga.id === selectedId);
            if (growArea && confirm(`Delete "${growArea.name}"? This cannot be undone.`)) {
              onDeleteGrowArea(growArea);
            }
          } : undefined}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onBringToFront={handleBringToFront}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onSendToBack={handleSendToBack}
          onDuplicate={duplicateSelectedObject}
          onDelete={deleteSelectedObject}
        />
      )}

      {/* Add Crop Button - shown when a grow area is selected */}
      {selectedId && !selectedObjectId && onAddCrop && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => {
              const growArea = growAreas.find(ga => ga.id === selectedId);
              if (growArea) {
                onAddCrop(growArea);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Crop to This Area
          </button>
        </div>
      )}

      {/* Save Status Indicator */}
      <SaveIndicator status={saveStatus} />

      {/* Mini-map - Step 27.10 */}
      {showMiniMap && (
        <MiniMap
          growAreas={growAreas}
          canvasObjects={canvasObjects}
          stagePosition={stagePosition}
          scale={scale}
          viewportWidth={dimensions.width}
          viewportHeight={dimensions.height}
          onViewportClick={(x, y) => {
            setStagePosition({ x, y });
          }}
        />
      )}

      {/* Keyboard Shortcuts Modal - Step 27.11 */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
