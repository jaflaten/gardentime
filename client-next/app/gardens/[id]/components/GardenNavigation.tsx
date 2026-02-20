'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Grid3x3, Calendar, Download } from 'lucide-react';
import DevLabel from '@/components/DevLabel';

interface GardenNavigationProps {
  gardenId: string;
  gardenName?: string;
  onExport?: () => void;
}

function GardenNavigationContent({ gardenId, gardenName, onExport }: GardenNavigationProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === `/gardens/${gardenId}/dashboard`) {
      return pathname === `/gardens/${gardenId}/dashboard` || pathname === `/gardens/${gardenId}`;
    }
    return pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: `/gardens/${gardenId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: 'Season Plan',
      path: `/gardens/${gardenId}/season-plan`,
      icon: Calendar,
    },
    {
      name: 'Grow Areas',
      path: `/gardens/${gardenId}/grow-areas`,
      icon: List,
    },
    {
      name: 'Board',
      path: `/gardens/${gardenId}/board`,
      icon: Grid3x3,
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {gardenName && (
          <div className="py-3 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">{gardenName}</h1>
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                title="Export garden configuration"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        )}
        <nav className="flex space-x-8" aria-label="Garden navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors
                  ${
                    active
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function GardenNavigation(props: GardenNavigationProps) {
  return (
    <DevLabel name="GardenNavigation">
      <GardenNavigationContent {...props} />
    </DevLabel>
  );
}
