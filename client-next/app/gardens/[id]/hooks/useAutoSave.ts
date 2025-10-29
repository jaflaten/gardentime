'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number; // Debounce delay in ms (default: 800)
}

export function useAutoSave({ onSave, delay = 800 }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<any>(null);
  const isSavingRef = useRef(false);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    if (!pendingDataRef.current || isSavingRef.current) return;

    const dataToSave = pendingDataRef.current;
    pendingDataRef.current = null;
    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave(dataToSave);
      setStatus('saved');
      setError(null);
      
      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err as Error);
      // Keep pending data in case user wants to retry
      pendingDataRef.current = dataToSave;
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const scheduleSave = useCallback((data: any) => {
    // Store the data
    pendingDataRef.current = data;
    setStatus('pending');

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);
  }, [delay, save]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  const retry = useCallback(() => {
    if (status === 'error' && pendingDataRef.current) {
      save();
    }
  }, [status, save]);

  return {
    status,
    error,
    scheduleSave,
    saveNow,
    retry,
  };
}
