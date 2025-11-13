'use client';

import { useState, useEffect } from 'react';
import { cropRecordService, plantService, Plant, CropStatus } from '@/lib/api';

interface AddCropModalProps {
  growAreaId: string;
  growAreaName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddCropModal({
  growAreaId,
  growAreaName,
  isOpen,
  onClose,
  onSuccess,
}: AddCropModalProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCropRecord, setNewCropRecord] = useState({
    plantId: '',
    datePlanted: new Date().toISOString().split('T')[0], // Default to today
    dateHarvested: '',
    notes: '',
    outcome: '' as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    status: 'PLANTED' as '' | CropStatus, // Default to PLANTED
    quantityHarvested: '',
    unit: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlants();
      // Reset form when opening
      setNewCropRecord({
        plantId: '',
        datePlanted: new Date().toISOString().split('T')[0],
        dateHarvested: '',
        notes: '',
        outcome: '',
        status: 'PLANTED',
        quantityHarvested: '',
        unit: '',
      });
      setError('');
    }
  }, [isOpen]);

  const fetchPlants = async () => {
    try {
      const plantsData = await plantService.getAll();
      setPlants(Array.isArray(plantsData) ? plantsData : []);
    } catch (err: any) {
      console.error('Failed to fetch plants:', err);
      setError('Failed to load plant list');
      setPlants([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find the selected plant to get its name
      const selectedPlant = plants.find(p => p.id === newCropRecord.plantId);
      if (!selectedPlant) {
        setError('Please select a plant');
        setLoading(false);
        return;
      }

      await cropRecordService.create({
        growAreaId: growAreaId,
        plantId: newCropRecord.plantId,
        plantName: selectedPlant.name,  // Pass plant name for backend
        datePlanted: newCropRecord.datePlanted,
        dateHarvested: newCropRecord.dateHarvested || undefined,
        notes: newCropRecord.notes || undefined,
        outcome: newCropRecord.outcome || undefined,
        status: newCropRecord.status || undefined,
        quantityHarvested: newCropRecord.quantityHarvested
          ? parseFloat(newCropRecord.quantityHarvested)
          : undefined,
        unit: newCropRecord.unit || undefined,
      });

      // Success!
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create crop:', err);
      setError(err.response?.data?.message || 'Failed to create crop record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Add Crop to {growAreaName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Record a new crop planting
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            type="button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plant Selection */}
          <div>
            <label htmlFor="plantId" className="block text-sm font-medium text-gray-700">
              Plant <span className="text-red-500">*</span>
            </label>
            <select
              id="plantId"
              value={newCropRecord.plantId}
              onChange={(e) =>
                setNewCropRecord({ ...newCropRecord, plantId: e.target.value })
              }
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
            >
              <option value="">Select a plant</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Planted */}
          <div>
            <label htmlFor="datePlanted" className="block text-sm font-medium text-gray-700">
              Date Planted <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="datePlanted"
              value={newCropRecord.datePlanted}
              onChange={(e) =>
                setNewCropRecord({ ...newCropRecord, datePlanted: e.target.value })
              }
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={newCropRecord.status}
              onChange={(e) =>
                setNewCropRecord({
                  ...newCropRecord,
                  status: e.target.value as '' | CropStatus,
                })
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
            >
              <option value="">Select a status</option>
              <option value="PLANTED">🌱 Planted</option>
              <option value="GROWING">🌿 Growing</option>
              <option value="HARVESTED">✅ Harvested</option>
              <option value="DISEASED">🦠 Diseased</option>
              <option value="FAILED">❌ Failed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={newCropRecord.notes}
              onChange={(e) =>
                setNewCropRecord({ ...newCropRecord, notes: e.target.value })
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
              rows={3}
              placeholder="Add any notes about this planting..."
            />
          </div>

          {/* Advanced Fields - Collapsible */}
          <details className="border border-gray-200 rounded-md p-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none">
              Advanced Options (optional)
            </summary>
            <div className="mt-3 space-y-4">
              {/* Date Harvested */}
              <div>
                <label htmlFor="dateHarvested" className="block text-sm font-medium text-gray-700">
                  Date Harvested
                </label>
                <input
                  type="date"
                  id="dateHarvested"
                  value={newCropRecord.dateHarvested}
                  onChange={(e) =>
                    setNewCropRecord({ ...newCropRecord, dateHarvested: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>

              {/* Outcome */}
              <div>
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">
                  Outcome
                </label>
                <select
                  id="outcome"
                  value={newCropRecord.outcome}
                  onChange={(e) =>
                    setNewCropRecord({
                      ...newCropRecord,
                      outcome: e.target.value as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select an outcome</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              {/* Quantity Harvested */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="quantityHarvested"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Quantity Harvested
                  </label>
                  <input
                    type="number"
                    id="quantityHarvested"
                    value={newCropRecord.quantityHarvested}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, quantityHarvested: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                    placeholder="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <input
                    type="text"
                    id="unit"
                    value={newCropRecord.unit}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, unit: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                    placeholder="kg, lbs, etc."
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Add Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
