'use client';

import React, { useState } from 'react';
import { GrowArea } from '@/lib/api';

interface GrowAreaPropertiesPanelProps {
  selectedGrowArea: GrowArea;
  onUpdate: (updates: Partial<GrowArea>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

// Color presets for grow areas
const COLOR_PRESETS = [
  '#3b82f6', // Blue (BOX default)
  '#22c55e', // Green (FIELD default)
  '#92400e', // Brown (BED default)
  '#6b7280', // Gray (BUCKET default)
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#eab308', // Yellow
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

export default function GrowAreaPropertiesPanel({
  selectedGrowArea,
  onUpdate,
  onDelete,
  onClose,
}: GrowAreaPropertiesPanelProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = (color: string) => {
    onUpdate({ customColor: color } as Partial<GrowArea>);
    setShowColorPicker(false);
  };

  const handleResetColor = () => {
    onUpdate({ customColor: undefined } as Partial<GrowArea>);
  };

  // Get current color (custom or default based on zone type)
  const getCurrentColor = () => {
    if ((selectedGrowArea as any).customColor) {
      return (selectedGrowArea as any).customColor;
    }
    
    const typeColors: Record<string, string> = {
      'BOX': '#3b82f6',
      'FIELD': '#22c55e',
      'BED': '#92400e',
      'BUCKET': '#6b7280',
    };
    
    return selectedGrowArea.zoneType ? typeColors[selectedGrowArea.zoneType] : '#3b82f6';
  };

  const currentColor = getCurrentColor();
  const hasCustomColor = !!(selectedGrowArea as any).customColor;

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Grow Area</h3>
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            {selectedGrowArea.zoneType || 'BOX'}
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

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-900 font-medium">{selectedGrowArea.name}</p>
          </div>
        </div>

        {/* Color */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            {hasCustomColor && (
              <button
                onClick={handleResetColor}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Reset to default
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
            >
              <span className="text-sm text-gray-700">
                {hasCustomColor ? 'Custom color' : 'Default color'}
              </span>
              <div
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: currentColor }}
              ></div>
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-10 h-10 rounded border-2 transition-colors ${
                        color === currentColor
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-900">
              {selectedGrowArea.width || 100} × {selectedGrowArea.length || 100} cm
              {selectedGrowArea.height && ` × ${selectedGrowArea.height} cm`}
            </p>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotation: {Math.round(selectedGrowArea.rotation || 0)}°
          </label>
          <div className="space-y-3">
            {/* Rotation slider */}
            <input
              type="range"
              min="0"
              max="360"
              step="22.5"
              value={selectedGrowArea.rotation || 0}
              onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0°</span>
              <span>90°</span>
              <span>180°</span>
              <span>270°</span>
              <span>360°</span>
            </div>
            
            {/* Rotation increment buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const current = selectedGrowArea.rotation || 0;
                  const newRotation = ((current - 22.5) % 360 + 360) % 360;
                  onUpdate({ rotation: newRotation });
                }}
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                ↺ Rotate Left
              </button>
              <button
                onClick={() => {
                  const current = selectedGrowArea.rotation || 0;
                  const newRotation = (current + 22.5) % 360;
                  onUpdate({ rotation: newRotation });
                }}
                className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Rotate Right ↻
              </button>
            </div>
            
            {/* Quick rotation presets */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => onUpdate({ rotation: 0 })}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                  (selectedGrowArea.rotation || 0) === 0
                    ? 'bg-green-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                0°
              </button>
              <button
                onClick={() => onUpdate({ rotation: 90 })}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                  (selectedGrowArea.rotation || 0) === 90
                    ? 'bg-green-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                90°
              </button>
              <button
                onClick={() => onUpdate({ rotation: 180 })}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                  (selectedGrowArea.rotation || 0) === 180
                    ? 'bg-green-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                180°
              </button>
              <button
                onClick={() => onUpdate({ rotation: 270 })}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                  (selectedGrowArea.rotation || 0) === 270
                    ? 'bg-green-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                270°
              </button>
            </div>
          </div>
        </div>

        {/* Zone Size */}
        {selectedGrowArea.zoneSize && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone Size
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-900">{selectedGrowArea.zoneSize}</p>
            </div>
          </div>
        )}

        {/* Number of Rows */}
        {selectedGrowArea.nrOfRows && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rows
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-900">{selectedGrowArea.nrOfRows}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedGrowArea.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">{selectedGrowArea.notes}</p>
            </div>
          </div>
        )}

        {/* Current Crops */}
        {selectedGrowArea.currentCrops && selectedGrowArea.currentCrops.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Crops
            </label>
            <div className="space-y-2">
              {selectedGrowArea.currentCrops.map((crop, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-900">{crop.plantName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{crop.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Button */}
        {onDelete && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Grow Area
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
