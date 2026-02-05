'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, Garden, GardenExportData } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function GardensPage() {
  const router = useRouter();
  const { isAuthenticated, logout, username } = useAuth();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<GardenExportData | null>(null);
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [newGarden, setNewGarden] = useState({
    name: '',
    description: '',
    location: '',
  });
  const [gardenToDelete, setGardenToDelete] = useState<Garden | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.garden?.name) {
          setImportError('Invalid file: missing garden name');
          return;
        }
        setImportData(data);
        setImportName(data.garden.name);
        setImportError('');
      } catch {
        setImportError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData || !importName.trim()) return;

    setImporting(true);
    try {
      await gardenService.importGarden({
        ...importData,
        gardenName: importName.trim()
      });
      setShowImportModal(false);
      setImportData(null);
      setImportName('');
      fetchGardens();
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportData(null);
    setImportName('');
    setImportError('');
  };

  const handleDeleteGarden = async () => {
    if (!gardenToDelete) return;
    try {
      await gardenService.delete(gardenToDelete.id);
      setGardenToDelete(null);
      fetchGardens();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete garden');
      setGardenToDelete(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gardenToDelete && e.key === 'Enter') {
        handleDeleteGarden();
      }
    };
    if (gardenToDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gardenToDelete]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Gardens</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              Import Garden
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              + New Garden
            </button>
          </div>
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
              <div
                key={garden.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition relative group"
                data-testid="garden-card"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGardenToDelete(garden);
                  }}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete garden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <Link
                  href={`/gardens/${garden.id}`}
                  className="block"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Garden Modal */}
      {showCreateModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Create New Garden
            </h3>
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

      {/* Import Garden Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Import Garden</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select JSON file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            {importData && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garden Name *
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter name for imported garden"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {importData.growAreas.length} grow area(s) will be imported
                </p>
              </div>
            )}

            {importError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded text-sm">
                {importError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeImportModal}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData || !importName.trim() || importing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {gardenToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Delete Garden</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{gardenToDelete.name}</strong>? This will also delete all grow areas and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setGardenToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGarden}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
