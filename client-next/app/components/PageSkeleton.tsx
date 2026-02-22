'use client';

interface PageSkeletonProps {
  message?: string;
}

/**
 * Simple loading skeleton for protected pages while auth is being verified.
 */
export default function PageSkeleton({ message = 'Loading...' }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">{message}</div>
    </div>
  );
}
