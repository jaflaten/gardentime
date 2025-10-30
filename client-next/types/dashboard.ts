export interface GardenDashboard {
  summary: GardenSummary;
  activeCrops: ActiveCropsWidget;
  recentHarvests: RecentHarvestItem[];
  upcomingTasks: UpcomingTask[];
  capacity: GardenCapacityWidget;
  plantingCalendar: PlantingCalendarWidget;
}

export interface GardenSummary {
  gardenName: string;
  totalGrowAreas: number;
  activeGrowAreas: number;
  inactiveGrowAreas: number;
  totalAreaCm2: number | null;
  lastActivityDate: string | null;
}

export interface ActiveCropsWidget {
  total: number;
  planted: number;
  growing: number;
  readyToHarvest: number;
}

export interface RecentHarvestItem {
  id: string;
  plantName: string;
  harvestDate: string;
  quantity: number | null;
  unit: string | null;
  outcome: string | null;
}

export interface UpcomingTask {
  type: TaskType;
  cropId: string | null;
  plantName: string | null;
  growAreaName: string | null;
  expectedDate: string | null;
  daysOverdue: number | null;
  reason: string | null;
}

export enum TaskType {
  HARVEST_READY = 'HARVEST_READY',
  HARVEST_SOON = 'HARVEST_SOON',
  ATTENTION_NEEDED = 'ATTENTION_NEEDED',
  EMPTY_AREA = 'EMPTY_AREA'
}

export interface GardenCapacityWidget {
  totalGrowAreas: number;
  inUseGrowAreas: number;
  utilizationPercent: number;
  emptyGrowAreas: string[];
  crowdedGrowAreas: string[];
}

export interface PlantingCalendarWidget {
  month: string;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  date: string;
  type: CalendarEventType;
  plantName: string;
  count: number;
}

export enum CalendarEventType {
  PLANTED = 'PLANTED',
  EXPECTED_HARVEST = 'EXPECTED_HARVEST',
  ACTUAL_HARVEST = 'ACTUAL_HARVEST'
}
