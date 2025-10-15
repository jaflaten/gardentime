'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GrowAreaSearch from '../gardens/components/GrowAreaSearch';
import PlantSearch from '../gardens/components/PlantSearch';
import { GrowArea, Plant } from '@/lib/api';
import Link from 'next/link';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, username } = useAuth();
  const [selectedGrowArea, setSelectedGrowArea] = useState<GrowArea | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Search</h1>
              <p className="text-sm text-gray-500 mt-1">
                Search for grow areas and plants across all your gardens
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {username}</span>
              <Link
                href="/gardens"
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Back to Gardens
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grow Area Search Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                🌱 Search Grow Areas
              </h2>
              <p className="text-sm text-gray-600">
                Find grow areas across all your gardens by name
              </p>
            </div>

            <GrowAreaSearch
              placeholder="Type to search grow areas..."
              onSelect={(growArea: GrowArea) => setSelectedGrowArea(growArea)}
              autoFocus={true}
            />

            {selectedGrowArea && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Selected Grow Area</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {selectedGrowArea.name}
                  </p>
                  {selectedGrowArea.zoneType && (
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {selectedGrowArea.zoneType}
                    </p>
                  )}
                  {selectedGrowArea.zoneSize && (
                    <p className="text-sm">
                      <span className="font-medium">Size:</span> {selectedGrowArea.zoneSize}
                    </p>
                  )}
                  {selectedGrowArea.notes && (
                    <p className="text-sm">
                      <span className="font-medium">Notes:</span> {selectedGrowArea.notes}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/gardens/${selectedGrowArea.gardenId}/grow-areas/${selectedGrowArea.id}`}
                      className="inline-block px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Type any part of a grow area name</li>
                <li>• Use arrow keys to navigate results</li>
                <li>• Press Enter to select</li>
                <li>• Press Escape to close dropdown</li>
              </ul>
            </div>
          </div>

          {/* Plant Search Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                🌿 Search Plants
              </h2>
              <p className="text-sm text-gray-600">
                Find plants by name or scientific name for crop planning
              </p>
            </div>

            <PlantSearch
              placeholder="Type to search plants..."
              onSelect={(plant) => setSelectedPlant(plant)}
            />

            {selectedPlant && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Selected Plant</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Name:</span> {selectedPlant.name}
                  </p>
                  {selectedPlant.scientificName && (
                    <p className="text-sm text-gray-900 italic">
                      <span className="font-medium">Scientific Name:</span> {selectedPlant.scientificName}
                    </p>
                  )}
                  {selectedPlant.plantType && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Type:</span> {selectedPlant.plantType.replace(/_/g, ' ')}
                    </p>
                  )}
                  {selectedPlant.growingSeason && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Growing Season:</span> {selectedPlant.growingSeason}
                    </p>
                  )}
                  {selectedPlant.maturityTime && selectedPlant.maturityTime > 0 && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Maturity Time:</span> {selectedPlant.maturityTime} days
                    </p>
                  )}
                  {selectedPlant.sunReq && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">☀️ Sun Requirements:</span> {selectedPlant.sunReq}
                    </p>
                  )}
                  {selectedPlant.waterReq && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">💧 Water Requirements:</span> {selectedPlant.waterReq}
                    </p>
                  )}
                  {selectedPlant.soilType && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">🌱 Soil Type:</span> {selectedPlant.soilType}
                    </p>
                  )}
                  {selectedPlant.spaceReq && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">📏 Space Requirements:</span> {selectedPlant.spaceReq}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Search by common or scientific name</li>
                <li>• Autocomplete shows matching plants</li>
                <li>• Use this when creating crop records</li>
                <li>• Database includes many common vegetables</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Description */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✨ Search Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔍 Smart Search</h3>
              <p className="text-sm text-gray-600">
                Case-insensitive partial matching helps you find results quickly
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⚡ Real-time</h3>
              <p className="text-sm text-gray-600">
                Results appear as you type with 300ms debouncing for performance
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔒 Secure</h3>
              <p className="text-sm text-gray-600">
                Only searches your own grow areas across all your gardens
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⌨️ Keyboard Navigation</h3>
              <p className="text-sm text-gray-600">
                Use arrow keys, Enter, and Escape for quick navigation
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive</h3>
              <p className="text-sm text-gray-600">
                Works seamlessly on desktop, tablet, and mobile devices
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Context Aware</h3>
              <p className="text-sm text-gray-600">
                Shows relevant details like size, type, and notes in results
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
