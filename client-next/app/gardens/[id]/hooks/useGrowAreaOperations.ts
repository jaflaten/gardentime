'use client';

import { useCallback, useRef } from 'react';
import { GrowArea } from '@/lib/api';

interface UseGrowAreaOperationsProps {
  growAreas: GrowArea[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedIds: Set<string>;
  selectGrowArea: (growArea: GrowArea) => void;
  recordAction: (action: any) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdatePositions?: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onUpdateDimensions: (id: string, width: number, height: number) => void;
  onUpdateRotation?: (id: string, rotation: number) => void;
  onSelectGrowArea: (growArea: GrowArea) => void;
}

export function useGrowAreaOperations({
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
}: UseGrowAreaOperationsProps) {
  const draggingIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ id: string; x: number; y: number; isGrowArea: boolean } | null>(null);

  const handleGrowAreaDragStart = useCallback((id: string) => {
    const growArea = growAreas.find(ga => ga.id === id);
    if (!growArea) return;

    draggingIdRef.current = id;
    dragStartPosRef.current = {
      id,
      x: growArea.positionX ?? 0,
      y: growArea.positionY ?? 0,
      isGrowArea: true,
    };
  }, [growAreas]);

  const handleGrowAreaDragEnd = useCallback((id: string, x: number, y: number) => {
    const growArea = growAreas.find(ga => ga.id === id);
    if (!growArea) return;

    const deltaX = x - (growArea.positionX ?? 0);
    const deltaY = y - (growArea.positionY ?? 0);

    if (selectedIds.has(id) && selectedIds.size > 1) {
      // Multi-select batch move
      const moves = Array.from(selectedIds).map((areaId) => {
        const area = growAreas.find((a) => a.id === areaId);
        if (area && area.positionX !== undefined && area.positionY !== undefined) {
          return {
            id: areaId,
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
          areaId: id,
          before: { x: dragStartPosRef.current.x, y: dragStartPosRef.current.y },
          after: { x, y },
        });
      }
      onUpdatePosition(id, x, y);
    }

    draggingIdRef.current = null;
    dragStartPosRef.current = null;
  }, [growAreas, selectedIds, recordAction, onUpdatePositions, onUpdatePosition]);

  const handleGrowAreaResize = useCallback((id: string, width: number, height: number) => {
    const growArea = growAreas.find(ga => ga.id === id);
    if (!growArea) return;

    const before = {
      width: growArea.width ?? 100,
      height: growArea.length ?? 100,
    };
    recordAction({
      type: 'RESIZE_GROW_AREA',
      areaId: id,
      before,
      after: { width, height },
    });
    onUpdateDimensions(id, width, height);
  }, [growAreas, recordAction, onUpdateDimensions]);

  const handleGrowAreaRotate = useCallback((id: string, rotation: number) => {
    onUpdateRotation?.(id, rotation);
  }, [onUpdateRotation]);

  const handleGrowAreaSelect = useCallback((id: string) => {
    if (selectedIds.has(id)) return;
    const growArea = growAreas.find(ga => ga.id === id);
    if (growArea) {
      selectGrowArea(growArea);
    }
  }, [selectedIds, growAreas, selectGrowArea]);

  const handleGrowAreaDoubleClick = useCallback((id: string) => {
    const growArea = growAreas.find(ga => ga.id === id);
    if (growArea) {
      onSelectGrowArea(growArea);
    }
  }, [growAreas, onSelectGrowArea]);

  // Update grow area properties (color customization)
  const handleUpdateGrowAreaProperties = useCallback(async (updates: Partial<GrowArea>) => {
    if (!selectedId) return;

    const growArea = growAreas.find(ga => ga.id === selectedId);
    if (!growArea) return;

    // Notify parent component of rotation changes for immediate canvas update
    if (updates.rotation !== undefined && onUpdateRotation) {
      onUpdateRotation(selectedId, updates.rotation);
      return;
    }

    try {
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
    } catch (error) {
      console.error('Failed to update grow area:', error);
      alert('Failed to update grow area. Please try again.');
    }
  }, [selectedId, growAreas, onUpdateRotation]);

  // Move selected grow area with arrow keys
  const handleMoveGrowArea = useCallback((dx: number, dy: number) => {
    if (!selectedId) return;

    const growArea = growAreas.find((ga) => ga.id === selectedId);
    if (!growArea || growArea.positionX === undefined || growArea.positionY === undefined) return;

    const newX = growArea.positionX + dx;
    const newY = growArea.positionY + dy;

    recordAction({
      type: 'MOVE_GROW_AREA',
      areaId: selectedId,
      before: { x: growArea.positionX, y: growArea.positionY },
      after: { x: newX, y: newY },
    });

    onUpdatePosition(selectedId, newX, newY);
  }, [selectedId, growAreas, recordAction, onUpdatePosition]);

  return {
    dragStartPosRef,
    handleGrowAreaDragStart,
    handleGrowAreaDragEnd,
    handleGrowAreaResize,
    handleGrowAreaRotate,
    handleGrowAreaSelect,
    handleGrowAreaDoubleClick,
    handleUpdateGrowAreaProperties,
    handleMoveGrowArea,
  };
}
