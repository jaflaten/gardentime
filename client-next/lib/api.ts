import axios from 'axios';

// Next.js BFF API URL (calls Next.js API routes, not Spring Boot directly)
const API_BASE_URL = '/api';

// Create axios instance for client-side API calls to Next.js BFF
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.warn('Token expired, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Received 401, clearing auth data');
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

// Garden types - FIXED: id is UUID string, not number
export interface Garden {
  id: string;  // UUID
  name: string;
  description?: string;
  location?: string;
  userId: string;  // UUID
  createdAt: string;
  updatedAt: string;
}

export interface CreateGardenRequest {
  name: string;
  description?: string;
  location?: string;
}

// GrowArea types - FIXED: IDs are UUID strings
export type ZoneType = 'BOX' | 'FIELD' | 'BED' | 'BUCKET';

export interface GrowArea {
  id: string;  // UUID
  name: string;
  gardenId: string;  // UUID
  zoneSize?: string;  // Optional: e.g., "80x120cm" or "2m x 3m"
  zoneType?: ZoneType;  // Optional: BOX, FIELD, BED, or BUCKET
  nrOfRows?: number;  // Optional: Number of planting rows
  notes?: string;  // Optional: General notes
  // Visual board position fields (in pixels on canvas)
  positionX?: number;  // Optional: null if not yet placed on board
  positionY?: number;  // Optional: null if not yet placed on board
  // Physical dimension fields (in centimeters)
  width?: number;  // Optional: real-world width in cm
  length?: number;  // Optional: real-world length in cm
  height?: number;  // Optional: real-world height in cm (for vertical gardens)
  createdAt: string;
  updatedAt: string;
  // Current crops (Step 27.8)
  currentCrops?: CropRecord[];  // Active crops in this grow area
  // Custom color (Step 27.9)
  color?: string;  // Optional: Custom hex color for grow area
}

export interface CreateGrowAreaRequest {
  name: string;  // Required
  gardenId: string;  // UUID - Required
  zoneSize?: string;  // Optional
  zoneType?: ZoneType;  // Optional
  nrOfRows?: number;  // Optional
  notes?: string;  // Optional
  // Visual board position fields (in pixels)
  positionX?: number;  // Optional
  positionY?: number;  // Optional
  // Physical dimension fields (in centimeters)
  width?: number;  // Optional
  length?: number;  // Optional
  height?: number;  // Optional
}

export interface UpdateGrowAreaRequest {
  name?: string;  // Optional
  zoneSize?: string;  // Optional
  zoneType?: ZoneType;  // Optional
  nrOfRows?: number;  // Optional
  notes?: string;  // Optional
  // Visual board position fields (in pixels)
  positionX?: number;  // Optional
  positionY?: number;  // Optional
  // Physical dimension fields (in centimeters)
  width?: number;  // Optional
  length?: number;  // Optional
  height?: number;  // Optional
}

// Canvas Object types - for drawing shapes, text, arrows, etc.
export type CanvasObjectType = 'RECTANGLE' | 'CIRCLE' | 'LINE' | 'ARROW' | 'TEXT' | 'FREEHAND';

export interface CanvasObject {
  id: number;
  gardenId: string;  // UUID
  type: CanvasObjectType;
  // Position and dimensions
  x: number;
  y: number;
  width?: number;
  height?: number;
  // For lines, arrows, freehand paths (array of points: [x1,y1,x2,y2,...])
  points?: string;
  // Styling
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;  // NEW: Line dash pattern as JSON string, e.g. "[5, 5]" for dashed
  // Text content (for text objects)
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  // Metadata
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  layerId?: string;
}

export interface CreateCanvasObjectRequest {
  gardenId: string;  // UUID
  type: CanvasObjectType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;  // NEW: Line dash pattern
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  layerId?: string;
}

export interface UpdateCanvasObjectRequest {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;  // NEW: Line dash pattern
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  layerId?: string;
}

// CropRecord types - FIXED: IDs are UUID strings
export type CropStatus = 'PLANTED' | 'GROWING' | 'HARVESTED' | 'DISEASED' | 'FAILED' | 'UNKNOWN';

export interface CropRecord {
  id: string;  // UUID
  growAreaId: string;  // UUID
  plantId: string;  // UUID
  plantName?: string;
  datePlanted: string;
  dateHarvested?: string;
  notes?: string;
  outcome?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  quantityHarvested?: number;
  unit?: string;
  status?: CropStatus;  // NEW: Status to track crop lifecycle
  createdAt: string;
  updatedAt: string;
}

