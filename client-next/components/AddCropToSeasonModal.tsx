'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AddCropToSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  gardenId: string;
  seasonPlanId: string;
  growAreaId?: number;
  onCropAdded: () => void;
}

interface Plant {
  id: string;
  name: string;
  scientificName?: string;
  family?: string;
}

export default function AddCropToSeasonModal({
  isOpen,
  onClose,
  gardenId,
  seasonPlanId,
  growAreaId,
  onCropAdded
}: AddCropToSeasonModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [plantingDate, setPlantingDate] = useState('');
  const [saving, setSaving] = useState(false);

  const searchPlants = async (term: string) => {
    if (term.length < 2) {
      setPlants([]);
      return;
    }

    setLoading(true);
    try {
      // Search through gardentime API which proxies to plant-data-aggregator
      const res = await api.get(`/plants/search`, {
        params: { q: term, limit: 20 }
      });
      setPlants(res.data || []);
    } catch (error) {
      console.error('Failed to search plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSelect = (plant: Plant) => {
    setSelectedPlant(plant);
    setSearchTerm('');
    setPlants([]);
  };

  const handleSave = async () => {
    if (!selectedPlant) return;

    setSaving(true);
    try {
      await api.post(
        `/gardens/${gardenId}/season-plans/${seasonPlanId}/planned-crops`,
        {
          plantId: selectedPlant.id,
          plantName: selectedPlant.name,
          quantity,
          preferredGrowAreaId: null, // No grow area assignment yet
          phase: null,
          notes: null
        }
      );
      onCropAdded();
      handleClose();
    } catch (error) {
      console.error('Failed to add crop:', error);
      alert('Failed to add crop. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setPlants([]);
    setSelectedPlant(null);
    setQuantity(1);
    setPlantingDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Add Crop to Season Plan</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!selectedPlant && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for a plant
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchPlants(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Type plant name..."
            />
            {loading && (
              <div className="mt-2 text-sm text-gray-600">Searching...</div>
            )}
            {plants.length > 0 && (
              <div className="mt-2 border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                {plants.map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => handlePlantSelect(plant)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{plant.name}</div>
                    {plant.scientificName && (
                      <div className="text-sm text-gray-600 italic">{plant.scientificName}</div>
                    )}
                    {plant.family && (
                      <div className="text-sm text-gray-600">Family: {plant.family}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedPlant && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPlant.name}</h3>
                  {selectedPlant.scientificName && (
                    <p className="text-sm text-gray-600 italic">{selectedPlant.scientificName}</p>
                  )}
                  {selectedPlant.family && (
                    <p className="text-sm text-gray-600">Family: {selectedPlant.family}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedPlant(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Plant
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    After adding all your crops, use the <span className="font-semibold">Rotation Planner</span> to get optimal placement recommendations based on crop rotation principles.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planting Date (Optional)
                </label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 [color-scheme:light]"
                  style={{ colorScheme: 'light' }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add to Season Plan'}
              </button>
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
