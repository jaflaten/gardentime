'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { gardenService, Garden, GardenExportData } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import PageSkeleton from '@/app/components/PageSkeleton';
import { Button, Input, Modal, FormField, Card } from '@/components/ui';

export default function GardensPage() {
  const router = useRouter();
  const { isReady, logout } = useRequireAuth();
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
    if (isReady) {
      fetchGardens();
    }
  }, [isReady]);

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

  if (!isReady) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Gardens</h2>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
            >
              Import Garden
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              + New Garden
            </Button>
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Garden">
        <form onSubmit={handleCreateGarden}>
          <div className="space-y-4">
            <FormField label="Garden Name" required>
              <Input
                type="text"
                required
                value={newGarden.name}
                onChange={(e) =>
                  setNewGarden({ ...newGarden, name: e.target.value })
                }
              />
            </FormField>
            <FormField label="Description">
              <textarea
                className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                rows={3}
                value={newGarden.description}
                onChange={(e) =>
                  setNewGarden({ ...newGarden, description: e.target.value })
                }
              />
            </FormField>
            <FormField label="Location">
              <Input
                type="text"
                value={newGarden.location}
                onChange={(e) =>
                  setNewGarden({ ...newGarden, location: e.target.value })
                }
              />
            </FormField>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Garden
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Garden Modal */}
      <Modal isOpen={showImportModal} onClose={closeImportModal} title="Import Garden">
        <FormField label="Select JSON file">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </FormField>

        {importData && (
          <div className="mt-4">
            <FormField label="Garden Name" required>
              <Input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Enter name for imported garden"
              />
            </FormField>
            <p className="mt-2 text-sm text-gray-500">
              {importData.growAreas.length} grow area(s) will be imported
            </p>
          </div>
        )}

        {importError && (
          <div className="mt-4 p-3 bg-red-50 text-red-800 rounded text-sm">
            {importError}
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={closeImportModal}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importData || !importName.trim() || importing}
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!gardenToDelete} 
        onClose={() => setGardenToDelete(null)} 
        title="Delete Garden"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{gardenToDelete?.name}</strong>? This will also delete all grow areas and cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setGardenToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteGarden}>
            Delete
          </Button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
