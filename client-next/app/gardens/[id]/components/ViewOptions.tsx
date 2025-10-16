import React from 'react';
import { GrowArea } from '@/lib/api';

interface ViewOptionsProps {
  showGrid: boolean;
  onGridToggle: (show: boolean) => void;
  selectedIds: Set<string>;
  selectedObjectIds: Set<number>;
  growAreas: GrowArea[];
}

export default function ViewOptions({
  showGrid,
  onGridToggle,
  selectedIds,
  selectedObjectIds,
  growAreas,
}: ViewOptionsProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(e) => onGridToggle(e.target.checked)}
          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
        />
        <span className="text-sm text-gray-700">Show Grid</span>
      </label>

      {/* Multi-selection indicator */}
      {(selectedIds.size > 1 || selectedObjectIds.size > 1) && (
        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
          {selectedIds.size + selectedObjectIds.size} items selected
        </div>
      )}

      <div className="text-sm text-gray-600">
        {growAreas.filter(a => a.positionX !== undefined).length} / {growAreas.length} areas placed
      </div>
    </div>
  );
}

