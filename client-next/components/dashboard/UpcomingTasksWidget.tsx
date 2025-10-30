'use client';

import { UpcomingTask, TaskType } from '@/types/dashboard';

interface UpcomingTasksWidgetProps {
  tasks: UpcomingTask[];
}

export default function UpcomingTasksWidget({ tasks }: UpcomingTasksWidgetProps) {
  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.HARVEST_READY:
        return '🥬';
      case TaskType.HARVEST_SOON:
        return '⏰';
      case TaskType.ATTENTION_NEEDED:
        return '⚠️';
      case TaskType.EMPTY_AREA:
        return '📦';
      default:
        return '📋';
    }
  };

  const getTaskBadgeColor = (type: TaskType) => {
    switch (type) {
      case TaskType.HARVEST_READY:
        return 'bg-orange-100 text-orange-800';
      case TaskType.HARVEST_SOON:
        return 'bg-yellow-100 text-yellow-800';
      case TaskType.ATTENTION_NEEDED:
        return 'bg-red-100 text-red-800';
      case TaskType.EMPTY_AREA:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTaskTitle = (type: TaskType) => {
    switch (type) {
      case TaskType.HARVEST_READY:
        return 'Ready to Harvest';
      case TaskType.HARVEST_SOON:
        return 'Harvest Soon';
      case TaskType.ATTENTION_NEEDED:
        return 'Needs Attention';
      case TaskType.EMPTY_AREA:
        return 'Empty Area';
      default:
        return 'Task';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Limit to top 10 tasks
  const displayedTasks = tasks.slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="text-xl mr-2">📋</span>
        Upcoming Tasks
      </h3>

      {displayedTasks.length === 0 ? (
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">All caught up! 🎉</p>
          <p className="text-xs text-green-600 mt-1">No urgent tasks at the moment</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {displayedTasks.map((task, index) => (
            <div 
              key={`${task.type}-${task.cropId || task.growAreaName}-${index}`}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{getTaskIcon(task.type)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskBadgeColor(task.type)}`}>
                    {getTaskTitle(task.type)}
                  </span>
                </div>
                {task.daysOverdue !== null && task.daysOverdue > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                    {task.daysOverdue} days overdue
                  </span>
                )}
              </div>

              <div className="ml-8">
                {task.plantName && (
                  <p className="text-sm font-semibold text-gray-800">{task.plantName}</p>
                )}
                {task.growAreaName && (
                  <p className="text-xs text-gray-600">in {task.growAreaName}</p>
                )}
                {task.reason && (
                  <p className="text-xs text-gray-500 mt-1">{task.reason}</p>
                )}
                {task.expectedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Expected: {formatDate(task.expectedDate)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length > 10 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Showing 10 of {tasks.length} tasks
          </p>
        </div>
      )}
    </div>
  );
}
