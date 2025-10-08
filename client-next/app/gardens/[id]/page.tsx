'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, growAreaService, Garden, GrowArea } from '@/lib/api';
import Link from 'next/link';

export default function GardenDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string; // FIXED: Keep as string (UUID), don't parse as int
  const { isAuthenticated, logout, username } = useAuth();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [growAreas, setGrowAreas] = useState<GrowArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGrowArea, setNewGrowArea] = useState({
    name: '',
    description: '',
    sizeM2: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchGardenData();
  }, [isAuthenticated, gardenId, router]);

  const fetchGardenData = async () => {
    try {
      setLoading(true);
      const [gardenData, growAreasData] = await Promise.all([
        gardenService.getById(gardenId),
        growAreaService.getByGardenId(gardenId),
      ]);
      setGarden(gardenData);
      setGrowAreas(growAreasData);
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
        description: newGrowArea.description,
        gardenId: gardenId,
        sizeM2: newGrowArea.sizeM2 ? parseFloat(newGrowArea.sizeM2) : undefined,
      });
      setShowCreateModal(false);
      setNewGrowArea({ name: '', description: '', sizeM2: '' });
      fetchGardenData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create grow area');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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
            <div className="flex items-center gap-4">
              <Link href="/gardens" className="text-2xl font-bold text-green-600">
                GardenTime
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700">{garden?.name || 'Garden'}</span>
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
            href="/gardens"
            className="text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Back to Gardens
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Garden Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {garden?.name}
              </h1>
              {garden?.description && (
                <p className="text-gray-600 mb-2">{garden.description}</p>
              )}
              {garden?.location && (
                <p className="text-gray-500">📍 {garden.location}</p>
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
                <div className="text-gray-500 mb-4">No grow areas yet</div>
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
                  <Link
                    key={growArea.id}
                    href={`/gardens/${gardenId}/grow-areas/${growArea.id}`}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {growArea.name}
                    </h3>
                    {growArea.description && (
                      <p className="text-gray-600 mb-2">{growArea.description}</p>
                    )}
                    {growArea.sizeM2 && (
                      <p className="text-sm text-gray-500">
                        📏 {growArea.sizeM2} m²
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Grow Area Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create New Grow Area</h3>
            <form onSubmit={handleCreateGrowArea}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newGrowArea.name}
                    onChange={(e) =>
                      setNewGrowArea({ ...newGrowArea, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    value={newGrowArea.description}
                    onChange={(e) =>
                      setNewGrowArea({ ...newGrowArea, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newGrowArea.sizeM2}
                    onChange={(e) =>
                      setNewGrowArea({ ...newGrowArea, sizeM2: e.target.value })
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
