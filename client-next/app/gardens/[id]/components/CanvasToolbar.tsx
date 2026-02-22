'use client';

import React from 'react';
import ZoomControls from './ZoomControls';
import ViewOptions from './ViewOptions';
import { GrowArea } from '@/lib/api';

interface CanvasToolbarProps {
  // Zoom controls
  scale: number;
  currentZoomPercent: number;
  onZoomChange: (value: number) => void;
  onFitToView: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  // View options
  onGridToggle: (show: boolean) => void;
  selectedIds: Set<string>;
  selectedObjectIds: Set<number>;
  growAreas: GrowArea[];
  // Mini-map and help
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  onShowShortcuts: () => void;
}

export default function CanvasToolbar({
  scale,
  currentZoomPercent,
  onZoomChange,
  onFitToView,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onGridToggle,
  selectedIds,
  selectedObjectIds,
  growAreas,
  showMiniMap,
  onToggleMiniMap,
  onShowShortcuts,
}: CanvasToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <ZoomControls
        scale={scale}
        currentZoomPercent={currentZoomPercent}
        onZoomChange={onZoomChange}
        onFitToView={onFitToView}
        showGrid={showGrid}
        onToggleGrid={onToggleGrid}
        snapToGrid={snapToGrid}
        onToggleSnap={onToggleSnap}
      />

      <ViewOptions
        showGrid={showGrid}
        onGridToggle={onGridToggle}
        selectedIds={selectedIds}
        selectedObjectIds={selectedObjectIds}
        growAreas={growAreas}
      />

      {/* Help and Mini-map buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMiniMap}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            showMiniMap ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
          }`}
          title="Toggle Mini-map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
        <button
          onClick={onShowShortcuts}
          className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Keyboard Shortcuts (?)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
