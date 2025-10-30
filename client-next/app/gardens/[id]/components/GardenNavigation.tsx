'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Grid3x3 } from 'lucide-react';

interface GardenNavigationProps {
  gardenId: string;
  gardenName?: string;
}

export default function GardenNavigation({ gardenId, gardenName }: GardenNavigationProps) {
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
          <div className="py-3 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-900">{gardenName}</h1>
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
