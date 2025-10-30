'use client';

import { GardenCapacityWidget as CapacityData } from '@/types/dashboard';

interface Props {
  data: CapacityData;
}

export default function GardenCapacityWidget({ data }: Props) {
  const getCapacityColor = (percent: number) => {
    if (percent < 50) return 'bg-blue-500';
    if (percent < 75) return 'bg-green-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getCapacityTextColor = (percent: number) => {
    if (percent < 50) return 'text-blue-600';
    if (percent < 75) return 'text-green-600';
    if (percent < 90) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getRecommendation = () => {
    const percent = data.utilizationPercent;
    const emptyCount = data.emptyGrowAreas.length;
    const crowdedCount = data.crowdedGrowAreas.length;

    if (crowdedCount > 0) {
      return {
        icon: '⚠️',
        text: `${crowdedCount} area${crowdedCount > 1 ? 's are' : ' is'} crowded with too many crops`,
        color: 'text-orange-600'
      };
    }

    if (emptyCount > 0) {
      return {
        icon: '🌱',
        text: `You have ${emptyCount} empty area${emptyCount > 1 ? 's' : ''} ready for planting`,
        color: 'text-blue-600'
      };
    }

    if (percent >= 90) {
      return {
        icon: '🎯',
        text: 'Your garden is at full capacity!',
        color: 'text-green-600'
      };
    }

    return {
      icon: '✅',
      text: 'Your garden has good space utilization',
      color: 'text-green-600'
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Garden Capacity</h3>
      </div>

      {/* Utilization Percentage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Space Utilization</span>
          <span className={`text-2xl font-bold ${getCapacityTextColor(data.utilizationPercent)}`}>
            {Math.round(data.utilizationPercent)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(data.utilizationPercent)}`}
            style={{ width: `${Math.min(data.utilizationPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Areas</p>
          <p className="text-xl font-bold text-gray-900">{data.totalGrowAreas}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <p className="text-xs text-green-600 mb-1">In Use</p>
          <p className="text-xl font-bold text-green-700">{data.inUseGrowAreas}</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-3 bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="flex items-start gap-2">
          <span className="text-lg">{recommendation.icon}</span>
          <p className={`text-sm ${recommendation.color} flex-1`}>
            {recommendation.text}
          </p>
        </div>
      </div>

      {/* Empty Areas List (if any) */}
      {data.emptyGrowAreas.length > 0 && data.emptyGrowAreas.length <= 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Empty Areas:</p>
          <div className="flex flex-wrap gap-2">
            {data.emptyGrowAreas.map((area) => (
              <span
                key={area}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Crowded Areas Warning (if any) */}
      {data.crowdedGrowAreas.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">⚠️ Crowded Areas:</p>
          <div className="flex flex-wrap gap-2">
            {data.crowdedGrowAreas.map((area) => (
              <span
                key={area}
                className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded border border-orange-200"
              >
                {area}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Consider spacing plants further apart or harvesting some crops
          </p>
        </div>
      )}
    </div>
  );
}
