import React from 'react';

interface ZoomControlsProps {
  scale: number;
  currentZoomPercent: number;
  onZoomChange: (zoomPercent: number) => void;
  onFitToView: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
}

export default function ZoomControls({
  scale,
  currentZoomPercent,
  onZoomChange,
  onFitToView,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Zoom:</span>
      <div className="flex gap-2">
        <button
          onClick={() => onZoomChange(50)}
          className={`px-3 py-1 text-sm rounded ${
            Math.abs(scale - 0.5) < 0.01
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          50%
        </button>
        <button
          onClick={() => onZoomChange(100)}
          className={`px-3 py-1 text-sm rounded ${
            Math.abs(scale - 1) < 0.01
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          100%
        </button>
        <button
          onClick={() => onZoomChange(200)}
          className={`px-3 py-1 text-sm rounded ${
            Math.abs(scale - 2) < 0.01
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          200%
        </button>
        <button
          onClick={onFitToView}
          className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Fit to View
        </button>
      </div>
      <div className="text-sm font-medium text-green-600">
        {currentZoomPercent}%
      </div>
      
      <div className="h-6 w-px bg-gray-300" />
      
      {/* Grid and Snap Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleGrid}
          className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${
            showGrid
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Toggle grid visibility (G)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          Grid
        </button>
        
        <button
          onClick={onToggleSnap}
          className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${
            snapToGrid
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Snap objects to grid (⌘/Ctrl+Shift+G)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Snap
        </button>
      </div>
    </div>
  );
}

