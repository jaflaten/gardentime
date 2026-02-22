'use client';

import { useCallback, useState } from 'react';
import { CanvasObject, canvasObjectService } from '@/lib/api';

interface UseCanvasObjectOperationsProps {
  canvasObjects: CanvasObject[];
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObject[]>>;
  selectedObjectId: number | null;
  setSelectedObjectId: (id: number | null) => void;
  selectedObjectIds: Set<number>;
  clearSelection: () => void;
  recordAction: (action: any) => void;
  scheduleCanvasObjectSave: (id: number, updates: Partial<CanvasObject>) => void;
}

export function useCanvasObjectOperations({
  canvasObjects,
  setCanvasObjects,
  selectedObjectId,
  setSelectedObjectId,
  selectedObjectIds,
  clearSelection,
  recordAction,
  scheduleCanvasObjectSave,
}: UseCanvasObjectOperationsProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: number } | null>(null);

  // Delete selected canvas object
  const deleteSelectedObject = useCallback(async () => {
    if (!selectedObjectId) return;

    const objectToDelete = canvasObjects.find((obj) => obj.id === selectedObjectId);
    if (!objectToDelete) return;

    try {
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
  }, [selectedObjectId, canvasObjects, recordAction, setCanvasObjects, setSelectedObjectId]);

  // Duplicate selected canvas object
  const duplicateSelectedObject = useCallback(async () => {
    if (!selectedObjectId) return;

    const objectToDuplicate = canvasObjects.find((obj) => obj.id === selectedObjectId);
    if (!objectToDuplicate) return;

    try {
      const { id, ...objectData } = objectToDuplicate;
      const duplicatedObject = await canvasObjectService.create({
        ...objectData,
        x: objectToDuplicate.x + 20,
        y: objectToDuplicate.y + 20,
        zIndex: (objectToDuplicate.zIndex || 0) + 1,
      });

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
  }, [selectedObjectId, canvasObjects, recordAction, setCanvasObjects, setSelectedObjectId]);

  // Bulk update for multi-selected objects
  const handleBulkUpdate = useCallback(async (updates: Partial<CanvasObject>) => {
    if (selectedObjectIds.size === 0) return;

    const objectsToUpdate = canvasObjects.filter(obj => selectedObjectIds.has(obj.id));

    try {
      setCanvasObjects((prev) =>
        prev.map((obj) =>
          selectedObjectIds.has(obj.id) ? { ...obj, ...updates } : obj
        )
      );

      for (const obj of objectsToUpdate) {
        scheduleCanvasObjectSave(obj.id, updates);
      }
    } catch (error) {
      console.error('Failed to update objects:', error);
      alert('Failed to update shapes. Please try again.');
    }
  }, [selectedObjectIds, canvasObjects, setCanvasObjects, scheduleCanvasObjectSave]);

  // Bulk delete for multi-selected objects
  const handleBulkDelete = useCallback(async () => {
    if (selectedObjectIds.size === 0) return;

    const objectsToDelete = canvasObjects.filter(obj => selectedObjectIds.has(obj.id));

    try {
      for (const obj of objectsToDelete) {
        recordAction({
          type: 'DELETE_OBJECT',
          object: obj,
        });
      }

      for (const obj of objectsToDelete) {
        await canvasObjectService.delete(obj.id);
      }

      setCanvasObjects((prev) => prev.filter((obj) => !selectedObjectIds.has(obj.id)));
      clearSelection();
    } catch (error) {
      console.error('Failed to delete objects:', error);
      alert('Failed to delete shapes. Please try again.');
    }
  }, [selectedObjectIds, canvasObjects, recordAction, setCanvasObjects, clearSelection]);

  // Update canvas object properties
  const handleUpdateObjectProperties = useCallback(async (updates: Partial<CanvasObject>) => {
    if (!selectedObjectId) return;

    setCanvasObjects((prev) =>
      prev.map((obj) => (obj.id === selectedObjectId ? { ...obj, ...updates } : obj))
    );

    setSaveStatus('pending');
    scheduleCanvasObjectSave(selectedObjectId, updates);
    setTimeout(() => setSaveStatus('saving'), 100);
    setTimeout(() => setSaveStatus('saved'), 900);
    setTimeout(() => setSaveStatus('idle'), 2900);
  }, [selectedObjectId, setCanvasObjects, scheduleCanvasObjectSave]);

  // Context menu handlers
  const handleBringToFront = useCallback(() => {
    if (!contextMenu) return;
    const maxZIndex = Math.max(...canvasObjects.map(obj => obj.zIndex || 0), 0);
    handleUpdateObjectProperties({ zIndex: maxZIndex + 1 });
  }, [contextMenu, canvasObjects, handleUpdateObjectProperties]);

  const handleBringForward = useCallback(() => {
    if (!contextMenu) return;
    const obj = canvasObjects.find(o => o.id === contextMenu.objectId);
    handleUpdateObjectProperties({ zIndex: (obj?.zIndex || 0) + 1 });
  }, [contextMenu, canvasObjects, handleUpdateObjectProperties]);

  const handleSendBackward = useCallback(() => {
    if (!contextMenu) return;
    const obj = canvasObjects.find(o => o.id === contextMenu.objectId);
    handleUpdateObjectProperties({ zIndex: Math.max(0, (obj?.zIndex || 0) - 1) });
  }, [contextMenu, canvasObjects, handleUpdateObjectProperties]);

  const handleSendToBack = useCallback(() => {
    if (!contextMenu) return;
    handleUpdateObjectProperties({ zIndex: 0 });
  }, [contextMenu, handleUpdateObjectProperties]);

  // Move selected canvas object with arrow keys
  const handleMoveObject = useCallback((dx: number, dy: number) => {
    if (!selectedObjectId) return;

    const obj = canvasObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;

    const newX = obj.x + dx;
    const newY = obj.y + dy;

    recordAction({
      type: 'UPDATE_OBJECT',
      objectId: obj.id,
      before: { x: obj.x, y: obj.y },
      after: { x: newX, y: newY },
    });

    setCanvasObjects((prev) =>
      prev.map((o) => (o.id === selectedObjectId ? { ...o, x: newX, y: newY } : o))
    );
    scheduleCanvasObjectSave(selectedObjectId, { x: newX, y: newY });
  }, [selectedObjectId, canvasObjects, recordAction, setCanvasObjects, scheduleCanvasObjectSave]);

  return {
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
  };
}
