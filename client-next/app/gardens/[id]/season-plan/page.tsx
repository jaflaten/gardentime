'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SeasonPlan, PlannedCrop, GardenClimateInfo } from '@/types/season-planning';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import GardenNavigation from '../components/GardenNavigation';

export default function SeasonPlanPage() {
  const params = useParams();
  const router = useRouter();
  const gardenId = params.id as string;

  const [climateInfo, setClimateInfo] = useState<GardenClimateInfo | null>(null);
  const [seasonPlans, setSeasonPlans] = useState<SeasonPlan[]>([]);
  const [currentSeasonPlan, setCurrentSeasonPlan] = useState<SeasonPlan | null>(null);
  const [plannedCrops, setPlannedCrops] = useState<PlannedCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showClimateSetup, setShowClimateSetup] = useState(false);
  const [gardenName, setGardenName] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [gardenId]);

  const fetchData = async () => {
    try {
      // Fetch garden info for name
      const gardenRes = await api.get(`/gardens/${gardenId}`);
      if (gardenRes.data) {
        setGardenName(gardenRes.data.name);
      }

      // Fetch climate info
      const climateRes = await api.get(`/gardens/${gardenId}/climate`);
      if (climateRes.data) {
        setClimateInfo(climateRes.data);
        
        // Check if climate info is set up
        if (!climateRes.data.lastFrostDate) {
          setShowClimateSetup(true);
        }
      }

      // Fetch season plans
      const plansRes = await api.get(`/gardens/${gardenId}/season-plans`);
      if (plansRes.data) {
        const plans = plansRes.data;
        setSeasonPlans(plans);
        
        // Get current season plan (most recent)
        if (plans.length > 0) {
          const current = plans[0];
          setCurrentSeasonPlan(current);
          
          // Fetch planned crops for current season
          const cropsRes = await api.get(
            `/gardens/${gardenId}/season-plans/${current.id}/planned-crops`
          );
          if (cropsRes.data) {
            setPlannedCrops(cropsRes.data);
          }
        } else {
          setShowCreatePlan(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch season planning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClimateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      lastFrostDate: formData.get('lastFrostDate') as string || null,
      firstFrostDate: formData.get('firstFrostDate') as string || null,
      hardinessZone: formData.get('hardinessZone') as string || null,
      latitude: null,
      longitude: null
    };

    try {
      const res = await api.put(`/gardens/${gardenId}/climate`, data);
      if (res.data) {
        setClimateInfo(res.data);
        setShowClimateSetup(false);
      }
    } catch (error) {
      console.error('Failed to save climate info:', error);
    }
  };

  const handleCreateSeasonPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      season: formData.get('season') as string,
      year: parseInt(formData.get('year') as string)
    };

    try {
      const res = await api.post(`/gardens/${gardenId}/season-plans`, data);
      if (res.data) {
        fetchData();
        setShowCreatePlan(false);
      }
    } catch (error) {
      console.error('Failed to create season plan:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <GardenNavigation gardenId={gardenId} gardenName={gardenName} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading season planning...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <GardenNavigation gardenId={gardenId} gardenName={gardenName} />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Season Planning</h1>
            <p className="text-gray-600">Plan your growing season with indoor seed starting reminders</p>
          </div>

          {/* Climate Setup Modal */}
          {showClimateSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Set Up Climate Information</h2>
            <p className="text-gray-600 mb-4">
              To help you plan when to start seeds indoors, we need to know your frost dates.
            </p>
            <form onSubmit={handleSaveClimateInfo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Frost Date (Spring)
                </label>
                <input
                  type="date"
                  name="lastFrostDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., May 15"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When does frost typically end in spring?
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Frost Date (Fall)
                </label>
                <input
                  type="date"
                  name="firstFrostDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., October 1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When does frost typically start in fall?
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hardiness Zone (Optional)
                </label>
                <input
                  type="text"
                  name="hardinessZone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 7a"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Save Climate Info
                </button>
                <button
                  type="button"
                  onClick={() => setShowClimateSetup(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Skip for Now
                </button>
              </div>
            </form>
          </div>
        </div>
          )}

          {/* Create Season Plan Modal */}
          {showCreatePlan && (
        <div className="fixed inset-0 bg-black text-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Season Plan</h2>
            <form onSubmit={handleCreateSeasonPlan}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <select
                  name="season"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue="SPRING"
                >
                  <option value="SPRING">Spring</option>
                  <option value="SUMMER">Summer</option>
                  <option value="FALL">Fall</option>
                  <option value="WINTER">Winter</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  required
                  defaultValue={new Date().getFullYear()}
                  min="2020"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Create Season Plan
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePlan(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
          )}

          {/* Main Content */}
          {currentSeasonPlan && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentSeasonPlan.season} {currentSeasonPlan.year}
                </h2>
                <p className="text-gray-600 mt-1">
                  {plannedCrops.length} crops planned
                </p>
              </div>
              <button
                onClick={() => setShowCreatePlan(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                New Season Plan
              </button>
            </div>

            {climateInfo?.lastFrostDate && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Last Frost Date:</strong> {new Date(climateInfo.lastFrostDate).toLocaleDateString()}
                </p>
                {climateInfo.firstFrostDate && (
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>First Frost Date:</strong> {new Date(climateInfo.firstFrostDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Planned Crops */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Planned Crops</h3>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Add Crop
              </button>
            </div>

            {plannedCrops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No crops planned yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add crops to your season plan to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {plannedCrops.map((crop) => (
                  <div
                    key={crop.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{crop.plantName}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {crop.quantity} | Status: {crop.status}
                        </p>
                        {crop.indoorStartDate && (
                          <p className="text-sm text-blue-600 mt-1">
                            🔵 Start seeds indoors: {new Date(crop.indoorStartDate).toLocaleDateString()}
                          </p>
                        )}
                        {crop.transplantDate && (
                          <p className="text-sm text-green-600 mt-1">
                            🟢 Transplant outdoors: {new Date(crop.transplantDate).toLocaleDateString()}
                          </p>
                        )}
                        {crop.expectedHarvestDate && (
                          <p className="text-sm text-yellow-600 mt-1">
                            🟡 Expected harvest: {new Date(crop.expectedHarvestDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Edit
                        </button>
                        <button className="text-sm text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push(`/gardens/${gardenId}/dashboard`)}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="text-sm text-gray-600">Go to</div>
              <div className="font-semibold text-gray-900">Dashboard</div>
            </button>
            <button
              onClick={() => setShowClimateSetup(true)}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="text-sm text-gray-600">Update</div>
              <div className="font-semibold text-gray-900">Climate Info</div>
            </button>
            <button
              onClick={() => router.push(`/gardens/${gardenId}/board`)}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="text-sm text-gray-600">View</div>
              <div className="font-semibold text-gray-900">Garden Board</div>
            </button>
          </div>
            </div>
          )}

          {!currentSeasonPlan && !showCreatePlan && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Season Plans Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first season plan to start planning what to grow
          </p>
          <button
            onClick={() => setShowCreatePlan(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
          >
            Create Season Plan
            </button>
          </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
