'use client';

import React from 'react';
import { CanvasObject } from '@/lib/api';

interface ShapePropertiesPanelProps {
  selectedObject: CanvasObject | null;
  onUpdate: (updates: Partial<CanvasObject>) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
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

export default function ShapePropertiesPanel({
  selectedObject,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}: ShapePropertiesPanelProps) {
  if (!selectedObject) return null;

  const handleColorChange = (field: 'fillColor' | 'strokeColor', value: string) => {
    onUpdate({ [field]: value });
  };

  const handleNumberChange = (field: keyof CanvasObject, value: number) => {
    onUpdate({ [field]: value });
  };

  const handleLockToggle = () => {
    onUpdate({ locked: !selectedObject.locked });
  };

  const handleBringForward = () => {
    onUpdate({ zIndex: (selectedObject.zIndex || 0) + 1 });
  };

  const handleSendBackward = () => {
    onUpdate({ zIndex: Math.max(0, (selectedObject.zIndex || 0) - 1) });
  };

  const handleBringToFront = () => {
    onUpdate({ zIndex: (selectedObject.zIndex || 0) + 10 });
  };

  const handleSendToBack = () => {
    onUpdate({ zIndex: 0 });
  };

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Properties</h3>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            {selectedObject.type}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close properties panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6">

        {/* Fill Color */}
        {(selectedObject.type === 'RECTANGLE' || selectedObject.type === 'CIRCLE') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fill Color
            </label>
            
            {/* Color presets */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange('fillColor', color)}
                  className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                    selectedObject.fillColor === color
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* Custom color picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.fillColor || '#ffffff'}
                onChange={(e) => handleColorChange('fillColor', e.target.value)}
                className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={selectedObject.fillColor || '#ffffff'}
                onChange={(e) => handleColorChange('fillColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#ffffff"
              />
              <button
                onClick={() => handleColorChange('fillColor', 'transparent')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Make transparent"
              >
                None
              </button>
            </div>
          </div>
        )}

        {/* Stroke Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Color
          </label>
          
          {/* Color presets */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange('strokeColor', color)}
                className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                  selectedObject.strokeColor === color
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Custom color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedObject.strokeColor || '#000000'}
              onChange={(e) => handleColorChange('strokeColor', e.target.value)}
              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={selectedObject.strokeColor || '#000000'}
              onChange={(e) => handleColorChange('strokeColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stroke Width: {selectedObject.strokeWidth || 2}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={selectedObject.strokeWidth || 2}
            onChange={(e) => handleNumberChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1px</span>
            <span>20px</span>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((selectedObject.opacity || 1) * 100)}
            onChange={(e) => handleNumberChange('opacity', parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Line Style (for lines and arrows) */}
        {(selectedObject.type === 'LINE' || selectedObject.type === 'ARROW') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Line Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdate({ dash: undefined })}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  !selectedObject.dash
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => onUpdate({ dash: JSON.stringify([5, 5]) })}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedObject.dash === JSON.stringify([5, 5])
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dashed
              </button>
              <button
                onClick={() => onUpdate({ dash: JSON.stringify([2, 2]) })}
                className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                  selectedObject.dash === JSON.stringify([2, 2])
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dotted
              </button>
            </div>
          </div>
        )}

        {/* Lock/Unlock */}
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {selectedObject.locked ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {selectedObject.locked ? 'Locked' : 'Unlocked'}
            </span>
          </div>
          <button
            onClick={handleLockToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              selectedObject.locked ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                selectedObject.locked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Z-Index Controls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Layer Order
          </label>
          <div className="space-y-2">
            {/* Step forward/backward */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendBackward}
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-400 rounded-md hover:bg-gray-50 hover:border-gray-500 transition-colors text-sm font-semibold text-gray-800 flex items-center justify-center gap-1.5"
                title="Send backward one layer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Back</span>
              </button>
              <div className="px-3 py-2 bg-gray-100 border-2 border-gray-300 rounded text-sm font-bold text-gray-800 text-center min-w-[60px]">
                {selectedObject.zIndex || 0}
              </div>
              <button
                onClick={handleBringForward}
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-400 rounded-md hover:bg-gray-50 hover:border-gray-500 transition-colors text-sm font-semibold text-gray-800 flex items-center justify-center gap-1.5"
                title="Bring forward one layer"
              >
                <span>Front</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
            
            {/* Jump to front/back */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendToBack}
                className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                title="Send to back (z-index 0)"
              >
                Send to Back
              </button>
              <button
                onClick={handleBringToFront}
                className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                title="Bring to front"
              >
                Bring to Front
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Actions */}
        <div className="space-y-2">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Shape
          </button>
        </div>
      </div>
    </div>
  );
}
