'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { GardenDashboard } from '@/types/dashboard';
import GardenSummaryCard from '@/components/dashboard/GardenSummaryCard';
import ActiveCropsWidget from '@/components/dashboard/ActiveCropsWidget';
import RecentHarvestsWidget from '@/components/dashboard/RecentHarvestsWidget';
import UpcomingTasksWidget from '@/components/dashboard/UpcomingTasksWidget';
import GardenCapacityWidget from '@/components/dashboard/GardenCapacityWidget';
import PlantingCalendarWidget from '@/components/dashboard/PlantingCalendarWidget';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import GardenNavigation from '../components/GardenNavigation';

export default function GardenDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const gardenId = params?.id as string;

  const [dashboard, setDashboard] = useState<GardenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gardenId) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get<GardenDashboard>(`/gardens/${gardenId}/dashboard`);
        setDashboard(response.data);
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        setError(err.response?.data?.message || err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [gardenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <GardenNavigation gardenId={gardenId} />
        <div className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-48 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <GardenNavigation gardenId={gardenId} />
        <div className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-600">{error || 'Unable to load dashboard data'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <GardenNavigation gardenId={gardenId} gardenName={dashboard.summary.gardenName} />
      
      <main className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          {/* Garden Summary - Full Width */}
          <GardenSummaryCard summary={dashboard.summary} />

          {/* Widgets Grid - 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Crops Widget */}
            <ActiveCropsWidget data={dashboard.activeCrops} />

            {/* Recent Harvests Widget */}
            <RecentHarvestsWidget harvests={dashboard.recentHarvests} />

            {/* Garden Capacity Widget */}
            <GardenCapacityWidget data={dashboard.capacity} />

            {/* Upcoming Tasks Widget - Spans 2 columns on desktop */}
            <div className="md:col-span-2 lg:col-span-2">
              <UpcomingTasksWidget tasks={dashboard.upcomingTasks} />
            </div>

            {/* Planting Calendar Widget */}
            <PlantingCalendarWidget data={dashboard.plantingCalendar} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
