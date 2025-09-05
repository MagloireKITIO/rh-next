'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthApi, User } from '@/lib/api-client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await adminAuthApi.getProfile();
      const userData = response.data;
      
      // Vérifier que l'utilisateur est super admin
      if (userData.role !== 'super_admin') {
        toast.error('Accès refusé : Vous devez être super administrateur');
        localStorage.removeItem('admin_token');
        setUser(null);
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      localStorage.removeItem('admin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 Context login appelé avec:', { email });
      console.log('🌐 URL de base API:', process.env.NEXT_PUBLIC_BACKEND_URL);
      
      const response = await adminAuthApi.login(email, password);
      console.log('📡 Réponse API reçue:', response);
      
      const { access_token, user: userData } = response.data;
      console.log('👤 Données utilisateur:', userData);
      
      // Vérifier que l'utilisateur est super admin
      if (userData.role !== 'super_admin') {
        throw new Error('Accès refusé : Vous devez être super administrateur');
      }
      
      localStorage.setItem('admin_token', access_token);
      setUser(userData);
      toast.success(`Bienvenue ${userData.name} !`);
      console.log('✅ Login context terminé avec succès');
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: { message?: string } } };
      console.error('❌ Erreur dans login context:', err);
      console.error('❌ Error response dans context:', err?.response);
      console.error('❌ Error data dans context:', err?.response?.data);
      const message = err?.response?.data?.message || err?.message || 'Erreur de connexion';
      toast.error(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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