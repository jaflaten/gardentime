import React, { useState } from 'react';
import api from '../services/api';

interface AddGrowZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  gardenId: string;
  onGrowZoneAdded: () => void;
}

const AddGrowZoneModal: React.FC<AddGrowZoneModalProps> = ({ isOpen, onClose, gardenId, onGrowZoneAdded }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/growarea/${name}/garden/${gardenId}`);
      setName('');
      onGrowZoneAdded(); // Refresh the parent component
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to add grow area');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Add Grow Area</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Grow Area Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Box 1, North Bed, Tomato Patch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Grow Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGrowZoneModal;
