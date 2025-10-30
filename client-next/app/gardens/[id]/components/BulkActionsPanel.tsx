'use client';

import React, { useState } from 'react';
import { CanvasObject } from '@/lib/api';

interface BulkActionsPanelProps {
  selectedCount: number;
  selectedObjects: CanvasObject[];
  onBulkUpdate: (updates: Partial<CanvasObject>) => void;
  onBulkDelete: () => void;
  onClose: () => void;
}

// Color presets for quick selection
const COLOR_PRESETS = [
  '#000000', // Black
  '#ffffff', // White
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Gray
];

export default function BulkActionsPanel({
  selectedCount,
  selectedObjects,
  onBulkUpdate,
  onBulkDelete,
  onClose,
}: BulkActionsPanelProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const handleBulkColorChange = (fillColor: string) => {
    onBulkUpdate({ fillColor });
    setShowColorPicker(false);
  };

  const handleBulkStrokeChange = (strokeColor: string) => {
    onBulkUpdate({ strokeColor });
    setShowStrokePicker(false);
  };

  const handleBulkOpacityChange = (opacity: number) => {
    onBulkUpdate({ opacity });
  };

  const handleBulkStrokeWidthChange = (strokeWidth: number) => {
    onBulkUpdate({ strokeWidth });
  };

  const handleBringToFront = () => {
    // Get max zIndex of all selected objects and add 10
    const maxZ = Math.max(...selectedObjects.map(obj => obj.zIndex || 0), 0);
    onBulkUpdate({ zIndex: maxZ + 10 });
  };

  const handleSendToBack = () => {
    onBulkUpdate({ zIndex: 0 });
  };

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Bulk Actions</h3>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            {selectedCount} selected
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close bulk actions panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Fill Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fill Color
          </label>
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowStrokePicker(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Change fill color</span>
              <div className="w-6 h-6 rounded border border-gray-300 bg-gradient-to-br from-red-500 via-blue-500 to-green-500"></div>
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleBulkColorChange(color)}
                      className="w-10 h-10 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Color
          </label>
          <div className="relative">
            <button
              onClick={() => {
                setShowStrokePicker(!showStrokePicker);
                setShowColorPicker(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">Change stroke color</span>
              <div className="w-6 h-6 rounded border border-gray-300 bg-gradient-to-br from-red-500 via-blue-500 to-green-500"></div>
            </button>
            
            {showStrokePicker && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleBulkStrokeChange(color)}
                      className="w-10 h-10 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="1"
            onChange={(e) => handleBulkOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Width
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            defaultValue="2"
            onChange={(e) => handleBulkStrokeWidthChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Layer Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Layer Order
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBringToFront}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-800 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              To Front
            </button>
            <button
              onClick={handleSendToBack}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-800 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              To Back
            </button>
          </div>
        </div>

        {/* Delete */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onBulkDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete {selectedCount} Items
          </button>
        </div>
      </div>
    </div>
  );
}
