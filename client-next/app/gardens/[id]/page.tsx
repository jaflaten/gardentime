'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Default garden page - redirects to dashboard
 * The dashboard is now the landing page for gardens
 */
export default function GardenPage() {
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;

  useEffect(() => {
    if (gardenId) {
      router.replace(`/gardens/${gardenId}/dashboard`);
    }
  }, [gardenId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading dashboard...</div>
    </div>
  );
}
