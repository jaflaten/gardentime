'use client';

import { RecentHarvestItem } from '@/types/dashboard';

interface Props {
  harvests: RecentHarvestItem[];
}

export default function RecentHarvestsWidget({ harvests }: Props) {
  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;
    
    const styles: Record<string, string> = {
      EXCELLENT: 'bg-green-100 text-green-800 border-green-200',
      GOOD: 'bg-blue-100 text-blue-800 border-blue-200',
      FAIR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      POOR: 'bg-orange-100 text-orange-800 border-orange-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200'
    };

    const style = styles[outcome] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${style}`}>
        {outcome.toLowerCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🥬 Recent Harvests</h3>
      </div>

      {harvests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No harvests recorded yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Start marking your crops as harvested to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((harvest) => (
            <div
              key={harvest.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {harvest.plantName}
                  </span>
                  {harvest.outcome && getOutcomeBadge(harvest.outcome)}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">
                    {formatDate(harvest.harvestDate)}
                  </p>
                  {harvest.quantity !== null && harvest.unit && (
                    <p className="text-xs text-gray-600">
                      {harvest.quantity} {harvest.unit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {harvests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total harvested this month</span>
            <span className="font-semibold text-green-600">{harvests.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
