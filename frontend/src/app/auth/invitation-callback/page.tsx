"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function InvitationCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleInvitationCallback = () => {
      // Récupérer le token depuis les paramètres URL ou le hash
      const token = searchParams.get('token') || 
                   searchParams.get('access_token') ||
                   new URLSearchParams(window.location.hash.substring(1)).get('access_token');

      if (token) {
        // Rediriger vers la page d'invitation avec le token
        router.push(`/auth/invitation?token=${encodeURIComponent(token)}`);
      } else {
        console.error('❌ Token d\'invitation manquant dans le callback');
        router.push('/auth/login?error=invitation_token_missing');
      }
    };

    // Délai pour s'assurer que tous les paramètres sont disponibles
    const timer = setTimeout(handleInvitationCallback, 100);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <div className="text-center">
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Vérification de votre invitation...
        </p>
      </div>
    </div>
  );
}

export default function InvitationCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    }>
      <InvitationCallbackContent />
    </Suspense>
  );
}