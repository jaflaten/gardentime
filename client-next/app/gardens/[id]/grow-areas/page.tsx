'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, growAreaService, cropRecordService, Garden, GrowArea, ZoneType } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import GardenNavigation from '../components/GardenNavigation';
import AddCropModal from '../components/AddCropModal';

export default function GrowAreasListPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;
  const { isAuthenticated, logout, username, isLoading } = useAuth();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [growAreas, setGrowAreas] = useState<GrowArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGrowArea, setSelectedGrowArea] = useState<GrowArea | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [cropModalGrowArea, setCropModalGrowArea] = useState<GrowArea | null>(null);
  const [newGrowArea, setNewGrowArea] = useState({
    name: '',
    zoneSize: '',
    zoneType: '' as ZoneType | '',
    nrOfRows: '',
    notes: '',
    width: '',
    length: '',
    height: '',
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchGardenData();
  }, [isAuthenticated, isLoading, gardenId, router]);

  const fetchGardenData = async () => {
    try {
      setLoading(true);
      const [gardenData, growAreasData] = await Promise.all([
        gardenService.getById(gardenId),
        growAreaService.getByGardenId(gardenId),
      ]);
      setGarden(gardenData);
      
      // Fetch current crops for each grow area
      const growAreasWithCrops = await Promise.all(
        growAreasData.map(async (growArea) => {
          try {
            const crops = await cropRecordService.getByGrowAreaId(growArea.id);
            const activeCrops = crops.filter(
              (crop) => crop.status === 'PLANTED' || crop.status === 'GROWING' || !crop.status
            );
            return {
              ...growArea,
              currentCrops: activeCrops,
            };
          } catch (err) {
            console.warn(`Failed to fetch crops for grow area ${growArea.name}:`, err);
            return { ...growArea, currentCrops: [] };
          }
        })
      );
      
      setGrowAreas(growAreasWithCrops.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load garden data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrowArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existingCount = growAreas.length;
      const defaultX = 100 + (existingCount % 3) * 200;
      const defaultY = 100 + Math.floor(existingCount / 3) * 200;

      await growAreaService.create({
        name: newGrowArea.name,
        gardenId: gardenId,
        zoneSize: newGrowArea.zoneSize || undefined,
        zoneType: newGrowArea.zoneType || undefined,
        nrOfRows: newGrowArea.nrOfRows ? parseInt(newGrowArea.nrOfRows) : undefined,
        notes: newGrowArea.notes || undefined,
        width: newGrowArea.width ? parseFloat(newGrowArea.width) : undefined,
        length: newGrowArea.length ? parseFloat(newGrowArea.length) : undefined,
        height: newGrowArea.height ? parseFloat(newGrowArea.height) : undefined,
        positionX: defaultX,
        positionY: defaultY,
      });
      setShowCreateModal(false);
      setShowAdvanced(false);
      setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '', width: '', length: '', height: '' });
      fetchGardenData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create grow area');
    }
  };

  const handleUpdateGrowArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrowArea) return;

    try {
      await growAreaService.update(selectedGrowArea.id, {
        name: newGrowArea.name || undefined,
        zoneSize: newGrowArea.zoneSize || undefined,
        zoneType: newGrowArea.zoneType || undefined,
        nrOfRows: newGrowArea.nrOfRows ? parseInt(newGrowArea.nrOfRows) : undefined,
        notes: newGrowArea.notes || undefined,
        width: newGrowArea.width ? parseFloat(newGrowArea.width) : undefined,
        length: newGrowArea.length ? parseFloat(newGrowArea.length) : undefined,
        height: newGrowArea.height ? parseFloat(newGrowArea.height) : undefined,
      });
      setShowEditModal(false);
      setSelectedGrowArea(null);
      setShowAdvanced(false);
      setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '', width: '', length: '', height: '' });
      fetchGardenData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update grow area');
    }
  };

  const handleDeleteGrowArea = async () => {
    if (!selectedGrowArea) return;

    try {
      await growAreaService.delete(selectedGrowArea.id);
      setShowDeleteConfirm(false);
      setSelectedGrowArea(null);
      fetchGardenData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete grow area');
    }
  };

  const openEditModal = (growArea: GrowArea) => {
    setSelectedGrowArea(growArea);
    setNewGrowArea({
      name: growArea.name,
      zoneSize: growArea.zoneSize || '',
      zoneType: growArea.zoneType || '',
      nrOfRows: growArea.nrOfRows?.toString() || '',
      notes: growArea.notes || '',
      width: growArea.width?.toString() || '',
      length: growArea.length?.toString() || '',
      height: growArea.height?.toString() || '',
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (growArea: GrowArea) => {
    setSelectedGrowArea(growArea);
    setShowDeleteConfirm(true);
  };

  const openAddCropModal = (growArea: GrowArea) => {
    setCropModalGrowArea(growArea);
    setShowAddCropModal(true);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <GardenNavigation gardenId={gardenId} gardenName={garden?.name} />

      <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Grow Areas</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your planting areas and zones
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              + Add Grow Area
            </button>
          </div>
        </div>

        {/* Grow Areas List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {growAreas.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No grow areas</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first grow area.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  + Add Grow Area
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {growAreas.map((growArea) => (
                <li key={growArea.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{growArea.name}</h3>
                          {growArea.zoneType && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {growArea.zoneType}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                          {growArea.width && growArea.length && (
                            <span>
                              📏 {growArea.width} × {growArea.length} cm
                            </span>
                          )}
                          {growArea.zoneSize && <span>📦 {growArea.zoneSize}</span>}
                          {growArea.nrOfRows && <span>🌱 {growArea.nrOfRows} rows</span>}
                        </div>
                        {growArea.currentCrops && growArea.currentCrops.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-gray-700">Active crops: </span>
                            <span className="text-sm text-gray-600">
                              {growArea.currentCrops.map((crop: any) => crop.plant?.name || 'Unknown').join(', ')}
                            </span>
                          </div>
                        )}
                        {growArea.notes && (
                          <p className="mt-1 text-sm text-gray-500">{growArea.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openAddCropModal(growArea)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Add Crop
                        </button>
                        <Link
                          href={`/gardens/${gardenId}/grow-areas/${growArea.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-center"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => openEditModal(growArea)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(growArea)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Grow Area Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Grow Area</h3>
            <form onSubmit={handleCreateGrowArea}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={newGrowArea.name}
                    onChange={(e) => setNewGrowArea({ ...newGrowArea, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Zone Type</label>
                  <select
                    value={newGrowArea.zoneType}
                    onChange={(e) => setNewGrowArea({ ...newGrowArea, zoneType: e.target.value as ZoneType })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="">Select type...</option>
                    <option value="BOX">Box</option>
                    <option value="BED">Bed</option>
                    <option value="ROW">Row</option>
                    <option value="CONTAINER">Container</option>
                    <option value="FIELD">Field</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGrowArea.width}
                      onChange={(e) => setNewGrowArea({ ...newGrowArea, width: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGrowArea.length}
                      onChange={(e) => setNewGrowArea({ ...newGrowArea, length: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  {showAdvanced ? '− Hide' : '+ Show'} advanced fields
                </button>

                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zone Size</label>
                      <input
                        type="text"
                        value={newGrowArea.zoneSize}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, zoneSize: e.target.value })}
                        placeholder="e.g., 80x120cm"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Number of Rows</label>
                      <input
                        type="number"
                        value={newGrowArea.nrOfRows}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, nrOfRows: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newGrowArea.height}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, height: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={newGrowArea.notes}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, notes: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowAdvanced(false);
                    setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '', width: '', length: '', height: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal (similar structure to create) */}
      {showEditModal && selectedGrowArea && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Grow Area</h3>
            <form onSubmit={handleUpdateGrowArea}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={newGrowArea.name}
                    onChange={(e) => setNewGrowArea({ ...newGrowArea, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Zone Type</label>
                  <select
                    value={newGrowArea.zoneType}
                    onChange={(e) => setNewGrowArea({ ...newGrowArea, zoneType: e.target.value as ZoneType })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="">Select type...</option>
                    <option value="BOX">Box</option>
                    <option value="BED">Bed</option>
                    <option value="ROW">Row</option>
                    <option value="CONTAINER">Container</option>
                    <option value="FIELD">Field</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGrowArea.width}
                      onChange={(e) => setNewGrowArea({ ...newGrowArea, width: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGrowArea.length}
                      onChange={(e) => setNewGrowArea({ ...newGrowArea, length: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  {showAdvanced ? '− Hide' : '+ Show'} advanced fields
                </button>

                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Zone Size</label>
                      <input
                        type="text"
                        value={newGrowArea.zoneSize}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, zoneSize: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Number of Rows</label>
                      <input
                        type="number"
                        value={newGrowArea.nrOfRows}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, nrOfRows: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newGrowArea.height}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, height: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={newGrowArea.notes}
                        onChange={(e) => setNewGrowArea({ ...newGrowArea, notes: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGrowArea(null);
                    setShowAdvanced(false);
                    setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '', width: '', length: '', height: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedGrowArea && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedGrowArea.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteGrowArea}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedGrowArea(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Crop Modal */}
      {showAddCropModal && cropModalGrowArea && (
        <AddCropModal
          isOpen={showAddCropModal}
          onClose={() => {
            setShowAddCropModal(false);
            setCropModalGrowArea(null);
          }}
          onSuccess={() => {
            setShowAddCropModal(false);
            setCropModalGrowArea(null);
            fetchGardenData();
          }}
          growAreaId={cropModalGrowArea.id}
          growAreaName={cropModalGrowArea.name}
        />
      )}
    </div>
  );
}
