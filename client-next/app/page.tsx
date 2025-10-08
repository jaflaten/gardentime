'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/gardens');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to RegenGarden
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Manage your gardens, track your crops, and plan your growing seasons with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg font-medium hover:bg-green-50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Track Your Gardens</h3>
            <p className="text-gray-600">
              Organize multiple gardens and growing areas in one place.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-gray-900">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Monitor Crops</h3>
            <p className="text-gray-600">
              Keep detailed records of what you plant and harvest.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-gray-900">
            <div className="text-3xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Plan Ahead</h3>
            <p className="text-gray-600">
              Make informed decisions based on your garden history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
