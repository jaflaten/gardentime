'use client';

import { useState, useEffect, useRef } from 'react';
import { plantService, Plant } from '@/lib/api';
import DevLabel from '@/components/DevLabel';

interface PlantSearchProps {
  placeholder?: string;
  onSelect: (plant: Plant) => void;
  autoFocus?: boolean;
  className?: string;
  initialValue?: string;
}

function PlantSearchContent({
  placeholder = 'Search plants...',
  onSelect,
  autoFocus = false,
  className = '',
  initialValue = ''
}: PlantSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Plant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const searchResults = await plantService.search(searchQuery);
      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (plant: Plant) => {
    onSelect(plant);
    setQuery(plant.name);
    setShowResults(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowResults(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((plant, index) => (
            <div
              key={plant.id}
              onClick={() => handleSelect(plant)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-green-50 ${
                index === selectedIndex ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{plant.name}</div>
                  {plant.scientificName && (
                    <div className="text-sm text-gray-700 italic mt-1">{plant.scientificName}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plant.plantType && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                        {plant.plantType.replace(/_/g, ' ')}
                      </span>
                    )}
                    {plant.growingSeason && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        {plant.growingSeason}
                      </span>
                    )}
                    {plant.maturityTime && plant.maturityTime > 0 && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">
                        {plant.maturityTime} days
                      </span>
                    )}
                  </div>
                  {(plant.sunReq || plant.waterReq || plant.spaceReq) && (
                    <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                      {plant.sunReq && <div>☀️ {plant.sunReq}</div>}
                      {plant.waterReq && <div>💧 {plant.waterReq}</div>}
                      {plant.spaceReq && <div>📏 {plant.spaceReq}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-center">
          No plants found
        </div>
      )}
    </div>
  );
}

export default function PlantSearch(props: PlantSearchProps) {
  return (
    <DevLabel name="PlantSearch">
      <PlantSearchContent {...props} />
    </DevLabel>
  );
}
