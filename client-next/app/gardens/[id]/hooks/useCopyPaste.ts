import { useState, useCallback } from 'react';
import { CanvasObject } from '@/lib/api';

interface UseCopyPasteProps {
  canvasObjects: CanvasObject[];
  selectedObjectId: number | null;
  onObjectCreated: (object: CanvasObject) => void;
}

interface CopiedObject {
  object: CanvasObject;
  timestamp: number;
}

export function useCopyPaste({
  canvasObjects,
  selectedObjectId,
  onObjectCreated,
}: UseCopyPasteProps) {
  const [copiedObject, setCopiedObject] = useState<CopiedObject | null>(null);

  const copySelectedObject = useCallback(() => {
    if (!selectedObjectId) return;

    const objectToCopy = canvasObjects.find((obj) => obj.id === selectedObjectId);
    if (!objectToCopy) return;

    setCopiedObject({
      object: objectToCopy,
      timestamp: Date.now(),
    });

    console.log('📋 Copied object:', objectToCopy.type);
  }, [selectedObjectId, canvasObjects]);

  const pasteObject = useCallback(async () => {
    if (!copiedObject) {
      console.log('📋 No object to paste');
      return;
    }

    try {
      const { id, ...objectData } = copiedObject.object;
      
      // Create a copy with offset position to avoid overlapping
      const pastedObject: Partial<CanvasObject> = {
        ...objectData,
        x: copiedObject.object.x + 20,
        y: copiedObject.object.y + 20,
        zIndex: (copiedObject.object.zIndex || 0) + 1,
      };

      // Call the creation handler which will save to backend
      onObjectCreated(pastedObject as CanvasObject);
      
      console.log('📋 Pasted object:', copiedObject.object.type);
    } catch (error) {
      console.error('Failed to paste object:', error);
    }
  }, [copiedObject, onObjectCreated]);

  return {
    copiedObject,
    copySelectedObject,
    pasteObject,
    hasCopiedObject: copiedObject !== null,
  };
}
