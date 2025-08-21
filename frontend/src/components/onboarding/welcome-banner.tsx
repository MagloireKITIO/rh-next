"use client";

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Building, Users } from 'lucide-react';
import { useOnboarding } from '@/hooks/use-onboarding';

export function WelcomeBanner() {
  const { user } = useAuth();
  const { startOnboarding, shouldShowOnboarding, isOnboarding } = useOnboarding();

  if (!shouldShowOnboarding) {
    return null;
  }

  return (
    <Card id="welcome-banner" className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">
                Bienvenue {user?.name} ! 🎉
              </h2>
              <p className="text-white/90 text-sm">
                {user?.company ? (
                  <>
                    <Building className="w-4 h-4 inline mr-1" />
                    {user.company.name} est maintenant configurée
                  </>
                ) : (
                  "Votre compte est prêt à l'usage"
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right text-sm text-white/90">
              <p>Découvrez votre nouvelle</p>
              <p className="font-semibold">plateforme RH intelligente</p>
            </div>
            <Button
              onClick={startOnboarding}
              disabled={isOnboarding}
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-white/90 font-medium disabled:opacity-50"
            >
              <Users className="w-4 h-4 mr-2" />
              {isOnboarding ? 'Visite en cours...' : 'Commencer la visite'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}