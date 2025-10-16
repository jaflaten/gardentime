import { useEffect } from 'react';
import { DrawingTool } from '../components/DrawingToolbar';

interface UseKeyboardShortcutsProps {
  selectedObjectId: number | null;
  onDeleteObject: () => void;
  onSetActiveTool: (tool: DrawingTool) => void;
  onCancelDrawing: () => void;
}

export function useKeyboardShortcuts({
  selectedObjectId,
  onDeleteObject,
  onSetActiveTool,
  onCancelDrawing,
}: UseKeyboardShortcutsProps) {
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
          onDeleteObject();
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
  }, [selectedObjectId, onDeleteObject, onSetActiveTool, onCancelDrawing]);
}

