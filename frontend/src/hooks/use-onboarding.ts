"use client";

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/contexts/auth-context';

export const useOnboarding = () => {
  const { user, refreshProfile } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const driverConfig = {
    showProgress: true,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    popoverClass: 'onboarding-popover',
    progressText: 'Étape {{current}} sur {{total}}',
    nextBtnText: 'Suivant →',
    prevBtnText: '← Précédent',
    doneBtnText: 'Terminer ✨',
    closeBtnText: 'Ignorer',
    steps: [
      {
        element: '#welcome-banner',
        popover: {
          title: '🎉 Bienvenue dans votre plateforme RH !',
          description: 'Félicitations ! Votre entreprise est maintenant configurée. Laissez-nous vous faire découvrir les fonctionnalités principales.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#create-project-btn',
        popover: {
          title: '📁 Créer votre premier projet',
          description: 'Commencez par créer un projet de recrutement. C\'est ici que vous définirez le poste et les critères de sélection.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#projects-list',
        popover: {
          title: '📋 Vos projets de recrutement',
          description: 'Tous vos projets apparaîtront ici. Vous pourrez suivre leur progression et voir les candidats analysés.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#stats-overview',
        popover: {
          title: '📊 Tableau de bord analytique',
          description: 'Consultez vos statistiques : nombre de candidats, analyses terminées, et un aperçu de vos meilleurs profils.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '#settings-link',
        popover: {
          title: '⚙️ Configuration',
          description: 'Configurez vos clés API IA, invitez votre équipe et personnalisez vos prompts d\'analyse.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '#user-menu',
        popover: {
          title: '👤 Menu utilisateur',
          description: 'Accédez à votre profil, gérez votre compte et déconnectez-vous depuis ce menu.',
          side: 'bottom',
          align: 'end'
        }
      }
    ],
    onDestroyed: async () => {
      setIsOnboarding(false);
      setHasStarted(true);
      await markAsOnboarded();
      await refreshProfile(); // Rafraîchir le profil pour mettre à jour is_onboarded
    }
  };

  const startOnboarding = () => {
    if (hasStarted || isOnboarding) return; // Empêcher les multiples exécutions
    
    setIsOnboarding(true);
    setHasStarted(true);
    const driverInstance = driver(driverConfig);
    driverInstance.drive();
  };

  const markAsOnboarded = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/mark-onboarded`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('✅ Utilisateur marqué comme onboardé');
      }
    } catch (error) {
      console.error('❌ Erreur lors du marquage onboarding:', error);
    }
  };

  // Auto-start onboarding for new users
  useEffect(() => {
    // Vérifier d'abord le localStorage pour éviter les onboarding répétés
    const localOnboardingCompleted = localStorage.getItem('onboarding_completed');
    
    if (localOnboardingCompleted === 'true') {
      console.log('🚫 Onboarding ignoré: Déjà complété localement');
      return;
    }
    
    // Attendre que les données utilisateur soient complètement chargées
    // is_onboarded doit être explicitement false, pas undefined
    if (user && user.is_onboarded === false && !isOnboarding && !hasStarted) {
      console.log('✅ Déclenchement onboarding pour utilisateur non onboardé', {
        user_email: user.email,
        is_onboarded: user.is_onboarded,
        isOnboarding,
        hasStarted
      });
      
      // Délai pour laisser le DOM se charger
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);

      return () => clearTimeout(timer);
    } else if (user) {
      console.log('🚫 Onboarding non déclenché:', {
        user_email: user.email,
        is_onboarded: user.is_onboarded,
        isOnboarding,
        hasStarted,
        reason: user.is_onboarded === undefined ? 'Données en cours de chargement' : 
                user.is_onboarded === true ? 'Déjà onboardé' : 
                isOnboarding ? 'Déjà en cours' :
                hasStarted ? 'Déjà commencé' : 'Autre'
      });
      
      // Si l'utilisateur est onboardé dans l'API, marquer localement aussi
      if (user.is_onboarded === true && !localOnboardingCompleted) {
        console.log('📝 Synchronisation localStorage avec API');
        localStorage.setItem('onboarding_completed', 'true');
      }
    }
  }, [user?.is_onboarded, hasStarted, isOnboarding]);

  return {
    startOnboarding,
    isOnboarding,
    shouldShowOnboarding: user && !user.is_onboarded && !hasStarted
  };
};