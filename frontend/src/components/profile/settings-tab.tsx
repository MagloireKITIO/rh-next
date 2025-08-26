"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Brain, Users, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// Import the existing settings components
import { AIConfigurationSection } from "./sections/ai-configuration-section";
import { UserManagementSection } from "./sections/user-management-section";
import { SystemInfoSection } from "./sections/system-info-section";

interface SettingsTabProps {
  user: any;
}

export function SettingsTab({ user }: SettingsTabProps) {
  const { isAdmin } = useAuth();
  const isUserAdmin = isAdmin();
  const isHR = user?.role === 'hr';
  const canManageUsers = isUserAdmin;
  const canViewUsers = isUserAdmin || isHR;

  return (
    <div className="space-y-6">
      {/* AI Configuration - Admin only */}
      {isUserAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuration IA
              </CardTitle>
              <CardDescription>
                Gérez vos paramètres d'intelligence artificielle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIConfigurationSection />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* User Management */}
      {canViewUsers && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des utilisateurs
              </CardTitle>
              <CardDescription>
                {canManageUsers 
                  ? "Invitez et gérez les membres de votre équipe"
                  : "Consultez les membres de votre équipe"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementSection 
                canManage={canManageUsers}
                canView={canViewUsers}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informations système
            </CardTitle>
            <CardDescription>
              Informations sur la plateforme et votre utilisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemInfoSection user={user} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}