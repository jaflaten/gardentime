'use client';

import { PlantingCalendarWidget, CalendarEventType } from '@/types/dashboard';
import DevLabel from '@/components/DevLabel';

interface PlantingCalendarWidgetProps {
  data: PlantingCalendarWidget;
}

function PlantingCalendarWidgetContent({ data }: PlantingCalendarWidgetProps) {
  const getEventIcon = (type: CalendarEventType) => {
    switch (type) {
      case CalendarEventType.PLANTED:
        return '🌱';
      case CalendarEventType.EXPECTED_HARVEST:
        return '🟡';
      case CalendarEventType.ACTUAL_HARVEST:
        return '🔴';
      default:
        return '📅';
    }
  };

  const getEventColor = (type: CalendarEventType) => {
    switch (type) {
      case CalendarEventType.PLANTED:
        return 'bg-green-100 text-green-800';
      case CalendarEventType.EXPECTED_HARVEST:
        return 'bg-yellow-100 text-yellow-800';
      case CalendarEventType.ACTUAL_HARVEST:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="text-xl mr-2">📅</span>
        Planting Calendar
      </h3>

      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-700">{formatMonth(data.month)}</p>
      </div>

      {data.events.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">No events this month</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {data.events.map((event, index) => (
            <div 
              key={`${event.date}-${event.type}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{getEventIcon(event.type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.plantName}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.count > 1 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    ×{event.count}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEventColor(event.type)}`}>
                  {event.type === CalendarEventType.PLANTED && 'Planted'}
                  {event.type === CalendarEventType.EXPECTED_HARVEST && 'Expected'}
                  {event.type === CalendarEventType.ACTUAL_HARVEST && 'Harvested'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlantingCalendarWidgetComponent(props: PlantingCalendarWidgetProps) {
  return (
    <DevLabel name="PlantingCalendarWidget">
      <PlantingCalendarWidgetContent {...props} />
    </DevLabel>
  );
}
