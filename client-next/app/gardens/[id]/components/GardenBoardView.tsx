'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Stage } from 'react-konva';
import { GrowArea, CanvasObject, canvasObjectService } from '@/lib/api';
import Konva from 'konva';
import DrawingToolbar, { DrawingTool } from './DrawingToolbar';
import CanvasToolbar from './CanvasToolbar';
import CanvasLayer from './CanvasLayer';
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
import { useCanvasObjectOperations } from '../hooks/useCanvasObjectOperations';
import { useGrowAreaOperations } from '../hooks/useGrowAreaOperations';
import { useStageEventHandlers } from '../hooks/useStageEventHandlers';
import { generateGridLines } from '../utils/gridUtils';

interface GardenBoardViewProps {
  growAreas: GrowArea[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdatePositions?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onUpdateDimensions: (id: string, width: number, height: number) => void;
  onUpdateRotation?: (id: string, rotation: number) => void;
  onSelectGrowArea: (growArea: GrowArea) => void;
  onAddGrowArea?: () => void;
  onDeleteGrowArea?: (growArea: GrowArea) => void;
  onAddCrop?: (growArea: GrowArea) => void;
  gardenId: string;
}

export default function GardenBoardView({
  growAreas,
  onUpdatePosition,
  onUpdatePositions,
  onUpdateDimensions,
  onUpdateRotation,
  onSelectGrowArea,
  onAddGrowArea,
  onDeleteGrowArea,
  onAddCrop,
  gardenId,
}: GardenBoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<DrawingTool>('SELECT');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [brushSize, setBrushSize] = useState(3);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Auto-save hook for canvas objects
  const { scheduleUpdate: scheduleCanvasObjectSave } = useCanvasObjectSaver(800);

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

  // Canvas persistence (position, scale, grid)
  const { stagePosition, setStagePosition, scale, setScale, showGrid, setShowGrid } =
    useCanvasPersistence(gardenId);

  // Zoom controls
  const { handleZoomChange, handleWheel, handleFitToView, currentZoomPercent } =
    useCanvasZoom({
      scale,
      setScale,
      stagePosition,
      setStagePosition,
      dimensions,
      growAreas,
    });

  // Selection state
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

  // Drawing interaction
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
    brushSize,
    onObjectCreated: (obj) => {
      setCanvasObjects((prev) => [...prev, obj]);
      recordAction({ type: 'CREATE_OBJECT', object: obj });
    },
  });

  // Copy/Paste hook
  const { copySelectedObject, pasteObject } = useCopyPaste({
    canvasObjects,
    selectedObjectId,
    onObjectCreated: async (obj) => {
      const created = await canvasObjectService.create(obj);
      setCanvasObjects((prev) => [...prev, created]);
      recordAction({ type: 'CREATE_OBJECT', object: created });
      setSelectedObjectId(created.id);
    },
  });

  // Canvas object operations (CRUD, bulk actions, context menu)
  const {
    saveStatus,
    setSaveStatus,
    contextMenu,
    setContextMenu,
    deleteSelectedObject,
    duplicateSelectedObject,
    handleBulkUpdate,
    handleBulkDelete,
    handleUpdateObjectProperties,
    handleBringToFront,
    handleBringForward,
    handleSendBackward,
    handleSendToBack,
    handleMoveObject,
  } = useCanvasObjectOperations({
    canvasObjects,
    setCanvasObjects,
    selectedObjectId,
    setSelectedObjectId,
    selectedObjectIds,
    clearSelection,
    recordAction,
    scheduleCanvasObjectSave,
  });

  // Grow area operations
  const {
    dragStartPosRef,
    handleGrowAreaDragStart,
    handleGrowAreaDragEnd,
    handleGrowAreaResize,
    handleGrowAreaRotate,
    handleGrowAreaSelect,
    handleGrowAreaDoubleClick,
    handleUpdateGrowAreaProperties,
    handleMoveGrowArea,
  } = useGrowAreaOperations({
    growAreas,
    selectedId,
    setSelectedId,
    selectedIds,
    selectGrowArea,
    recordAction,
    onUpdatePosition,
    onUpdatePositions,
    onUpdateDimensions,
    onUpdateRotation,
    onSelectGrowArea,
  });

  // Stage event handlers
  const { handleStageMouseDown, handleStageMouseMove, handleStageMouseUp } =
    useStageEventHandlers({
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
    });

  // Grid lines (memoized)
  const gridLines = useMemo(
    () => generateGridLines({ dimensions, scale, stagePosition }),
    [dimensions.width, dimensions.height, scale, stagePosition.x, stagePosition.y]
  );

  // Load canvas objects from backend
  useEffect(() => {
    if (!gardenId) return;

    const loadCanvasObjects = async () => {
      try {
        const objects = await canvasObjectService.getByGardenId(gardenId);
        setCanvasObjects(objects);
      } catch (error) {
        console.error('Failed to load canvas objects:', error);
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

  // Zoom functions for keyboard shortcuts
  const handleZoomIn = useCallback(() => {
    setScale(Math.min(scale * 1.1, 5));
  }, [scale, setScale]);

  const handleZoomOut = useCallback(() => {
    setScale(Math.max(scale / 1.1, 0.1));
  }, [scale, setScale]);

  // Context menu handler
  const handleContextMenuOpen = useCallback((e: any, objectId: number) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      setContextMenu({ x: pointerPosition.x, y: pointerPosition.y, objectId });
      setSelectedObjectId(objectId);
    }
  }, [setContextMenu, setSelectedObjectId]);

  // Object drag handlers with undo support
  const handleObjectDragStart = useCallback((obj: CanvasObject) => {
    dragStartPosRef.current = {
      id: obj.id.toString(),
      x: obj.x,
      y: obj.y,
      isGrowArea: false,
    };
  }, [dragStartPosRef]);

  const handleObjectDragEnd = useCallback((obj: CanvasObject, x: number, y: number) => {
    if (dragStartPosRef.current) {
      recordAction({
        type: 'UPDATE_OBJECT',
        objectId: obj.id,
        before: { x: dragStartPosRef.current.x, y: dragStartPosRef.current.y },
        after: { x, y },
      });
    }
    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x, y } : s)));
    setSaveStatus('pending');
    scheduleCanvasObjectSave(obj.id, { x, y });
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
    dragStartPosRef.current = null;
  }, [dragStartPosRef, recordAction, scheduleCanvasObjectSave, setSaveStatus]);

  const handleObjectResize = useCallback((obj: CanvasObject, x: number, y: number, width: number, height: number) => {
    recordAction({
      type: 'UPDATE_OBJECT',
      objectId: obj.id,
      before: { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
      after: { x, y, width, height },
    });
    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, x, y, width, height } : s)));
    setSaveStatus('pending');
    scheduleCanvasObjectSave(obj.id, { x, y, width, height });
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
  }, [recordAction, scheduleCanvasObjectSave, setSaveStatus]);

  const handleObjectUpdatePoints = useCallback((obj: CanvasObject, points: number[]) => {
    const pointsString = JSON.stringify(points);
    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, points: pointsString } : s)));
    setSaveStatus('pending');
    scheduleCanvasObjectSave(obj.id, { points: pointsString });
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
  }, [scheduleCanvasObjectSave, setSaveStatus]);

  const handleObjectTextEdit = useCallback((obj: CanvasObject, text: string) => {
    setCanvasObjects((prev) => prev.map((s) => (s.id === obj.id ? { ...s, text } : s)));
    setSaveStatus('pending');
    scheduleCanvasObjectSave(obj.id, { text });
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
  }, [scheduleCanvasObjectSave, setSaveStatus]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedObjectId,
    selectedGrowAreaId: selectedId,
    onDeleteObject: () => {
      if (selectedObjectIds.size > 1) {
        handleBulkDelete();
      } else if (selectedObjectId) {
        deleteSelectedObject();
      } else if (selectedId && onDeleteGrowArea) {
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
    onUndo: () => canUndo && undo(),
    onRedo: () => canRedo && redo(),
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
      <CanvasToolbar
        scale={scale}
        currentZoomPercent={currentZoomPercent}
        onZoomChange={handleZoomChange}
        onFitToView={handleFitToView}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onGridToggle={setShowGrid}
        selectedIds={selectedIds}
        selectedObjectIds={selectedObjectIds}
        growAreas={growAreas}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        onShowShortcuts={() => setShowShortcutsModal(true)}
      />

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
              setStagePosition({ x: target.x(), y: target.y() });
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
          <CanvasLayer
            showGrid={showGrid}
            gridLines={gridLines}
            growAreas={growAreas}
            selectedId={selectedId}
            selectedIds={selectedIds}
            activeTool={activeTool}
            onGrowAreaDragStart={handleGrowAreaDragStart}
            onGrowAreaDragEnd={handleGrowAreaDragEnd}
            onGrowAreaResize={handleGrowAreaResize}
            onGrowAreaRotate={handleGrowAreaRotate}
            onGrowAreaSelect={handleGrowAreaSelect}
            onGrowAreaDoubleClick={handleGrowAreaDoubleClick}
            canvasObjects={canvasObjects}
            selectedObjectId={selectedObjectId}
            snapToGrid={snapToGrid}
            onObjectSelect={selectCanvasObject}
            onObjectDragStart={handleObjectDragStart}
            onObjectDragEnd={handleObjectDragEnd}
            onObjectResize={handleObjectResize}
            onObjectUpdatePoints={handleObjectUpdatePoints}
            onObjectContextMenu={handleContextMenuOpen}
            onObjectTextEdit={handleObjectTextEdit}
            currentDrawing={currentDrawing}
            selectionRect={selectionRect}
          />
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

      {/* Grow Area Properties Panel */}
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

      {/* Add Crop Button */}
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

      {/* Mini-map */}
      {showMiniMap && (
        <MiniMap
          growAreas={growAreas}
          canvasObjects={canvasObjects}
          stagePosition={stagePosition}
          scale={scale}
          viewportWidth={dimensions.width}
          viewportHeight={dimensions.height}
          onViewportClick={(x, y) => setStagePosition({ x, y })}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
