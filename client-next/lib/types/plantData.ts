// TypeScript types for Plant Data API
// Mirrors the DTOs from plant-data-aggregator

export interface PlantSummaryDTO {
  commonName: string;
  scientificName: string;
  family: string;
  slug: string;
  cycle?: string;
  sunNeeds?: string;
  waterNeeds?: string;
  imageUrl?: string;
}

export interface PlantDetailDTO {
  commonName: string;
  scientificName: string;
  family: string;
  genus: string;
  slug: string;
  
  // Growth characteristics
  cycle?: string;
  growthHabit?: string;
  sunNeeds?: string;
  waterNeeds?: string;
  
  // Soil and nutrition
  feederType?: string;
  isNitrogenFixer: boolean;
  rootDepth?: string;
  phMin?: number;
  phMax?: number;
  
  // Maturity
  daysToMaturityMin?: number;
  daysToMaturityMax?: number;
  successionIntervalDays?: number;
  
  // Other attributes
  droughtTolerant?: boolean;
  invasive?: boolean;
  poisonousToPets?: boolean;
  toxicityLevel?: string;
  primaryNutrientContribution?: string;
  
  imageUrl?: string;
  description?: string;
}

export interface CompanionDTO {
  name: string;
  scientificName: string;
  relationship: 'COMPATIBLE' | 'INCOMPATIBLE' | 'BENEFICIAL';
  reason?: string;
}

export interface CompanionListDTO {
  plantName: string;
  companions: CompanionDTO[];
  totalCount: number;
}

export interface PestDTO {
  name: string;
  scientificName?: string;
  description?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  organicControls?: string[];
}

export interface DiseaseDTO {
  name: string;
  scientificName?: string;
  description?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  soilBorne: boolean;
  persistenceYears?: number;
  organicControls?: string[];
}

export interface PlantPestsResponseDTO {
  plantName: string;
  pests: PestDTO[];
  totalCount: number;
}

export interface PlantDiseasesResponseDTO {
  plantName: string;
  diseases: DiseaseDTO[];
  totalCount: number;
}

export interface FamilyDTO {
  name: string;
  description?: string;
  plantCount: number;
}

export interface FamiliesResponseDTO {
  families: FamilyDTO[];
  totalCount: number;
}

export interface PlantListResponseDTO {
  plants: PlantSummaryDTO[];
  totalCount: number;
  page: number;
  size: number;
}
