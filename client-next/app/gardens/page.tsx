'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, Garden } from '@/lib/api';
import Link from 'next/link';

export default function GardensPage() {
  const router = useRouter();
  const { isAuthenticated, logout, username } = useAuth();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGarden, setNewGarden] = useState({
    name: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchGardens();
  }, [isAuthenticated, router]);

  const fetchGardens = async () => {
    try {
      setLoading(true);
      const data = await gardenService.getAll();
      setGardens(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load gardens');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await gardenService.create(newGarden);
      setShowCreateModal(false);
      setNewGarden({ name: '', description: '', location: '' });
      fetchGardens();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create garden');
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">RegenGarden</h1>
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Gardens</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + New Garden
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading gardens...</div>
          </div>
        ) : gardens.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-500 mb-4">No gardens yet</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create your first garden
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gardens.map((garden) => (
              <Link
                key={garden.id}
                href={`/gardens/${garden.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {garden.name}
                </h3>
                {garden.description && (
                  <p className="text-gray-600 mb-2">{garden.description}</p>
                )}
                {garden.location && (
                  <p className="text-sm text-gray-500">📍 {garden.location}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Garden Modal */}
      {showCreateModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Create New Garden</h3>
            <form onSubmit={handleCreateGarden}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Garden Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newGarden.name}
                    onChange={(e) =>
                      setNewGarden({ ...newGarden, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    value={newGarden.description}
                    onChange={(e) =>
                      setNewGarden({ ...newGarden, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    value={newGarden.location}
                    onChange={(e) =>
                      setNewGarden({ ...newGarden, location: e.target.value })
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
                  Create Garden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

