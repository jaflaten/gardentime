'use client';

import { useDevMode } from '@/contexts/DevModeContext';
import { ReactNode } from 'react';

interface DevLabelProps {
  name: string;
  children: ReactNode;
}

/**
 * Wraps a component with a yellow outline and label when dev mode is enabled.
 * Use this to make components identifiable during development.
 */
export default function DevLabel({ name, children }: DevLabelProps) {
  const { isDevMode } = useDevMode();

  if (!isDevMode) {
    return <>{children}</>;
  }

  return (
    <div className="relative outline outline-2 outline-yellow-400">
      <span className="absolute -top-5 left-0 bg-yellow-400 text-black text-xs font-mono px-1 py-0.5 rounded-t z-50 whitespace-nowrap">
        {name}
      </span>
      {children}
    </div>
  );
}
