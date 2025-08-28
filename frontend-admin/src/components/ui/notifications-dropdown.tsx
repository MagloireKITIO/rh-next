"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Users, Settings, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: 'team_request' | 'system' | 'project';
  title: string;
  description: string;
  count?: number;
  icon: React.ReactNode;
  action: () => void;
  timestamp?: Date;
}

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const router = useRouter();
  const { notificationsCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Construire la liste des notifications
    const notificationsList: NotificationItem[] = [];

    if (notificationsCount > 0) {
      notificationsList.push({
        id: 'team-requests',
        type: 'team_request',
        title: 'Demandes d\'équipe',
        description: `${notificationsCount} nouvelle${notificationsCount > 1 ? 's' : ''} demande${notificationsCount > 1 ? 's' : ''}`,
        count: notificationsCount,
        icon: <Users className="w-4 h-4" />,
        action: () => {
          // Ouvrir le modal depuis les settings
          router.push('/settings');
          // Après un court délai, déclencher l'ouverture du modal
          setTimeout(() => {
            const event = new CustomEvent('openTeamRequestsModal');
            window.dispatchEvent(event);
          }, 100);
          onClose();
        }
      });
    }

    // Ici on pourra ajouter d'autres types de notifications
    // Par exemple :
    // - Notifications système
    // - Notifications projet
    // - Mises à jour importantes

    setNotifications(notificationsList);
  }, [notificationsCount, router, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay pour fermer le dropdown */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-80 z-50">
        <Card className="shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={notification.action}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        notification.type === 'team_request' && "bg-indigo-100 text-indigo-600",
                        notification.type === 'system' && "bg-green-100 text-green-600",
                        notification.type === 'project' && "bg-blue-100 text-blue-600"
                      )}>
                        {notification.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          {notification.count && (
                            <Badge className="ml-2 bg-red-500 text-white text-xs">
                              {notification.count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.description}
                        </p>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-xs"
                onClick={() => {
                  router.push('/settings');
                  onClose();
                }}
              >
                <Settings className="w-3 h-3 mr-1" />
                Voir tous les paramètres
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}