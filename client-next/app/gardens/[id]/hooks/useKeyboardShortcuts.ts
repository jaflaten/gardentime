import { useEffect } from 'react';
import { DrawingTool } from '../components/DrawingToolbar';

interface UseKeyboardShortcutsProps {
  selectedObjectId: number | null;
  selectedGrowAreaId: string | null;
  onDeleteObject: () => void;
  onSetActiveTool: (tool: DrawingTool) => void;
  onCancelDrawing: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onMoveObject?: (dx: number, dy: number) => void;
  onMoveGrowArea?: (dx: number, dy: number) => void;
  onShowHelp?: () => void;
  onFitToView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function useKeyboardShortcuts({
  selectedObjectId,
  selectedGrowAreaId,
  onDeleteObject,
  onSetActiveTool,
  onCancelDrawing,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onMoveObject,
  onMoveGrowArea,
  onShowHelp,
  onFitToView,
  onZoomIn,
  onZoomOut,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Help modal (? or Shift+/)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }

      // Undo (Cmd/Ctrl + Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Copy (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Paste (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        onPaste?.();
        return;
      }

      // Duplicate (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Fit to view (Cmd/Ctrl + 0)
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        onFitToView?.();
        return;
      }

      // Zoom in (Cmd/Ctrl + +/=)
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // Zoom out (Cmd/Ctrl + -)
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      // Delete selected object (Delete or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedObjectId) {
          onDeleteObject();
        }
        return;
      }

      // Arrow keys - move selected object or grow area
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1; // Hold shift for larger steps
        
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        else if (e.key === 'ArrowDown') dy = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;
        
        if (selectedObjectId) {
          onMoveObject?.(dx, dy);
        } else if (selectedGrowAreaId) {
          onMoveGrowArea?.(dx, dy);
        }
        return;
      }

      // Escape - deselect and cancel drawing
      if (e.key === 'Escape') {
        onCancelDrawing();
        return;
      }

      // Number key shortcuts for tools (no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          onSetActiveTool('SELECT');
        } else if (e.key === '2') {
          e.preventDefault();
          onSetActiveTool('PAN');
        } else if (e.key === '3') {
          e.preventDefault();
          onSetActiveTool('RECTANGLE');
        } else if (e.key === '4') {
          e.preventDefault();
          onSetActiveTool('CIRCLE');
        } else if (e.key === '5') {
          e.preventDefault();
          onSetActiveTool('LINE');
        } else if (e.key === '6') {
          e.preventDefault();
          onSetActiveTool('ARROW');
        } else if (e.key === '7') {
          e.preventDefault();
          onSetActiveTool('TEXT');
        } else if (e.key === '8') {
          e.preventDefault();
          onSetActiveTool('FREEHAND');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedObjectId,
    selectedGrowAreaId,
    onDeleteObject,
    onSetActiveTool,
    onCancelDrawing,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onMoveObject,
    onMoveGrowArea,
    onShowHelp,
    onFitToView,
    onZoomIn,
    onZoomOut,
  ]);
}

