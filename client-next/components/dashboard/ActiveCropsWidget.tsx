'use client';

import { ActiveCropsWidget } from '@/types/dashboard';

interface ActiveCropsWidgetProps {
  data: ActiveCropsWidget;
}

export default function ActiveCropsWidgetComponent({ data }: ActiveCropsWidgetProps) {
  const getPercentage = (value: number) => {
    if (data.total === 0) return 0;
    return Math.round((value / data.total) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="text-xl mr-2">🌿</span>
        Active Crops
      </h3>

      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-green-600">{data.total}</div>
        <div className="text-sm text-gray-500">Total Active</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
            <span className="text-sm text-gray-700">Planted</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">{data.planted}</span>
            <span className="text-xs text-gray-500">({getPercentage(data.planted)}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm text-gray-700">Growing</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">{data.growing}</span>
            <span className="text-xs text-gray-500">({getPercentage(data.growing)}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-sm text-gray-700">Ready Soon</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">{data.readyToHarvest}</span>
            <span className="text-xs text-gray-500">({getPercentage(data.readyToHarvest)}%)</span>
          </div>
        </div>
      </div>

      {data.total === 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">No active crops yet</p>
          <p className="text-xs text-gray-500 mt-1">Start planting to see statistics</p>
        </div>
      )}
    </div>
  );
}
