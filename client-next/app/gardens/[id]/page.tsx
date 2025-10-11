'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, growAreaService, Garden, GrowArea, ZoneType } from '@/lib/api';
import Link from 'next/link';

export default function GardenDetailPage() {
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
  const [newGrowArea, setNewGrowArea] = useState({
    name: '',
    zoneSize: '',
    zoneType: '' as ZoneType | '',
    nrOfRows: '',
    notes: '',
  });

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

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
      // Sort grow areas by name to keep consistent order
      setGrowAreas(growAreasData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load garden data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrowArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await growAreaService.create({
        name: newGrowArea.name,
        gardenId: gardenId,
        zoneSize: newGrowArea.zoneSize || undefined,
        zoneType: newGrowArea.zoneType || undefined,
        nrOfRows: newGrowArea.nrOfRows ? parseInt(newGrowArea.nrOfRows) : undefined,
        notes: newGrowArea.notes || undefined,
      });
      setShowCreateModal(false);
      setShowAdvanced(false);
      setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
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
      });
      setShowEditModal(false);
      setShowAdvanced(false);
      setSelectedGrowArea(null);
      setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
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
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (growArea: GrowArea) => {
    setSelectedGrowArea(growArea);
    setShowDeleteConfirm(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getZoneTypeIcon = (type?: ZoneType) => {
    switch (type) {
      case 'BOX': return '📦';
      case 'FIELD': return '🌾';
      case 'BED': return '🛏️';
      case 'BUCKET': return '🪣';
      default: return '📍';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/gardens" className="text-2xl font-bold text-green-600">
                GardenTime
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-800 font-medium">{garden?.name || 'Garden'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-800">Welcome, {username}</span>
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
            href="/gardens"
            className="text-green-600 hover:text-green-700 flex items-center gap-2 font-medium"
          >
            ← Back to Gardens
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Garden Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {garden?.name}
              </h1>
              {garden?.description && (
                <p className="text-gray-700 mb-2">{garden.description}</p>
              )}
              {garden?.location && (
                <p className="text-gray-600">📍 {garden.location}</p>
              )}
            </div>

            {/* Grow Areas Section */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Grow Areas</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                + New Grow Area
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            {growAreas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-600 mb-4">No grow areas yet</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create your first grow area
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {growAreas.map((growArea) => (
                  <div
                    key={growArea.id}
                    data-testid="grow-area-card"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Link
                        href={`/gardens/${gardenId}/grow-areas/${growArea.id}`}
                        className="flex-1"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-green-600">
                          {getZoneTypeIcon(growArea.zoneType)} {growArea.name}
                        </h3>
                      </Link>
                      <div className="flex gap-3 ml-2">
                        <button
                          onClick={() => openEditModal(growArea)}
                          className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-all text-lg cursor-pointer"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(growArea)}
                          className="text-red-600 hover:text-red-800 hover:scale-110 transition-all text-lg cursor-pointer"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <Link href={`/gardens/${gardenId}/grow-areas/${growArea.id}`}>
                      <div className="space-y-1 text-sm">
                        {growArea.zoneType && (
                          <p className="text-gray-700">Type: {growArea.zoneType}</p>
                        )}
                        {growArea.zoneSize && (
                          <p className="text-gray-700">📏 Size: {growArea.zoneSize}</p>
                        )}
                        {growArea.nrOfRows && (
                          <p className="text-gray-700">🌱 Rows: {growArea.nrOfRows}</p>
                        )}
                        {growArea.notes && (
                          <p className="text-gray-600 text-xs mt-2 italic line-clamp-2">
                            {growArea.notes}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Grow Area Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Grow Area</h3>
            <form onSubmit={handleCreateGrowArea}>
              <div className="space-y-4">
                {/* Required Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Front Garden Box 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                    value={newGrowArea.name}
                    onChange={(e) =>
                      setNewGrowArea({ ...newGrowArea, name: e.target.value })
                    }
                  />
                </div>

                {/* Advanced Fields Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                >
                  {showAdvanced ? '▼' : '▶'} {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>

                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Zone Type <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        value={newGrowArea.zoneType}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, zoneType: e.target.value as ZoneType | '' })
                        }
                      >
                        <option value="">Select type...</option>
                        <option value="BOX">📦 Box</option>
                        <option value="FIELD">🌾 Field</option>
                        <option value="BED">🛏️ Bed</option>
                        <option value="BUCKET">🪣 Bucket</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Size <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 80x120cm or 2m x 3m"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                        value={newGrowArea.zoneSize}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, zoneSize: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Number of Rows <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                        value={newGrowArea.nrOfRows}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, nrOfRows: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Notes <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                        rows={3}
                        placeholder="Any additional information..."
                        value={newGrowArea.notes}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, notes: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowAdvanced(false);
                    setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grow Area Modal */}
      {showEditModal && selectedGrowArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Edit Grow Area</h3>
            <form onSubmit={handleUpdateGrowArea}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    value={newGrowArea.name}
                    onChange={(e) =>
                      setNewGrowArea({ ...newGrowArea, name: e.target.value })
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                >
                  {showAdvanced ? '▼' : '▶'} {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>

                {showAdvanced && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Zone Type <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        value={newGrowArea.zoneType}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, zoneType: e.target.value as ZoneType | '' })
                        }
                      >
                        <option value="">Select type...</option>
                        <option value="BOX">📦 Box</option>
                        <option value="FIELD">🌾 Field</option>
                        <option value="BED">🛏️ Bed</option>
                        <option value="BUCKET">🪣 Bucket</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Size <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        value={newGrowArea.zoneSize}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, zoneSize: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Number of Rows <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        value={newGrowArea.nrOfRows}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, nrOfRows: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Notes <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        rows={3}
                        value={newGrowArea.notes}
                        onChange={(e) =>
                          setNewGrowArea({ ...newGrowArea, notes: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowAdvanced(false);
                    setSelectedGrowArea(null);
                    setNewGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedGrowArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Grow Area</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong className="text-gray-900">{selectedGrowArea.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedGrowArea(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGrowArea}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
