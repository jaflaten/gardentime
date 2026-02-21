'use client';

import { useCallback, useRef, useEffect } from 'react';
import { growAreaService, UpdateGrowAreaRequest } from '@/lib/api';

interface PendingUpdate {
  id: string;
  updates: UpdateGrowAreaRequest;
  timestamp: number;
}

/**
 * Hook for debouncing grow area updates to reduce API calls.
 * Batches multiple updates to the same grow area and flushes after delay.
 */
export function useGrowAreaSaver(delay = 500) {
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    if (updates.length === 0) return;

    // Process all updates in parallel
    const promises = updates.map(({ id, updates: data }) =>
      growAreaService.update(id, data).catch((error) => {
        console.error(`Failed to save grow area ${id}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }, []);

  const scheduleUpdate = useCallback((id: string, updates: UpdateGrowAreaRequest) => {
    // Merge with existing pending updates for this grow area
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

    // Schedule flush after delay
    timeoutRef.current = setTimeout(flushUpdates, delay);
  }, [delay, flushUpdates]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return flushUpdates();
  }, [flushUpdates]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Sync flush on unmount
      const updates = Array.from(pendingUpdatesRef.current.values());
      if (updates.length > 0) {
        updates.forEach(({ id, updates: data }) => {
          growAreaService.update(id, data).catch(console.error);
        });
      }
    };
  }, []);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Use sendBeacon for reliable unload saves
      const updates = Array.from(pendingUpdatesRef.current.values());
      updates.forEach(({ id, updates: data }) => {
        // Fallback to sync save attempt
        growAreaService.update(id, data).catch(() => {});
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { scheduleUpdate, saveNow };
}
