"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthLoader } from "@/components/ui/auth-loader";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          toast.error('Erreur lors de l\'authentification');
          router.push('/auth/login');
          return;
        }

        if (data.session) {
          // Authentifier avec notre backend pour obtenir le JWT et le profil complet
          try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: data.session.access_token
              }),
            });

            const authData = await response.json();

            if (response.ok && authData.access_token) {
              // Stocker le JWT de notre backend
              localStorage.setItem('token', authData.access_token);
              
              // Actualiser le profil utilisateur pour récupérer le rôle et l'état d'onboarding
              await refreshProfile();
              
              // Check if this is a company signup flow
              const isCompanySignup = localStorage.getItem('google_company_signup');
              
              if (isCompanySignup) {
                localStorage.removeItem('google_company_signup');
                toast.success('Email vérifié ! Complétez votre entreprise.');
                router.push('/auth/complete-company');
              } else {
                toast.success('Email vérifié avec succès ! Connexion réussie.');
                router.push('/dashboard');
              }
            } else {
              throw new Error(authData.message || 'Erreur d\'authentification');
            }
          } catch (error: any) {
            console.error('Erreur lors de l\'authentification:', error);
            toast.error('Erreur lors de l\'authentification: ' + error.message);
            router.push('/auth/login');
          }
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Erreur inattendue');
        router.push('/auth/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <AuthLoader 
      message="Finalisation de la connexion..."
      submessage="Veuillez patienter pendant que nous vous connectons"
    />
  );
}