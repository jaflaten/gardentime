'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { growAreaService, cropRecordService, plantService, GrowArea, CropRecord, Plant, ZoneType, CropStatus } from '@/lib/api';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import PageSkeleton from '@/app/components/PageSkeleton';
import { extractErrorMessage } from '@/lib/utils/errors';
import {
  CropRecordCard,
  CreateCropModal,
  EditGrowAreaModal,
  EditCropModal,
  DeleteCropModal,
  CropRecordFormData,
  emptyCropRecordForm,
  Outcome,
} from './components';

export default function GrowAreaDetailPage() {
  const params = useParams();
  const gardenId = params.id as string;
  const growAreaId = params.growAreaId as string;
  const { isReady } = useRequireAuth();
  
  // Data state
  const [growArea, setGrowArea] = useState<GrowArea | null>(null);
  const [cropRecords, setCropRecords] = useState<CropRecord[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal visibility state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditCropModal, setShowEditCropModal] = useState(false);
  const [showDeleteCropModal, setShowDeleteCropModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Form state
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
    outcome: '' as Outcome,
    status: '' as '' | CropStatus,
    quantityHarvested: '',
    unit: '',
  });
  const [selectedCropRecord, setSelectedCropRecord] = useState<CropRecord | null>(null);
  const [editCropRecord, setEditCropRecord] = useState<CropRecordFormData>(emptyCropRecordForm);

  useEffect(() => {
    if (isReady) {
      fetchData();
    }
  }, [isReady, growAreaId]);

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
      setPlants(Array.isArray(plantsData) ? plantsData : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load data'));
      setPlants([]);
      setCropRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCropRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedPlant = plants.find(p => p.id === newCropRecord.plantId);
      if (!selectedPlant) {
        setError('Please select a plant');
        return;
      }

      await cropRecordService.create({
        growAreaId: growAreaId,
        plantId: newCropRecord.plantId,
        plantName: selectedPlant.name,
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
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create crop record'));
    }
  };

  const handleEditGrowArea = () => {
    if (!growArea) return;
    setEditGrowArea({
      name: growArea.name,
      zoneSize: growArea.zoneSize || '',
      zoneType: growArea.zoneType || '',
      nrOfRows: growArea.nrOfRows?.toString() || '',
      notes: growArea.notes || '',
    });
    setShowEditModal(true);
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
      setEditGrowArea({ name: '', zoneSize: '', zoneType: '', nrOfRows: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update grow area'));
    }
  };

  const handleEditCropRecord = (record: CropRecord) => {
    setSelectedCropRecord(record);
    setEditCropRecord({
      datePlanted: record.datePlanted,
      dateHarvested: record.dateHarvested || '',
      notes: record.notes || '',
      outcome: (record.outcome || '') as Outcome,
      status: record.status || '',
      quantityHarvested: record.quantityHarvested ? record.quantityHarvested.toString() : '',
      unit: record.unit || '',
    });
    setShowEditCropModal(true);
  };

  const handleUpdateCropRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropRecord) return;
    
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
      setEditCropRecord(emptyCropRecordForm);
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update crop record'));
    }
  };

  const handleDeleteCropRecord = async () => {
    if (!selectedCropRecord) return;
    
    try {
      await cropRecordService.delete(selectedCropRecord.id);
      setShowDeleteCropModal(false);
      setSelectedCropRecord(null);
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete crop record'));
    }
  };

  const openDeleteModal = (record: CropRecord) => {
    setSelectedCropRecord(record);
    setShowDeleteCropModal(true);
  };

  // Helper function to determine if a crop is active
  const isActiveCrop = (record: CropRecord): boolean => {
    return record.status === 'PLANTED' || record.status === 'GROWING' || !record.dateHarvested;
  };

  const activeCrops = cropRecords.filter(isActiveCrop);
  const historicalCrops = cropRecords.filter(record => !isActiveCrop(record));

  if (!isReady || loading) {
    return <PageSkeleton />;
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
                  <CropRecordCard
                    key={record.id}
                    record={record}
                    onEdit={handleEditCropRecord}
                    onDelete={openDeleteModal}
                  />
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
                      <CropRecordCard
                        key={record.id}
                        record={record}
                        isHistorical
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <CreateCropModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCropRecord}
        formData={newCropRecord}
        setFormData={setNewCropRecord}
        plants={plants}
      />

      <EditGrowAreaModal
        isOpen={showEditModal && !!growArea}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateGrowArea}
        formData={editGrowArea}
        setFormData={setEditGrowArea}
      />

      <EditCropModal
        isOpen={showEditCropModal}
        onClose={() => setShowEditCropModal(false)}
        onSubmit={handleUpdateCropRecord}
        selectedRecord={selectedCropRecord}
        formData={editCropRecord}
        setFormData={setEditCropRecord}
      />

      <DeleteCropModal
        isOpen={showDeleteCropModal}
        onClose={() => setShowDeleteCropModal(false)}
        onConfirm={handleDeleteCropRecord}
        selectedRecord={selectedCropRecord}
      />
    </div>
  );
}
