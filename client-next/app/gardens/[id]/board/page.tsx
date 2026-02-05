'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { gardenService, growAreaService, cropRecordService, Garden, GrowArea } from '@/lib/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import GardenNavigation from '../components/GardenNavigation';
import AddCropModal from '../components/AddCropModal';

// Dynamically import GardenBoardView with SSR disabled (Konva requires browser environment)
const GardenBoardView = dynamic(() => import('../components/GardenBoardView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-500">Loading board view...</div>
    </div>
  ),
});

export default function GardenBoardPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;
  const { isAuthenticated, logout, username, isLoading } = useAuth();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [growAreas, setGrowAreas] = useState<GrowArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [cropModalGrowArea, setCropModalGrowArea] = useState<GrowArea | null>(null);

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

  const openAddCropModal = (growArea: GrowArea) => {
    setCropModalGrowArea(growArea);
    setShowAddCropModal(true);
  };

  const handleCropCreated = () => {
    fetchGardenData();
  };

  const handleUpdatePosition = async (id: string, x: number, y: number) => {
    setGrowAreas(prevAreas =>
      prevAreas.map(area =>
        area.id === id ? { ...area, positionX: x, positionY: y } : area
      )
    );

    try {
      await growAreaService.update(id, {
        positionX: x,
        positionY: y,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update position');
      fetchGardenData();
    }
  };

  const handleUpdatePositions = async (updates: Array<{ id: string; x: number; y: number }>) => {
    setGrowAreas(prevAreas =>
      prevAreas.map(area => {
        const update = updates.find(u => u.id === area.id);
        return update ? { ...area, positionX: update.x, positionY: update.y } : area;
      })
    );

    try {
      await Promise.all(
        updates.map(update =>
          growAreaService.update(update.id, {
            positionX: update.x,
            positionY: update.y,
          })
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update positions');
      fetchGardenData();
    }
  };

  const handleUpdateDimensions = async (id: string, width: number, height: number) => {
    try {
      await growAreaService.update(id, {
        width: width,
        length: height,
      });

      setGrowAreas(prevAreas =>
        prevAreas.map(area =>
          area.id === id ? { ...area, width: width, length: height } : area
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update dimensions');
      fetchGardenData();
    }
  };

  const handleSelectGrowAreaFromBoard = (growArea: GrowArea) => {
    // Navigate to grow area details
    router.push(`/gardens/${gardenId}/grow-areas/${growArea.id}`);
  };

  const handleExport = async () => {
    try {
      const exportData = await gardenService.exportGarden(gardenId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${garden?.name || 'garden'}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to export garden');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <GardenNavigation gardenId={gardenId} />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <GardenNavigation gardenId={gardenId} gardenName={garden?.name} onExport={handleExport} />

      <main className="flex-grow">
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {growAreas.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-600 mb-4">No grow areas yet</div>
              <p className="text-sm text-gray-500 mb-6">
                Create grow areas from the Grow Areas page to start planning your garden.
              </p>
              <Link
                href={`/gardens/${gardenId}/grow-areas`}
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Go to Grow Areas
              </Link>
            </div>
          </div>
        ) : (
          <GardenBoardView
            gardenId={gardenId}
            growAreas={growAreas}
            onUpdatePosition={handleUpdatePosition}
            onUpdatePositions={handleUpdatePositions}
            onUpdateDimensions={handleUpdateDimensions}
            onSelectGrowArea={handleSelectGrowAreaFromBoard}
            onAddCrop={openAddCropModal}
          />
        )}
      </main>

      <Footer />

      {showAddCropModal && cropModalGrowArea && (
        <AddCropModal
          isOpen={showAddCropModal}
          onClose={() => {
            setShowAddCropModal(false);
            setCropModalGrowArea(null);
          }}
          onSuccess={handleCropCreated}
          growAreaId={cropModalGrowArea.id}
          growAreaName={cropModalGrowArea.name}
        />
      )}
    </div>
  );
}
