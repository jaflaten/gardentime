'use client';

import { GardenSummary } from '@/types/dashboard';

interface GardenSummaryCardProps {
  summary: GardenSummary;
}

export default function GardenSummaryCard({ summary }: GardenSummaryCardProps) {
  const formatArea = (areaCm2: number | null) => {
    if (!areaCm2) return 'N/A';
    // Convert cm² to m²
    const areaM2 = areaCm2 / 10000;
    return `${areaM2.toFixed(2)} m²`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{summary.gardenName}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📦</span>
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{summary.totalGrowAreas}</div>
          <div className="text-xs text-gray-500 mt-1">Grow Areas</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🌱</span>
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{summary.activeGrowAreas}</div>
          <div className="text-xs text-gray-500 mt-1">In Use</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📏</span>
            <span className="text-sm text-gray-600">Area</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatArea(summary.totalAreaCm2)}</div>
          <div className="text-xs text-gray-500 mt-1">Total Space</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📅</span>
            <span className="text-sm text-gray-600">Activity</span>
          </div>
          <div className="text-sm font-semibold text-gray-800">{formatDate(summary.lastActivityDate)}</div>
          <div className="text-xs text-gray-500 mt-1">Last Update</div>
        </div>
      </div>
    </div>
  );
}
