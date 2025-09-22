'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PlatformSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    destructiveColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  branding: {
    logoUrl: string;
    title: string;
    favicon: string;
    companyName: string;
  };
  layout: {
    showHeader: boolean;
    showFooter: boolean;
    sidebarStyle: 'collapsed' | 'expanded' | 'hidden';
  };
  pageSettings: {
    [pageName: string]: {
      header: { enabled: boolean; content: string };
      footer: { enabled: boolean; content: string };
    };
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Hook pour récupérer les paramètres de la plateforme
export function usePlatformSettings() {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/platform-settings/visual-identity`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paramètres');
      }
      return response.json() as PlatformSettings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    settings,
    isLoading,
    error
  };
}

// Hook pour appliquer dynamiquement les paramètres de thème
export function useApplyTheme() {
  const { settings } = usePlatformSettings();
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Appliquer les couleurs du thème
    if (settings.theme) {
      root.style.setProperty('--primary', settings.theme.primaryColor);
      root.style.setProperty('--secondary', settings.theme.secondaryColor);
      root.style.setProperty('--accent', settings.theme.accentColor);
      root.style.setProperty('--destructive', settings.theme.destructiveColor);
      root.style.setProperty('--radius', settings.theme.borderRadius);

      // Appliquer la police
      if (settings.theme.fontFamily) {
        document.body.style.fontFamily = settings.theme.fontFamily;
      }
    }

    // Appliquer le branding
    if (settings.branding) {
      // Changer le titre de la page
      if (settings.branding.title) {
        document.title = settings.branding.title;
      }

      // Changer le favicon si spécifié
      if (settings.branding.favicon) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.branding.favicon;
      }
    }

    setIsApplied(true);

    // Émettre un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('platform-settings-applied', {
      detail: settings
    }));

  }, [settings]);

  return isApplied;
}

// Hook pour récupérer les paramètres d'une page spécifique
export function usePageSettings(pageName: string) {
  const { settings } = usePlatformSettings();

  const pageSettings = settings?.pageSettings?.[pageName] || {
    header: { enabled: false, content: '' },
    footer: { enabled: false, content: '' }
  };

  return {
    header: pageSettings.header,
    footer: pageSettings.footer,
    layout: settings?.layout
  };
}

// Hook pour appliquer les classes CSS dynamiques
export function useDynamicClasses() {
  const { settings } = usePlatformSettings();

  return {
    sidebar: settings?.layout?.sidebarStyle === 'hidden' ? 'hidden' :
             settings?.layout?.sidebarStyle === 'collapsed' ? 'w-16' : 'w-64',
    header: settings?.layout?.showHeader === false ? 'hidden' : 'block',
    footer: settings?.layout?.showFooter === false ? 'hidden' : 'block'
  };
}