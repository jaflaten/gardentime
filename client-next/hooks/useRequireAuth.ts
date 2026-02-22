'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseRequireAuthOptions {
  redirectTo?: string;
}

interface UseRequireAuthResult {
  isReady: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  username: string | null;
  firstName: string | null;
  logout: () => void;
}

/**
 * Hook that enforces authentication on protected pages.
 * Automatically redirects to login if user is not authenticated.
 * 
 * Usage:
 * ```tsx
 * export default function ProtectedPage() {
 *   const { isReady, username } = useRequireAuth();
 *   
 *   if (!isReady) return <PageSkeleton />;
 *   
 *   return <div>Welcome {username}</div>;
 * }
 * ```
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthResult {
  const { redirectTo = '/login' } = options;
  const router = useRouter();
  const { isAuthenticated, isLoading, username, firstName, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    isReady: !isLoading && isAuthenticated,
    isLoading,
    isAuthenticated,
    username,
    firstName,
    logout,
  };
}
