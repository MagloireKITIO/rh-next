'use client';

import { ReactNode } from 'react';
import { useApplyTheme } from '@/hooks/use-platform-settings';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PlatformSettingsProviderProps {
  children: ReactNode;
}

export function PlatformSettingsProvider({ children }: PlatformSettingsProviderProps) {
  const isThemeApplied = useApplyTheme();

  // Afficher un loader jusqu'à ce que le thème soit appliqué
  if (!isThemeApplied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de la plateforme..." />
      </div>
    );
  }

  return <>{children}</>;
}