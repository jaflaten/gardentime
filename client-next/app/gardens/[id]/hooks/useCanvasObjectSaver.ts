'use client';

import { useCallback, useRef } from 'react';
import { CanvasObject, canvasObjectService } from '@/lib/api';

interface PendingUpdate {
  id: number;
  updates: Partial<CanvasObject>;
  timestamp: number;
}

export function useCanvasObjectSaver(delay = 800) {
  const pendingUpdatesRef = useRef<Map<number, PendingUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    if (updates.length === 0) return;

    // Process updates sequentially but quickly
    const promises = updates.map(({ id, updates: data }) =>
      canvasObjectService.update(id, data).catch((error) => {
        console.error(`Failed to save canvas object ${id}:`, error);
        // Re-add to pending updates for retry
        pendingUpdatesRef.current.set(id, { id, updates: data, timestamp: Date.now() });
        throw error;
      })
    );

    await Promise.allSettled(promises);
  }, []);

  const scheduleUpdate = useCallback((id: number, updates: Partial<CanvasObject>) => {
    // Merge with existing pending updates for this object
    const existing = pendingUpdatesRef.current.get(id);
    const mergedUpdates = existing 
      ? { ...existing.updates, ...updates }
      : updates;

    pendingUpdatesRef.current.set(id, {
      id,
      updates: mergedUpdates,
      timestamp: Date.now(),
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule flush
    timeoutRef.current = setTimeout(() => {
      flushUpdates();
    }, delay);
  }, [delay, flushUpdates]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return flushUpdates();
  }, [flushUpdates]);

  return {
    scheduleUpdate,
    saveNow,
  };
}
