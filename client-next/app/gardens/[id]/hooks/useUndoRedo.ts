'use client';

import { useCallback, useRef, useState } from 'react';
import { CanvasObject, GrowArea } from '@/lib/api';

// Types for different actions
type ActionType = 
  | 'CREATE_OBJECT'
  | 'UPDATE_OBJECT'
  | 'DELETE_OBJECT'
  | 'MOVE_GROW_AREA'
  | 'RESIZE_GROW_AREA'
  | 'BATCH_MOVE';

interface BaseAction {
  type: ActionType;
  timestamp: number;
}

interface CreateObjectAction extends BaseAction {
  type: 'CREATE_OBJECT';
  object: CanvasObject;
}

interface UpdateObjectAction extends BaseAction {
  type: 'UPDATE_OBJECT';
  objectId: number;
  before: Partial<CanvasObject>;
  after: Partial<CanvasObject>;
}

interface DeleteObjectAction extends BaseAction {
  type: 'DELETE_OBJECT';
  object: CanvasObject;
}

interface MoveGrowAreaAction extends BaseAction {
  type: 'MOVE_GROW_AREA';
  areaId: string;
  before: { x: number; y: number };
  after: { x: number; y: number };
}

interface ResizeGrowAreaAction extends BaseAction {
  type: 'RESIZE_GROW_AREA';
  areaId: string;
  before: { width: number; height: number };
  after: { width: number; height: number };
}

interface BatchMoveAction extends BaseAction {
  type: 'BATCH_MOVE';
  moves: Array<{
    id: string;
    isGrowArea: boolean;
    before: { x: number; y: number };
    after: { x: number; y: number };
  }>;
}

type Action = 
  | CreateObjectAction 
  | UpdateObjectAction 
  | DeleteObjectAction
  | MoveGrowAreaAction
  | ResizeGrowAreaAction
  | BatchMoveAction;

// Input types for recordAction (without timestamp)
type CreateObjectInput = Omit<CreateObjectAction, 'timestamp'>;
type UpdateObjectInput = Omit<UpdateObjectAction, 'timestamp'>;
type DeleteObjectInput = Omit<DeleteObjectAction, 'timestamp'>;
type MoveGrowAreaInput = Omit<MoveGrowAreaAction, 'timestamp'>;
type ResizeGrowAreaInput = Omit<ResizeGrowAreaAction, 'timestamp'>;
type BatchMoveInput = Omit<BatchMoveAction, 'timestamp'>;

type ActionInput = 
  | CreateObjectInput 
  | UpdateObjectInput 
  | DeleteObjectInput
  | MoveGrowAreaInput
  | ResizeGrowAreaInput
  | BatchMoveInput;

interface UndoRedoCallbacks {
  onCreateObject?: (object: CanvasObject) => void;
  onUpdateObject?: (id: number, updates: Partial<CanvasObject>) => void;
  onDeleteObject?: (id: number) => void;
  onMoveGrowArea?: (id: string, x: number, y: number) => void;
  onResizeGrowArea?: (id: string, width: number, height: number) => void;
  onBatchMove?: (moves: Array<{ id: string; x: number; y: number; isGrowArea: boolean }>) => void;
}

const MAX_HISTORY = 50; // Maximum number of undo steps to keep

export function useUndoRedo(callbacks: UndoRedoCallbacks) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const undoStack = useRef<Action[]>([]);
  const redoStack = useRef<Action[]>([]);

  // Update can undo/redo flags
  const updateFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  // Record an action
  const recordAction = useCallback((action: ActionInput) => {
    const fullAction = { ...action, timestamp: Date.now() } as Action;
    
    undoStack.current.push(fullAction);
    
    // Limit history size
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    
    // Clear redo stack when new action is recorded
    redoStack.current = [];
    
    updateFlags();
  }, [updateFlags]);

  // Undo the last action
  const undo = useCallback(() => {
    const action = undoStack.current.pop();
    if (!action) return;

    switch (action.type) {
      case 'CREATE_OBJECT':
        // Undo create = delete
        callbacks.onDeleteObject?.(action.object.id);
        break;

      case 'UPDATE_OBJECT':
        // Undo update = apply before state
        callbacks.onUpdateObject?.(action.objectId, action.before);
        break;

      case 'DELETE_OBJECT':
        // Undo delete = recreate
        callbacks.onCreateObject?.(action.object);
        break;

      case 'MOVE_GROW_AREA':
        // Undo move = restore before position
        callbacks.onMoveGrowArea?.(action.areaId, action.before.x, action.before.y);
        break;

      case 'RESIZE_GROW_AREA':
        // Undo resize = restore before dimensions
        callbacks.onResizeGrowArea?.(action.areaId, action.before.width, action.before.height);
        break;

      case 'BATCH_MOVE':
        // Undo batch move = restore all before positions
        const undoMoves = action.moves.map(m => ({
          id: m.id,
          x: m.before.x,
          y: m.before.y,
          isGrowArea: m.isGrowArea,
        }));
        callbacks.onBatchMove?.(undoMoves);
        break;
    }

    redoStack.current.push(action);
    updateFlags();
  }, [callbacks, updateFlags]);

  // Redo the last undone action
  const redo = useCallback(() => {
    const action = redoStack.current.pop();
    if (!action) return;

    switch (action.type) {
      case 'CREATE_OBJECT':
        // Redo create = create
        callbacks.onCreateObject?.(action.object);
        break;

      case 'UPDATE_OBJECT':
        // Redo update = apply after state
        callbacks.onUpdateObject?.(action.objectId, action.after);
        break;

      case 'DELETE_OBJECT':
        // Redo delete = delete
        callbacks.onDeleteObject?.(action.object.id);
        break;

      case 'MOVE_GROW_AREA':
        // Redo move = restore after position
        callbacks.onMoveGrowArea?.(action.areaId, action.after.x, action.after.y);
        break;

      case 'RESIZE_GROW_AREA':
        // Redo resize = restore after dimensions
        callbacks.onResizeGrowArea?.(action.areaId, action.after.width, action.after.height);
        break;

      case 'BATCH_MOVE':
        // Redo batch move = restore all after positions
        const redoMoves = action.moves.map(m => ({
          id: m.id,
          x: m.after.x,
          y: m.after.y,
          isGrowArea: m.isGrowArea,
        }));
        callbacks.onBatchMove?.(redoMoves);
        break;
    }

    undoStack.current.push(action);
    updateFlags();
  }, [callbacks, updateFlags]);

  // Clear all history
  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    updateFlags();
  }, [updateFlags]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    recordAction,
  };
}
