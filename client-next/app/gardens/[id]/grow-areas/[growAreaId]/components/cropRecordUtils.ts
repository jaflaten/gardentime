import { CropStatus } from '@/lib/api';

export const getOutcomeBadgeColor = (outcome?: string) => {
  switch (outcome) {
    case 'EXCELLENT': return 'bg-green-100 text-green-800';
    case 'GOOD': return 'bg-blue-100 text-blue-800';
    case 'FAIR': return 'bg-yellow-100 text-yellow-800';
    case 'POOR': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusBadgeColor = (status?: CropStatus) => {
  switch (status) {
    case 'PLANTED': return 'bg-green-100 text-green-800 border-green-300';
    case 'GROWING': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'HARVESTED': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'DISEASED': return 'bg-red-100 text-red-800 border-red-300';
    case 'FAILED': return 'bg-orange-100 text-orange-800 border-orange-300';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const getStatusIcon = (status?: CropStatus) => {
  switch (status) {
    case 'PLANTED': return '🌱';
    case 'GROWING': return '🌿';
    case 'HARVESTED': return '✅';
    case 'DISEASED': return '🦠';
    case 'FAILED': return '❌';
    default: return '❓';
  }
};

export type Outcome = '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface CropRecordFormData {
  datePlanted: string;
  dateHarvested: string;
  notes: string;
  outcome: Outcome;
  status: '' | CropStatus;
  quantityHarvested: string;
  unit: string;
}

export const emptyCropRecordForm: CropRecordFormData = {
  datePlanted: '',
  dateHarvested: '',
  notes: '',
  outcome: '',
  status: '',
  quantityHarvested: '',
  unit: '',
};
