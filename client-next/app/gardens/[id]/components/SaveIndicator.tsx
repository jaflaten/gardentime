'use client';

import React from 'react';

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
}

export default function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg bg-white border border-gray-200 transition-all">
      {status === 'pending' && (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-sm text-gray-600">Changes pending...</span>
        </>
      )}
      
      {status === 'saving' && (
        <>
          <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-600 font-medium">Saving...</span>
        </>
      )}
      
      {status === 'saved' && (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-600 font-medium">Saved</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600 font-medium">Save failed</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
