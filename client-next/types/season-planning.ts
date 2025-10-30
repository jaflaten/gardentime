// Season Planning Types

export interface GardenClimateInfo {
  gardenId: string;
  lastFrostDate: string | null;
  firstFrostDate: string | null;
  hardinessZone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SeasonPlan {
  id: string;
  gardenId: string;
  userId: string;
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedCrop {
  id: string;
  seasonPlanId: string;
  plantId: number;
  plantName: string;
  quantity: number;
  preferredGrowAreaId: number | null;
  preferredGrowAreaName: string | null;
  status: 'PLANNED' | 'SEEDS_STARTED' | 'TRANSPLANTED' | 'DIRECT_SOWN' | 'GROWING' | 'COMPLETED' | 'CANCELLED';
  indoorStartDate: string | null;
  indoorStartMethod: string | null;
  transplantDate: string | null;
  directSowDate: string | null;
  expectedHarvestDate: string | null;
  phase: 'EARLY' | 'MID' | 'LATE' | null;
  notes: string | null;
  cropRecordId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  date: string;
  type: 'INDOOR_START' | 'TRANSPLANT' | 'DIRECT_SOW' | 'EXPECTED_HARVEST' | 'ACTUAL_HARVEST';
  plantName: string;
  plannedCropId?: string;
  cropRecordId?: string;
  growAreaName?: string;
}

export interface CalendarResponse {
  month: string;
  events: CalendarEvent[];
}
