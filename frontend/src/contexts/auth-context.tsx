"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  domain: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'hr' | 'user';
  is_onboarded?: boolean;
  company?: Company;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signUpCompany: (email: string, password: string, name: string, companyName: string, companyDomain: string) => Promise<void>;
  acceptInvitation: (token: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name: string; email: string }) => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Vérifier d'abord s'il y a un token JWT stocké
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Récupérer le profil utilisateur via notre backend
          const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setLoading(false);
            return;
          } else {
            // Token invalide, le supprimer
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          localStorage.removeItem('token');
        }
      }

      // Pas de fallback Supabase - tout doit passer par notre API
      // Si pas de token valide, l'utilisateur n'est pas connecté
      setLoading(false);
    };

    initializeAuth();

    // Pas de listener Supabase - on gère tout via notre API
    // L'état est géré uniquement via le token JWT de notre backend
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/success`,
        },
      });

      if (error) throw error;
      
      toast.success('Inscription réussie! Vérifiez votre email pour confirmer votre compte.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Connexion via notre backend pour obtenir le token JWT
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email ou mot de passe incorrect');
      }

      // Stocker le token JWT
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
      }
      
      toast.success('Connexion réussie!');
    } catch (error: any) {
      toast.error('Email ou mot de passe incorrect');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error('Erreur lors de la connexion avec Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpCompany = async (email: string, password: string, name: string, companyName: string, companyDomain: string) => {
    setLoading(true);
    try {
      // Utiliser l'approche standard avec apiClient mais pour l'auth
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/company-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          companyName,
          companyDomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      // Plus de token - l'utilisateur doit vérifier son email
      // Le message du backend indique qu'il faut vérifier l'email
      toast.success('Entreprise créée avec succès! ' + data.message);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription de l\'entreprise');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string, password: string) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitation_token: token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'acceptation de l\'invitation');
      }

      // Connexion automatique après acceptation
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
      }

      toast.success('Invitation acceptée avec succès!');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'acceptation de l\'invitation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Nettoyer l'état local d'abord
      localStorage.removeItem('token');
      setUser(null);
      
      // Essayer de déconnecter Supabase, mais ne pas bloquer si ça échoue
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== 'Auth session missing!') {
        console.warn('Avertissement déconnexion Supabase:', error.message);
      }
      
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.warn('Erreur déconnexion Supabase (ignorée):', error);
      
      // L'état local est déjà nettoyé, donc la déconnexion fonctionne
      toast.success('Déconnexion réussie');
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isHR = (): boolean => {
    return user?.role === 'hr' || user?.role === 'admin';
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      const result = await response.json();
      setUser(prev => prev ? { ...prev, ...result.user } : null);
      
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signUpCompany,
    acceptInvitation,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    updateProfile,
    hasRole,
    isAdmin,
    isHR,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}