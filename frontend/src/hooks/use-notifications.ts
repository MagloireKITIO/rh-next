"use client";

import { useState, useEffect, useCallback } from 'react';
import { teamRequestsApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

export function useNotifications() {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotificationsCount = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await teamRequestsApi.getNotificationsCount();
      setNotificationsCount(response.data.count);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError(err.message || 'Erreur lors de la récupération des notifications');
      setNotificationsCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Recharger les notifications
  const refreshNotifications = useCallback(() => {
    if (user) {
      fetchNotificationsCount();
    }
  }, [fetchNotificationsCount, user]);

  useEffect(() => {
    fetchNotificationsCount();
  }, [fetchNotificationsCount]);

  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotificationsCount();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [fetchNotificationsCount, user]);

  return {
    notificationsCount,
    loading,
    error,
    refreshNotifications,
  };
}