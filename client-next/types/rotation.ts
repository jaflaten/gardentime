/**
 * TypeScript types for crop rotation planner
 */

export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export interface ExternalLink {
  title: string;
  url: string;
  description?: string;
}

export interface LearnMoreContent {
  title: string;
  content: string;
  scientificBasis?: string;
  examples?: string[];
  externalLinks?: ExternalLink[];
}

export interface RotationIssue {
  severity: IssueSeverity;
  category: string;
  message: string;
  suggestion?: string;
  detailedExplanation?: string;
  learnMore?: LearnMoreContent;
  affectedYears?: number[];
  relatedPlants?: string[];
}

export interface RotationBenefit {
  category: string;
  message: string;
  impact: string;
  detailedExplanation?: string;
  expectedResults?: string[];
  timeframe?: string;
}

export interface ScoreComponent {
  score: number;
  maxScore: number;
  label: string;
  description: string;
}

export interface ScoreComponents {
  familyRotation: ScoreComponent;
  nutrientBalance: ScoreComponent;
  diseaseRisk: ScoreComponent;
  rootDepthDiversity: ScoreComponent;
  companionCompatibility: ScoreComponent;
}

export interface RotationScore {
  totalScore: number;
  grade: string;
  recommendation: string;
  components: ScoreComponents;
  issues: RotationIssue[];
  benefits: RotationBenefit[];
}

export interface PlantRecommendation {
  plantId: string;
  plantName: string;
  scientificName?: string;
  family: string;
  rotationScore: RotationScore;
  suitabilityReason: string;
  primaryBenefits: string[];
  warningFlags: string[];
}

export interface RecommendationRequest {
  growAreaId: number;
  season?: string;
  maxResults?: number;
  minScore?: number;
  includeSoilBuilders?: boolean;
  groupByFamily?: boolean;
  includePlantsToAvoid?: boolean;
}

export interface GroupedRecommendations {
  topPicks: PlantRecommendation[];
  soilBuilders: PlantRecommendation[];
  byFamily: Record<string, PlantRecommendation[]>;
  toAvoid: PlantRecommendation[];
}

export interface RecommendationResponse {
  growAreaId: number;
  recommendations: PlantRecommendation[];
  totalEvaluated: number;
  totalSuitable: number;
  grouped?: GroupedRecommendations;
}
