export interface Box {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  zoneType?: "BOX" | "BUCKET" | string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Planting {
  id: string;
  boxId: string;
  plantKey: string;
  customName?: string;
  plantedDate: string;
  harvestDate?: string;
  notes?: string;
  status: "active" | "harvested" | "removed" | "failed";
  year: number;
}

export interface PlantInfo {
  key: string;
  name_no: string;
  name_pl: string;
  name_en: string;
  emoji: string;
  category: "vegetable" | "herb" | "fruit" | "flower";
}
