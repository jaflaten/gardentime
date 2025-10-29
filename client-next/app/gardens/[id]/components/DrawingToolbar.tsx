'use client';

import React from 'react';

export type DrawingTool = 'SELECT' | 'PAN' | 'RECTANGLE' | 'CIRCLE' | 'LINE' | 'ARROW' | 'TEXT' | 'FREEHAND';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onAddGrowArea?: () => void;
  brushSize?: number;
  onBrushSizeChange?: (size: number) => void;
}

const tools: { id: DrawingTool; label: string; icon: string; help: string; shortcut: string }[] = [
  { id: 'SELECT', label: 'Select', icon: '🖱️', help: 'Select and move objects', shortcut: '1' },
  { id: 'PAN', label: 'Pan', icon: '✋', help: 'Pan the canvas', shortcut: '2' },
  { id: 'RECTANGLE', label: 'Rectangle', icon: '▭', help: 'Draw rectangles (hold Shift for squares)', shortcut: '3' },
  { id: 'CIRCLE', label: 'Circle', icon: '○', help: 'Draw circles', shortcut: '4' },
  { id: 'LINE', label: 'Line', icon: '─', help: 'Draw lines (hold Shift for 45° angles)', shortcut: '5' },
  { id: 'ARROW', label: 'Arrow', icon: '→', help: 'Draw arrows (hold Shift for 45° angles)', shortcut: '6' },
  { id: 'TEXT', label: 'Text', icon: 'T', help: 'Add text', shortcut: '7' },
  { id: 'FREEHAND', label: 'Freehand', icon: '✏️', help: 'Freehand drawing', shortcut: '8' },
];

export default function DrawingToolbar({ activeTool, onToolChange, onAddGrowArea, brushSize = 3, onBrushSizeChange }: DrawingToolbarProps) {
  const activeToolInfo = tools.find(t => t.id === activeTool);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Drawing Tools */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Tools:</span>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTool === tool.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`${tool.help} (Press ${tool.shortcut})`}
            >
              <span className="mr-1">{tool.icon}</span>
              {tool.label}
              <span className={`ml-2 text-xs ${activeTool === tool.id ? 'opacity-75' : 'opacity-50'}`}>
                {tool.shortcut}
              </span>
            </button>
          ))}
        </div>

        {/* Brush Size Selector (for Freehand tool) */}
        {activeTool === 'FREEHAND' && onBrushSizeChange && (
          <>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Brush Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 w-8 text-right">{brushSize}px</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300" />

        {/* Add Grow Area Button */}
        {onAddGrowArea && (
          <button
            onClick={onAddGrowArea}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add Grow Area
          </button>
        )}

        {/* Active Tool Help Text */}
        {activeToolInfo && (
          <div className="ml-auto text-sm text-gray-600 italic">
            {activeToolInfo.help}
          </div>
        )}
      </div>
    </div>
  );
}
