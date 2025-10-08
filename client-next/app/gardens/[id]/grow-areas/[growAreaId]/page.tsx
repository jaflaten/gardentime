'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { growAreaService, cropRecordService, plantService, GrowArea, CropRecord, Plant } from '@/lib/api';
import Link from 'next/link';

export default function GrowAreaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;  // FIXED: Keep as string (UUID)
  const growAreaId = params.growAreaId as string;  // FIXED: Keep as string (UUID)
  const { isAuthenticated, logout, username } = useAuth();
  const [growArea, setGrowArea] = useState<GrowArea | null>(null);
  const [cropRecords, setCropRecords] = useState<CropRecord[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCropRecord, setNewCropRecord] = useState({
    plantId: '',
    datePlanted: '',
    dateHarvested: '',
    notes: '',
    outcome: '' as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    quantityHarvested: '',
    unit: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, growAreaId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [growAreaData, cropRecordsData, plantsData] = await Promise.all([
        growAreaService.getById(growAreaId),
        cropRecordService.getByGrowAreaId(growAreaId),
        plantService.getAll(),
      ]);
      setGrowArea(growAreaData);
      setCropRecords(cropRecordsData);
      setPlants(plantsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCropRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cropRecordService.create({
        growAreaId: growAreaId,
        plantId: newCropRecord.plantId,  // FIXED: Keep as string UUID, don't parse as int
        datePlanted: newCropRecord.datePlanted,
        dateHarvested: newCropRecord.dateHarvested || undefined,
        notes: newCropRecord.notes || undefined,
        outcome: newCropRecord.outcome || undefined,
        quantityHarvested: newCropRecord.quantityHarvested ? parseFloat(newCropRecord.quantityHarvested) : undefined,
        unit: newCropRecord.unit || undefined,
      });
      setShowCreateModal(false);
      setNewCropRecord({
        plantId: '',
        datePlanted: '',
        dateHarvested: '',
        notes: '',
        outcome: '',
        quantityHarvested: '',
        unit: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create crop record');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getOutcomeBadgeColor = (outcome?: string) => {
    switch (outcome) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'FAIR': return 'bg-yellow-100 text-yellow-800';
      case 'POOR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/gardens" className="text-green-600 hover:text-green-700">
                Gardens
              </Link>
              <span className="text-gray-400">/</span>
              <Link href={`/gardens/${gardenId}`} className="text-green-600 hover:text-green-700">
                Garden
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700">{growArea?.name || 'Grow Area'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/gardens/${gardenId}`}
            className="text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Back to Garden
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Grow Area Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {growArea?.name}
              </h1>
              {growArea?.description && (
                <p className="text-gray-600 mb-2">{growArea.description}</p>
              )}
              {growArea?.sizeM2 && (
                <p className="text-gray-500">📏 {growArea.sizeM2} m²</p>
              )}
            </div>

            {/* Crop Records Section */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Crop Records</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                + New Crop Record
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            {cropRecords.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-500 mb-4">No crop records yet</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Add your first crop record
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cropRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {record.plantName || `Plant #${record.plantId}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Planted: {new Date(record.datePlanted).toLocaleDateString()}
                        </p>
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Crop Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
            <h3 className="text-xl font-bold mb-4">Add Crop Record</h3>
            <form onSubmit={handleCreateCropRecord}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plant *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newCropRecord.plantId}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, plantId: e.target.value })
                    }
                  >
                    <option value="">Select a plant</option>
                    {plants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Planted *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newCropRecord.datePlanted}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, datePlanted: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Harvested
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newCropRecord.dateHarvested}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, dateHarvested: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outcome
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newCropRecord.outcome}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, outcome: e.target.value as any })
                    }
                  >
                    <option value="">Select outcome</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Harvested
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={newCropRecord.quantityHarvested}
                      onChange={(e) =>
                        setNewCropRecord({ ...newCropRecord, quantityHarvested: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      placeholder="kg, lbs, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      value={newCropRecord.unit}
                      onChange={(e) =>
                        setNewCropRecord({ ...newCropRecord, unit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    value={newCropRecord.notes}
                    onChange={(e) =>
                      setNewCropRecord({ ...newCropRecord, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
