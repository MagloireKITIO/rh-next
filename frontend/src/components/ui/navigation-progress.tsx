"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationProgressProps {
  height?: number;
  color?: string;
  showOnFetch?: boolean;
}

export function NavigationProgress({ 
  height = 3, 
  color = "rgb(59 130 246)", // blue-500
  showOnFetch = true 
}: NavigationProgressProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // TanStack Query states
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const hasQueryActivity = isFetching > 0 || isMutating > 0;

  // Navigation loading state
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    if (isLoading || (showOnFetch && hasQueryActivity)) {
      setProgress(0);
      
      // Simulate progress animation
      const updateProgress = () => {
        setProgress(prev => {
          if (prev < 90) {
            // Progresser plus vite au début, plus lent vers la fin
            const increment = prev < 30 ? 10 : prev < 70 ? 5 : 2;
            return Math.min(prev + increment + Math.random() * 5, 90);
          }
          return prev;
        });
      };

      // Démarrer l'animation de progression
      progressTimer = setInterval(updateProgress, 200);

      // Nettoyer si ça prend trop longtemps
      timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 10000);
    } else {
      // Finir la progression rapidement
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isLoading, hasQueryActivity, showOnFetch]);

  // Hook pour détecter les changements de route (navigation côté client)
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleComplete = () => {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    };

    // Écouter les changements de hash et les clics sur les liens
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href !== window.location.href) {
        // Vérifier si c'est un lien interne
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          handleStart();
          
          // Nettoyer après un délai raisonnable
          setTimeout(handleComplete, 500);
        }
      }
    };

    // Écouter les changements d'historique (bouton retour/suivant)
    const handlePopState = () => {
      handleStart();
      setTimeout(handleComplete, 300);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const shouldShow = isLoading || (showOnFetch && hasQueryActivity) || progress > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
          style={{ height: `${height}px` }}
        >
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"
            style={{
              background: `linear-gradient(90deg, ${color}, ${color}dd, ${color})`,
              boxShadow: `0 0 10px ${color}66`,
            }}
            initial={{ width: "0%" }}
            animate={{ 
              width: `${progress}%`,
              transition: {
                duration: progress === 100 ? 0.3 : 0.5,
                ease: progress === 100 ? "easeOut" : "easeInOut"
              }
            }}
          />
          
          {/* Effet de brillance */}
          {progress > 0 && progress < 100 && (
            <motion.div
              className="absolute top-0 right-0 w-20 h-full opacity-60"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}aa, transparent)`,
                transform: "skewX(-20deg)",
              }}
              animate={{
                x: ["-100px", "100px"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}