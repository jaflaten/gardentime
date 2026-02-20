'use client';

import { useState, useEffect, useRef } from 'react';
import { growAreaService, GrowArea } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DevLabel from '@/components/DevLabel';

interface GrowAreaSearchProps {
  placeholder?: string;
  onSelect?: (growArea: GrowArea) => void;
  autoFocus?: boolean;
  className?: string;
}

function GrowAreaSearchContent({
  placeholder = 'Search grow areas...',
  onSelect,
  autoFocus = false,
  className = ''
}: GrowAreaSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GrowArea[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      const searchResults = await growAreaService.search(searchQuery);
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

  const handleSelect = (growArea: GrowArea) => {
    if (onSelect) {
      onSelect(growArea);
    } else {
      // Default behavior: navigate to grow area detail page
      router.push(`/gardens/${growArea.gardenId}/grow-areas/${growArea.id}`);
    }
    setQuery('');
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
          {results.map((growArea, index) => (
            <div
              key={growArea.id}
              onClick={() => handleSelect(growArea)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-green-50 ${
                index === selectedIndex ? 'bg-green-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{growArea.name}</div>
              <div className="text-sm text-gray-700 mt-1">
                {growArea.zoneType && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded mr-2">
                    {growArea.zoneType}
                  </span>
                )}
                {growArea.zoneSize && <span>{growArea.zoneSize}</span>}
                {growArea.notes && (
                  <span className="block mt-1 text-gray-600 truncate">{growArea.notes}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-center">
          No grow areas found
        </div>
      )}
    </div>
  );
}

export default function GrowAreaSearch(props: GrowAreaSearchProps) {
  return (
    <DevLabel name="GrowAreaSearch">
      <GrowAreaSearchContent {...props} />
    </DevLabel>
  );
}
