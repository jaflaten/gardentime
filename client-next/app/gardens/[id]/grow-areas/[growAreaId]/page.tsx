'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { growAreaService, cropRecordService, plantService, GrowArea, CropRecord, Plant, ZoneType, CropStatus } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function GrowAreaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;
  const growAreaId = params.growAreaId as string;
  const { isAuthenticated, logout, username, isLoading } = useAuth();
  const [growArea, setGrowArea] = useState<GrowArea | null>(null);
  const [cropRecords, setCropRecords] = useState<CropRecord[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editGrowArea, setEditGrowArea] = useState({
    name: '',
    zoneSize: '',
    zoneType: '' as ZoneType | '',
    nrOfRows: '',
    notes: '',
  });
  const [newCropRecord, setNewCropRecord] = useState({
    plantId: '',
    datePlanted: '',
    dateHarvested: '',
    notes: '',
    outcome: '' as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    status: '' as '' | CropStatus,
    quantityHarvested: '',
    unit: '',
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [showDeleteCropModal, setShowDeleteCropModal] = useState(false);
  const [selectedCropRecord, setSelectedCropRecord] = useState<CropRecord | null>(null);
  const [editCropRecord, setEditCropRecord] = useState({
    datePlanted: '',
    dateHarvested: '',
    notes: '',
    outcome: '' as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR',
    status: '' as '' | CropStatus,
    quantityHarvested: '',
    unit: '',
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, isLoading, growAreaId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching grow area with ID:', growAreaId);
      const [growAreaData, cropRecordsData, plantsData] = await Promise.all([
        growAreaService.getById(growAreaId),
        cropRecordService.getByGrowAreaId(growAreaId),
        plantService.getAll(),
      ]);
      console.log('Grow area data received:', growAreaData);
      console.log('Plants data received:', plantsData);
      setGrowArea(growAreaData);
      setCropRecords(cropRecordsData);
      // Ensure plantsData is an array before setting
      setPlants(Array.isArray(plantsData) ? plantsData : []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
      // Set empty arrays on error to prevent map errors
      setPlants([]);
      setCropRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCropRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find the selected plant to get its name
      const selectedPlant = plants.find(p => p.id === newCropRecord.plantId);
      if (!selectedPlant) {
        setError('Please select a plant');
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
        status: '',
        quantityHarvested: '',
        unit: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create crop record');
    }
  };

  const handleEditGrowArea = () => {
    console.log('Edit button clicked!', { growArea, showEditModal });
    if (!growArea) {
      console.error('No grow area data available');
      return;
    }

    setEditGrowArea({
      name: growArea.name,
      zoneSize: growArea.zoneSize || '',
      zoneType: growArea.zoneType || '',
      nrOfRows: growArea.nrOfRows?.toString() || '',
      notes: growArea.notes || '',
    });
    setShowEditModal(true);
    console.log('Modal should be shown now');
  };

  const handleUpdateGrowArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!growArea) return;

    try {
      await growAreaService.update(growArea.id, {
        name: editGrowArea.name || undefined,
        zoneSize: editGrowArea.zoneSize || undefined,
        zoneType: editGrowArea.zoneType || undefined,
        nrOfRows: editGrowArea.nrOfRows ? parseInt(editGrowArea.nrOfRows) : undefined,
        notes: editGrowArea.notes || undefined,
      });
      setShowEditModal(false);
      setShowAdvanced(false);
      setEditGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update grow area');
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

  const getStatusBadgeColor = (status?: CropStatus) => {
    switch (status) {
      case 'PLANTED': return 'bg-green-100 text-green-800 border-green-300';
      case 'GROWING': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'HARVESTED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'DISEASED': return 'bg-red-100 text-red-800 border-red-300';
      case 'FAILED': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status?: CropStatus) => {
    switch (status) {
      case 'PLANTED': return '🌱';
      case 'GROWING': return '🌿';
      case 'HARVESTED': return '✅';
      case 'DISEASED': return '🦠';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  };

  // Helper function to determine if a crop is active
  const isActiveCrop = (record: CropRecord): boolean => {
    return record.status === 'PLANTED' || record.status === 'GROWING' || !record.dateHarvested;
  };

  // Separate active and historical crops
  const activeCrops = cropRecords.filter(isActiveCrop);
  const historicalCrops = cropRecords.filter(record => !isActiveCrop(record));

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        breadcrumbs={[
          { label: 'Garden', href: `/gardens/${gardenId}` },
          { label: growArea?.name || 'Grow Area' }
        ]}
      />

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <Link
            href={`/gardens/${gardenId}`}
            className="text-green-600 hover:text-green-700 flex items-center gap-2 font-medium"
          >
            ← Back to Garden
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Grow Area Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {growArea?.name}
                  </h1>
                  <div className="space-y-1 text-sm text-gray-700">
                    {growArea?.zoneType && (
                      <p className="flex items-center gap-2">
                        <span className="text-lg">
                          {growArea.zoneType === 'BOX' && '📦'}
                          {growArea.zoneType === 'FIELD' && '🌾'}
                          {growArea.zoneType === 'BED' && '🛏️'}
                          {growArea.zoneType === 'BUCKET' && '🪣'}
                        </span>
                        <span className="font-medium">Type: {growArea.zoneType}</span>
                      </p>
                    )}
                    {growArea?.zoneSize && (
                      <p>📏 Size: {growArea.zoneSize}</p>
                    )}
                    {growArea?.nrOfRows && (
                      <p>🌱 Rows: {growArea.nrOfRows}</p>
                    )}
                    {growArea?.notes && (
                      <p className="text-gray-600 italic mt-2">{growArea.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleEditGrowArea}
                  className="ml-4 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                  title="Edit Grow Area"
                  data-testid="grow-area-edit-btn"
                >
                  <span className="text-lg">✏️</span>
                  <span className="font-medium">Edit</span>
                </button>
              </div>
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

            {activeCrops.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-500 mb-4">No active crop records</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Add your first crop record
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCrops.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
                    data-testid="crop-record-card"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {record.plantName || `Plant #${record.plantId}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Planted: {new Date(record.datePlanted).toLocaleDateString()}
                        </p>
                        {record.status && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(record.status)}`}>
                              <span>{getStatusIcon(record.status)}</span>
                              <span>{record.status}</span>
                            </span>
                          </div>
                        )}
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
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setSelectedCropRecord(record);
                          setEditCropRecord({
                            datePlanted: record.datePlanted,
                            dateHarvested: record.dateHarvested || '',
                            notes: record.notes || '',
                            outcome: record.outcome || '',
                            status: record.status || '',
                            quantityHarvested: record.quantityHarvested ? record.quantityHarvested.toString() : '',
                            unit: record.unit || '',
                          });
                          setShowEditCropModal(true);
                        }}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                        data-testid={`crop-record-edit-btn-${record.id}`}
                      >
                        <span className="text-lg">✏️</span>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCropRecord(record);
                          setShowDeleteCropModal(true);
                        }}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center gap-2"
                        data-testid={`crop-record-delete-btn-${record.id}`}
                      >
                        <span className="text-lg">🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Historical Crops Section */}
            {historicalCrops.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Historical Crop Records</h3>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    {showHistory ? '▼' : '▶'} {showHistory ? 'Hide' : 'Show'} historical records
                  </button>
                </div>

                {showHistory && (
                  <div className="space-y-4">
                    {historicalCrops.map((record) => (
                      <div
                        key={record.id}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition opacity-75"
                        data-testid="crop-record-card-historical"
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
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {/* Create Crop Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Crop Record
            </h3>
            <form onSubmit={handleCreateCropRecord} className="space-y-4">
              <div>
                <label htmlFor="plantId" className="block text-sm font-medium text-gray-700">
                  Plant
                </label>
                <select
                  id="plantId"
                  value={newCropRecord.plantId}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, plantId: e.target.value })}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select a plant</option>
                  {plants.map(plant => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="datePlanted" className="block text-sm font-medium text-gray-700">
                  Date Planted
                </label>
                <input
                  type="date"
                  id="datePlanted"
                  value={newCropRecord.datePlanted}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, datePlanted: e.target.value })}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="dateHarvested" className="block text-sm font-medium text-gray-700">
                  Date Harvested (optional)
                </label>
                <input
                  type="date"
                  id="dateHarvested"
                  value={newCropRecord.dateHarvested}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, dateHarvested: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={newCropRecord.notes}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, notes: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">
                  Outcome
                </label>
                <select
                  id="outcome"
                  value={newCropRecord.outcome}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, outcome: e.target.value as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select an outcome</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={newCropRecord.status}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, status: e.target.value as '' | CropStatus })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select a status</option>
                  <option value="PLANTED">Planted</option>
                  <option value="GROWING">Growing</option>
                  <option value="HARVESTED">Harvested</option>
                  <option value="DISEASED">Diseased</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantityHarvested" className="block text-sm font-medium text-gray-700">
                  Quantity Harvested
                </label>
                <input
                  type="number"
                  id="quantityHarvested"
                  value={newCropRecord.quantityHarvested}
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, quantityHarvested: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Enter quantity"
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
                  onChange={(e) => setNewCropRecord({ ...newCropRecord, unit: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Enter unit (e.g., kg, lbs)"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Create Crop Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grow Area Modal */}
      {showEditModal && growArea && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Grow Area
            </h3>
            <form onSubmit={handleUpdateGrowArea} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editGrowArea.name}
                  onChange={(e) => setEditGrowArea({ ...editGrowArea, name: e.target.value })}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="zoneSize" className="block text-sm font-medium text-gray-700">
                  Zone Size
                </label>
                <input
                  type="text"
                  id="zoneSize"
                  value={editGrowArea.zoneSize}
                  onChange={(e) => setEditGrowArea({ ...editGrowArea, zoneSize: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter zone size"
                />
              </div>
              <div>
                <label htmlFor="zoneType" className="block text-sm font-medium text-gray-700">
                  Zone Type
                </label>
                <select
                  id="zoneType"
                  value={editGrowArea.zoneType}
                  onChange={(e) => setEditGrowArea({ ...editGrowArea, zoneType: e.target.value as ZoneType })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select zone type</option>
                  <option value="BOX">Box</option>
                  <option value="FIELD">Field</option>
                  <option value="BED">Bed</option>
                  <option value="BUCKET">Bucket</option>
                </select>
              </div>
              <div>
                <label htmlFor="nrOfRows" className="block text-sm font-medium text-gray-700">
                  Number of Rows
                </label>
                <input
                  type="number"
                  id="nrOfRows"
                  value={editGrowArea.nrOfRows}
                  onChange={(e) => setEditGrowArea({ ...editGrowArea, nrOfRows: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter number of rows"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={editGrowArea.notes}
                  onChange={(e) => setEditGrowArea({ ...editGrowArea, notes: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Update Grow Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Crop Record Modal */}
      {showEditCropModal && selectedCropRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Crop Record
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await cropRecordService.update(selectedCropRecord.id, {
                  datePlanted: editCropRecord.datePlanted,
                  dateHarvested: editCropRecord.dateHarvested || undefined,
                  notes: editCropRecord.notes || undefined,
                  outcome: editCropRecord.outcome || undefined,
                  status: editCropRecord.status || undefined,
                  quantityHarvested: editCropRecord.quantityHarvested ? parseFloat(editCropRecord.quantityHarvested) : undefined,
                  unit: editCropRecord.unit || undefined,
                });
                setShowEditCropModal(false);
                setSelectedCropRecord(null);
                setEditCropRecord({
                  datePlanted: '',
                  dateHarvested: '',
                  notes: '',
                  outcome: '',
                  status: '',
                  quantityHarvested: '',
                  unit: '',
                });
                fetchData();
              } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to update crop record');
              }
            }} className="space-y-4">
              <div>
                <label htmlFor="datePlanted" className="block text-sm font-medium text-gray-700">
                  Date Planted
                </label>
                <input
                  type="date"
                  id="datePlanted"
                  value={editCropRecord.datePlanted}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, datePlanted: e.target.value })}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="dateHarvested" className="block text-sm font-medium text-gray-700">
                  Date Harvested (optional)
                </label>
                <input
                  type="date"
                  id="dateHarvested"
                  value={editCropRecord.dateHarvested}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, dateHarvested: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={editCropRecord.notes}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, notes: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">
                  Outcome
                </label>
                <select
                  id="outcome"
                  value={editCropRecord.outcome}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, outcome: e.target.value as '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select an outcome</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={editCropRecord.status}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, status: e.target.value as '' | CropStatus })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                >
                  <option value="">Select a status</option>
                  <option value="PLANTED">Planted</option>
                  <option value="GROWING">Growing</option>
                  <option value="HARVESTED">Harvested</option>
                  <option value="DISEASED">Diseased</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantityHarvested" className="block text-sm font-medium text-gray-700">
                  Quantity Harvested
                </label>
                <input
                  type="number"
                  id="quantityHarvested"
                  value={editCropRecord.quantityHarvested}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, quantityHarvested: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  value={editCropRecord.unit}
                  onChange={(e) => setEditCropRecord({ ...editCropRecord, unit: e.target.value })}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Enter unit (e.g., kg, lbs)"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditCropModal(false)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Update Crop Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Crop Record Modal */}
      {showDeleteCropModal && selectedCropRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Delete Crop Record
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the crop record for {selectedCropRecord.plantName || `Plant #${selectedCropRecord.plantId}`}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteCropModal(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await cropRecordService.delete(selectedCropRecord.id);
                    setShowDeleteCropModal(false);
                    setSelectedCropRecord(null);
                    fetchData();
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to delete crop record');
                  }
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Delete Crop Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
