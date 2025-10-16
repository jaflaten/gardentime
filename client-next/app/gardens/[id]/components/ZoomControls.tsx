import React from 'react';

interface ZoomControlsProps {
  scale: number;
  currentZoomPercent: number;
  onZoomChange: (zoomPercent: number) => void;
  onFitToView: () => void;
}

export default function ZoomControls({
  scale,
  currentZoomPercent,
  onZoomChange,
  onFitToView,
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
    </div>
  );
}

