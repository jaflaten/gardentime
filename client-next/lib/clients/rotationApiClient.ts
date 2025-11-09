// Client for Rotation API endpoints in gardentime backend
import axios, { AxiosInstance } from 'axios';
import {
  RotationScore,
  PlantRecommendation,
  RecommendationResponse,
  RecommendationRequest,
} from '../../types/rotation';

interface ValidateRotationRequest {
  plantName: string;
  plantingDate: string; // ISO date format
}

class RotationApiClient {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Validate a proposed planting for crop rotation compatibility
   * POST /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/validate
   */
  async validateRotation(
    gardenId: string,
    growAreaId: number,
    request: ValidateRotationRequest
  ): Promise<RotationScore> {
    const response = await this.api.post<RotationScore>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/validate`,
      request
    );
    return response.data;
  }

  /**
   * Get recommended plants for this grow area based on rotation analysis
   * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations
   */
  async getRecommendations(
    gardenId: string,
    growAreaId: number,
    params?: {
      season?: string;
      maxResults?: number;
      minScore?: number;
      grouped?: boolean;
    }
  ): Promise<RecommendationResponse> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season);
    if (params?.maxResults) queryParams.append('maxResults', params.maxResults.toString());
    if (params?.minScore) queryParams.append('minScore', params.minScore.toString());
    if (params?.grouped !== undefined) queryParams.append('grouped', params.grouped.toString());

    const response = await this.api.get<RecommendationResponse>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/recommendations?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get soil improvement recommendations (nitrogen fixers, cover crops)
   * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/soil-improvement
   */
  async getSoilImprovementRecommendations(
    gardenId: string,
    growAreaId: number,
    maxResults: number = 10
  ): Promise<PlantRecommendation[]> {
    const response = await this.api.get<{ recommendations: PlantRecommendation[] }>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/recommendations/soil-improvement?maxResults=${maxResults}`
    );
    return response.data.recommendations;
  }

  /**
   * Get recommendations grouped by plant family
   * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/recommendations/by-family
   */
  async getRecommendationsByFamily(
    gardenId: string,
    growAreaId: number
  ): Promise<RecommendationResponse> {
    const response = await this.api.get<RecommendationResponse>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/recommendations/by-family`
    );
    return response.data;
  }

  /**
   * Get companion-based recommendations
   * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/companions
   */
  async getCompanionRecommendations(
    gardenId: string,
    growAreaId: number,
    maxResults: number = 10
  ): Promise<PlantRecommendation[]> {
    const response = await this.api.get<{ recommendations: PlantRecommendation[] }>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/companions?maxResults=${maxResults}`
    );
    return response.data.recommendations;
  }

  /**
   * Get plants to avoid (low rotation scores)
   * GET /api/gardens/{gardenId}/grow-areas/{growAreaId}/rotation/avoid
   */
  async getPlantsToAvoid(
    gardenId: string,
    growAreaId: number
  ): Promise<PlantRecommendation[]> {
    const response = await this.api.get<{ recommendations: PlantRecommendation[] }>(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/avoid`
    );
    return response.data.recommendations;
  }
}

// Singleton instance
export const rotationApi = new RotationApiClient();
export default rotationApi;