export interface CreateCropRecordRequest {
  growAreaId: string;  // UUID
  plantId: string;  // UUID string from plant-data-aggregator
  plantName: string;  // Plant name for display and lookup
  datePlanted: string;
  dateHarvested?: string;
  notes?: string;
  outcome?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  status?: CropStatus;  // NEW: Status to track crop lifecycle
  quantityHarvested?: number;
  unit?: string;
}

// Plant types - FIXED: id is number (Long in backend)
export interface Plant {
  id: string;  // UUID string from plant-data-aggregator
  name: string;
  scientificName?: string;
  family?: string | null;
  genus?: string | null;
  cycle?: string | null;
  sunNeeds?: string | null;
  waterNeeds?: string | null;
  rootDepth?: string;
  growthHabit?: string | null;
  feederType?: string | null;
  isNitrogenFixer?: boolean;
  edibleParts?: string[];
  maturityDaysMin?: number | null;
  maturityDaysMax?: number | null;
  // Legacy fields - may not be present
  plantType?: string;
  maturityTime?: number;
  growingSeason?: string;
  sunReq?: string;
  waterReq?: string;
  soilType?: string;
  spaceReq?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth service - calls Next.js BFF
export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
  },
};

// Garden service - calls Next.js BFF
export const gardenService = {
  getAll: async (): Promise<Garden[]> => {
    const response = await api.get('/gardens');
    return response.data;
  },

  getById: async (id: string): Promise<Garden> => {
    const response = await api.get(`/gardens/${id}`);
    return response.data;
  },

  create: async (data: CreateGardenRequest): Promise<Garden> => {
    const response = await api.post('/gardens', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateGardenRequest>): Promise<Garden> => {
    const response = await api.put(`/gardens/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/gardens/${id}`);
  },
};

// GrowArea service - calls Next.js BFF
export const growAreaService = {
  getAll: async (): Promise<GrowArea[]> => {
    const response = await api.get('/grow-areas');
    return response.data;
  },

  getById: async (id: string): Promise<GrowArea> => {
    const response = await api.get(`/grow-areas/${id}`);
    return response.data;
  },

  getByGardenId: async (gardenId: string): Promise<GrowArea[]> => {
    const response = await api.get(`/gardens/${gardenId}/grow-areas`);
    return response.data;
  },

  create: async (data: CreateGrowAreaRequest): Promise<GrowArea> => {
    const response = await api.post('/grow-areas', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGrowAreaRequest): Promise<GrowArea> => {
    const response = await api.put(`/grow-areas/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/grow-areas/${id}`);
  },

  getCropRecords: async (id: string): Promise<CropRecord[]> => {
    const response = await api.get(`/grow-areas/${id}/crop-records`);
    return response.data;
  },

  search: async (query: string): Promise<GrowArea[]> => {
    const response = await api.get('/grow-areas/search', { params: { query } });
    return response.data;
  },
};

// CropRecord service - calls Next.js BFF
export const cropRecordService = {
  getByGrowAreaId: async (growAreaId: string): Promise<CropRecord[]> => {
    const response = await api.get(`/grow-areas/${growAreaId}/crop-records`);
    return response.data;
  },

  create: async (data: CreateCropRecordRequest): Promise<CropRecord> => {
    const response = await api.post('/crop-records', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCropRecordRequest> & { status?: CropStatus }): Promise<CropRecord> => {
    const response = await api.put(`/crop-records/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/crop-records/${id}`);
  },
};

// Plant service - calls Next.js BFF
export const plantService = {
  getAll: async (): Promise<Plant[]> => {
    const response = await api.get('/plants');
    return response.data;
  },

  search: async (query: string): Promise<Plant[]> => {
    const response = await api.get('/plants/search', { params: { query } });
    return response.data;
  },
};

// Canvas Object service - calls Next.js BFF
export const canvasObjectService = {
  getByGardenId: async (gardenId: string): Promise<CanvasObject[]> => {
    const response = await api.get(`/canvas-objects/garden/${gardenId}`);
    return response.data;
  },

  create: async (data: CreateCanvasObjectRequest): Promise<CanvasObject> => {
    const response = await api.post('/canvas-objects', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCanvasObjectRequest): Promise<CanvasObject> => {
    const response = await api.put(`/canvas-objects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/canvas-objects/${id}`);
  },

  batchCreate: async (objects: CreateCanvasObjectRequest[]): Promise<CanvasObject[]> => {
    const response = await api.post('/canvas-objects/batch', { objects });
    return response.data;
  },
};
