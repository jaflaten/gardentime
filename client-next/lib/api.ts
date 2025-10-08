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

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowAreaRequest {
  name: string;  // Required
  gardenId: string;  // UUID - Required
  zoneSize?: string;  // Optional
  zoneType?: ZoneType;  // Optional
  nrOfRows?: number;  // Optional
  notes?: string;  // Optional
}

export interface UpdateGrowAreaRequest {
  name?: string;
  zoneSize?: string;
  zoneType?: ZoneType;
  nrOfRows?: number;
  notes?: string;
}

// CropRecord types - FIXED: IDs are UUID strings
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateCropRecordRequest {
  growAreaId: string;  // UUID
  plantId: string;  // UUID
  datePlanted: string;
  dateHarvested?: string;
  notes?: string;
  outcome?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  quantityHarvested?: number;
  unit?: string;
}

// Plant types - FIXED: id is UUID string
export interface Plant {
  id: string;  // UUID
  name: string;
  scientificName?: string;
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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
};

// Plant service - calls Next.js BFF
export const plantService = {
  getAll: async (): Promise<Plant[]> => {
    const response = await api.get('/plants');
    return response.data;
  },
};
