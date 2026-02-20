'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDevMode } from '@/contexts/DevModeContext';
import DevLabel from '@/components/DevLabel';

interface NavbarProps {
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  showSearch?: boolean;
}

function NavbarContent({ breadcrumbs, showSearch = true }: NavbarProps) {
  const router = useRouter();
  const { isAuthenticated, username, firstName, logout } = useAuth();
  const { isDevMode, toggleDevMode } = useDevMode();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = firstName || username;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/gardens" className="text-2xl font-bold text-green-600 hover:text-green-700 transition">
              RegenGarden
            </Link>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400">/</span>
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-green-600 hover:text-green-700 font-medium transition"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-800 font-medium">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDevMode}
              className={`px-3 py-1 text-xs font-mono rounded transition ${
                isDevMode 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title="Toggle component labels for development"
            >
              {isDevMode ? '🏷️ DEV ON' : '🏷️ DEV'}
            </button>
            {isAuthenticated && showSearch && (
              <Link
                href="/search"
                className="px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium transition"
              >
                🔍 Search
              </Link>
            )}
            {isAuthenticated && displayName && (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-green-600 transition"
                  title="Profile"
                >
                  Welcome, {displayName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar(props: NavbarProps) {
  return (
    <DevLabel name="Navbar">
      <NavbarContent {...props} />
    </DevLabel>
  );
}
