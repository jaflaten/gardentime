'use client';

import { CropRecord } from '@/lib/api';
import { getOutcomeBadgeColor, getStatusBadgeColor, getStatusIcon } from './cropRecordUtils';

interface CropRecordCardProps {
  record: CropRecord;
  onEdit?: (record: CropRecord) => void;
  onDelete?: (record: CropRecord) => void;
  isHistorical?: boolean;
}

export function CropRecordCard({ record, onEdit, onDelete, isHistorical = false }: CropRecordCardProps) {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition ${isHistorical ? 'opacity-75' : ''}`}
      data-testid={isHistorical ? 'crop-record-card-historical' : 'crop-record-card'}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {record.plantName || `Plant #${record.plantId}`}
          </h3>
          <p className="text-sm text-gray-500">
            Planted: {new Date(record.datePlanted).toLocaleDateString()}
          </p>
          {record.status && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(record.status)}`}>
                <span>{getStatusIcon(record.status)}</span>
                <span>{record.status}</span>
              </span>
            </div>
          )}
        </div>
        {record.outcome && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOutcomeBadgeColor(record.outcome)}`}>
            {record.outcome}
          </span>
        )}
      </div>
      {record.dateHarvested && (
        <p className="text-sm text-gray-600 mb-2">
          Harvested: {new Date(record.dateHarvested).toLocaleDateString()}
        </p>
      )}
      {record.quantityHarvested && (
        <p className="text-sm text-gray-600 mb-2">
          Quantity: {record.quantityHarvested} {record.unit || 'units'}
        </p>
      )}
      {record.notes && (
        <p className="text-gray-700 mt-3 p-3 bg-gray-50 rounded">
          {record.notes}
        </p>
      )}
      {!isHistorical && onEdit && onDelete && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(record)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
            data-testid={`crop-record-edit-btn-${record.id}`}
          >
            <span className="text-lg">✏️</span>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(record)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2"
            data-testid={`crop-record-delete-btn-${record.id}`}
          >
            <span className="text-lg">🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
